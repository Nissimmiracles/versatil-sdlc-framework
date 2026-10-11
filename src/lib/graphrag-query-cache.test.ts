/** Real bounded memoization over trusted cache; no visibility policy or measured-speed claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode, type GraphRAGQuery } from './graphrag-store.js';
const backend = vi.hoisted(() => ({ nodes:new Map<string,any>(),edges:new Map<string,any>(),fetches:[] as string[],writes:0,
  transactions:0,callbacks:0,retry:false, failure:undefined as 'before'|'after'|undefined,
  gate:undefined as Promise<void>|undefined, getGate:undefined as Promise<void>|undefined,
  getGateCollection:'graphrag_nodes',readFailure:undefined as string|undefined,closeFailure:false,
  observe:undefined as (()=>void)|undefined, closeCalls:0 }));
vi.mock('@google-cloud/firestore',async importOriginal=>{
  const actual=await importOriginal<typeof import('@google-cloud/firestore')>();
  const copy=(value:any):any=>{
    if(value===null||typeof value!=='object')return value;
    if(value instanceof Date)return new Date(value.getTime());
    if(value instanceof actual.Timestamp)return new actual.Timestamp(value.seconds,value.nanoseconds);
    if(Buffer.isBuffer(value))return Buffer.from(value);
    if(value instanceof Uint8Array)return new Uint8Array(value);
    if(Array.isArray(value))return value.map(copy);
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,copy(v)]));
  };
  type Ref={collectionName:string;id:string};type Op={kind:'create'|'set'|'update';ref:Ref;data:any};
  const records=(name:string)=>{if(name==='graphrag_nodes')return backend.nodes;if(name==='graphrag_edges')return backend.edges;throw new Error('Unexpected collection');};
  const commit=async(operations:Op[])=>{
    backend.writes++;await backend.gate;
    const staged={graphrag_nodes:new Map([...backend.nodes].map(([id,v])=>[id,copy(v)])),graphrag_edges:new Map([...backend.edges].map(([id,v])=>[id,copy(v)]))};
    for(const op of operations){const table=staged[op.ref.collectionName as keyof typeof staged];
      if(op.kind==='create'&&table.has(op.ref.id))throw new Error('ALREADY_EXISTS');
      if(op.kind==='update'&&!table.has(op.ref.id))throw new Error('NOT_FOUND');
      table.set(op.ref.id,op.kind==='update'?{...table.get(op.ref.id),...copy(op.data)}:copy(op.data));}
    if(backend.failure==='before')throw new Error('KNOWN_BEFORE_COMMIT');
    for(const name of ['graphrag_nodes','graphrag_edges'] as const){const table=records(name);table.clear();for(const[id,v]of staged[name])table.set(id,v);}
    if(backend.failure==='after')throw new Error('AMBIGUOUS_AFTER_COMMIT');
  };
  class MockFirestore{
    collection(name:string){const table=records(name);return{
      get:async()=>{backend.fetches.push(name);if(name===backend.getGateCollection)await backend.getGate;
        const docs=[...table].map(([id,v])=>({id,data:()=>copy(v)}));
        return{docs,size:docs.length,empty:docs.length===0,forEach(callback:(doc:typeof docs[number])=>void){
          for(let i=0;i<docs.length;i++){callback(docs[i]);if(i===0&&backend.readFailure===name)throw new Error('PARTIAL_LOAD_FAILED');}}};},
      doc:(id:string)=>{const ref:Ref={collectionName:name,id};return{...ref,
        create:(data:any)=>commit([{kind:'create',ref,data}]),set:(data:any)=>commit([{kind:'set',ref,data}]),update:(data:any)=>commit([{kind:'update',ref,data}])};},};}
    batch(){const operations:Op[]=[];return{create(ref:Ref,data:any){operations.push({kind:'create',ref,data:copy(data)});return this;},commit:()=>commit(operations)};}
    async runTransaction(callback:(transaction:any)=>Promise<any>){backend.transactions++;
      const run=async()=>{const operations:Op[]=[];const tx={
        get:async(ref:Ref)=>{if(operations.length)throw new Error('READ_AFTER_WRITE');const record=copy(records(ref.collectionName).get(ref.id));return{exists:record!==undefined,data:()=>copy(record)};},
        create:(ref:Ref,data:any)=>{operations.push({kind:'create',ref,data:copy(data)});},set:(ref:Ref,data:any)=>{operations.push({kind:'set',ref,data:copy(data)});},};
        backend.callbacks++;const result=await callback(tx);backend.observe?.();return{result,operations};};
      if(backend.retry){await run();backend.retry=false;}const {result,operations}=await run();await commit(operations);return result;}
    async terminate(){backend.closeCalls++;await backend.gate;if(backend.closeFailure)throw new Error('CLOSE_FAILED');}
  }
  return{...actual,Firestore:MockFirestore};
});
function pattern(id='p1',effectiveness=0.9,usageCount=10):GraphNode{return{id,type:'pattern',label:id,properties:{pattern:'React hooks',agent:'agent-x',category:'ui',effectiveness,timeSaved:1,tags:['cache'],usageCount,
  lastUsed:new Date(1000),timestamp:new Timestamp(3,5),bytes:Buffer.from([1,2]),octets:new Uint8Array([3,4]),nested:{value:'original'}},connections:['tech_react'],privacy:{userId:'fixture-user',isPublic:false}};}
function simple(id:string,connections:string[]=[]):GraphNode{return{id,type:'concept',label:id,properties:{},connections};}
beforeEach(()=>{
  backend.nodes.clear();backend.edges.clear();backend.fetches=[];backend.writes=0;backend.transactions=0;backend.callbacks=0;
  backend.retry=false;backend.failure=undefined;backend.gate=undefined;backend.getGate=undefined;backend.getGateCollection='graphrag_nodes';backend.readFailure=undefined;
  backend.closeFailure=false;backend.observe=undefined;backend.closeCalls=0;vi.restoreAllMocks();
  for(const n of [pattern(),pattern('p2',0.5,0),{...simple('tech_react',['p1','p2']),type:'technology' as const},{...simple('agent_agent-x',['p1','p2']),type:'agent' as const},{...simple('category_ui',['p1','p2']),type:'category' as const},simple('concept_cache',['p1','p2'])])backend.nodes.set(n.id,n);
});
const request=(extra:Partial<GraphRAGQuery>={})=>({query:'React',userId:'fixture-user',...extra});
async function loaded(){const store=new GraphRAGStore();await store.initialize();return store;}
async function cached(){const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');const result=await store.query(request());expect(result.map(r=>r.pattern.id)).toEqual(['p1','p2']);expect(store.isCacheValid()).toBe(true);return{store,spy,result};}
const gate=()=>{let release!:()=>void;const promise=new Promise<void>(resolve=>{release=resolve;});return{promise,release};};
async function until(condition:()=>boolean){for(let i=0;i<100&&!condition();i++)await Promise.resolve();expect(condition()).toBe(true);}
function balanced(store:GraphRAGStore){expect(store['outstandingGraphMutations']).toBe(0);}

describe('GraphRAG genuine query memoization and explicit ownership',()=>{
  it('physically avoids extraction/calculation on a real hit, with positive and negative validity controls',async()=>{
    const store=await loaded();expect(store.isCacheValid()).toBe(false);const spy=vi.spyOn(store as any,'extractEntities');
    const first=await store.query(request());expect(first.map(r=>r.pattern.id)).toEqual(['p1','p2']);expect(spy).toHaveBeenCalledTimes(1);
    expect(store.isCacheValid()).toBe(true);const second=await store.query(request());expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);expect(second).not.toBe(first);expect(second[0].pattern).not.toBe(first[0].pattern);
    expect(backend.fetches).toEqual(['graphrag_nodes','graphrag_edges']);expect(backend.writes).toBe(0);balanced(store);
  });
  it('keeps the legacy calculation values/ranking/defaults exactly while intentionally removing first-result aliases',async()=>{
    const store=await loaded();const q=request({limit:0,minRelevance:0,tags:['cache']});
    const legacy=store['computeQuery'](q);expect(legacy[0].pattern).toBe(store['nodes'].get(legacy[0].pattern.id));
    const actual=await store.query(q);expect(actual).toEqual(legacy);expect(actual.length).toBe(2);
    expect(actual[0].pattern).not.toBe(store['nodes'].get(actual[0].pattern.id));expect(store.isCacheValid()).toBe(true);
  });
  it('detaches initial/hit paths and Date/Timestamp/bytes/nested properties without corrupting cache or graph',async()=>{
    const {store,result,spy}=await cached();result[0].pattern.properties.effectiveness=0;result[0].pattern.properties.nested.value='edited';
    result[0].pattern.properties.lastUsed.setTime(9);result[0].pattern.properties.bytes[0]=9;result[0].pattern.properties.octets[0]=9;result[0].graphPath.push('invented');
    const hit=await store.query(request());hit[0].pattern.properties.timestamp= new Timestamp(7,9);hit[0].graphPath.push('edited');
    const again=await store.query(request());expect(spy).toHaveBeenCalledTimes(1);
    expect(again[0].pattern.properties.nested.value).toBe('original');expect(again[0].pattern.properties.lastUsed.getTime()).toBe(1000);
    expect(again[0].pattern.properties.timestamp.isEqual(new Timestamp(3,5))).toBe(true);expect(again[0].pattern.properties.bytes.toString('hex')).toBe('0102');
    expect(again[0].pattern.properties.octets[0]).toBe(3);expect(again[0].graphPath).toEqual(['tech_react','p1']);
    expect(store.getNode('p1')!.properties.effectiveness).toBe(0.9);
  });
  it.each([
    {query:'React second'}, {agent:'agent-x'}, {category:'ui'}, {tags:['cache']}, {limit:1}, {minRelevance:0.4},
    {userId:'scope-user'}, {teamId:'scope-team'}, {projectId:'scope-project'}, {includePublic:false},
  ])('retains every selector/scope field in collision-free keys with explicit fixture scope selection',async variation=>{
    const {store,spy}=await cached();await store.query(request(variation));expect(spy).toHaveBeenCalledTimes(2);
    await store.query(request(variation));expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(true);
  });
  it.each(['agent','category','tags','limit','minRelevance','userId','teamId','projectId','includePublic'] as const)('distinguishes missing from own undefined for %s',async field=>{
      const {store,spy}=await cached();const q=request();delete q[field];await store.query(q);const before=spy.mock.calls.length;Object.defineProperty(q,field,{value:undefined,enumerable:true});
      await store.query(q);expect(spy).toHaveBeenCalledTimes(before+1);await store.query(q);expect(spy).toHaveBeenCalledTimes(before+1);
    });
  it('distinguishes ordered tags and delimiter-like field contents',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    for(const q of [request({tags:['cache','react']}),request({tags:['react','cache']}),request({userId:'a|b',teamId:'c'}),request({userId:'a',teamId:'b|c'})])await store.query(q);
    expect(spy).toHaveBeenCalledTimes(4);expect(store['queryResults'].size).toBe(4);
  });
  it.each(['limit','minRelevance'] as const)('explicitly encodes negative zero independently for %s without changing defaults',async field=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');const first=await store.query(request({[field]:0}));const next=await store.query(request({[field]:-0}));
    expect(next).toEqual(first);expect(spy).toHaveBeenCalledTimes(2);await store.query(request({[field]:-0}));expect(spy).toHaveBeenCalledTimes(2);
  });
  it('captures input only after initial loading so caller edits cannot associate stale keys with changed results',async()=>{
    const hold=gate();backend.getGate=hold.promise;const store=new GraphRAGStore();const q=request();const pending=store.query(q);
    try{await until(()=>backend.fetches.length>0);q.query='React modified';}finally{backend.getGate=undefined;hold.release();}
    const first=await pending;expect(first.length).toBe(2);const spy=vi.spyOn(store as any,'extractEntities');
    expect(await store.query(request({query:'React modified'}))).toEqual(first);expect(spy).not.toHaveBeenCalled();
    await store.query(request());expect(spy).toHaveBeenCalledTimes(1);balanced(store);
  });
  it('memoizes real empty results, with extraction hit evidence and no fabricated pattern',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    expect(await store.query({query:'unrecognized'})).toEqual([]);expect(store.isCacheValid()).toBe(true);
    expect(await store.query({query:'unrecognized'})).toEqual([]);expect(spy).toHaveBeenCalledTimes(1);
    expect((await store.query(request())).length).toBe(2);expect(spy).toHaveBeenCalledTimes(2);
  });
  it('enforces32 FIFO entries and proves eviction/recomputation rather than just a size field',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    for(let i=0;i<33;i++)await store.query(request({query:`React ${i}`}));expect(spy).toHaveBeenCalledTimes(33);expect(store['queryResults'].size).toBe(32);
    await store.query(request({query:'React 1'}));expect(spy).toHaveBeenCalledTimes(33);await store.query(request({query:'React 0'}));expect(spy).toHaveBeenCalledTimes(34);
    expect(store['queryResults'].size).toBe(32);expect(store['queryResultBytes']).toBeLessThanOrEqual(262144);
  });
  it('enforces serialized byte budget independently of entry count with genuine nonempty outputs',async()=>{
    backend.nodes.get('p1').properties.padding='x'.repeat(30000);const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    for(let i=0;i<20;i++)expect((await store.query(request({query:`React ${i}`}))).length).toBe(2);
    expect(store['queryResults'].size).toBeGreaterThan(0);expect(store['queryResults'].size).toBeLessThan(20);expect(store['queryResultBytes']).toBeLessThanOrEqual(262144);
    await store.query(request({query:'React 19'}));expect(spy).toHaveBeenCalledTimes(20);await store.query(request({query:'React 0'}));expect(spy).toHaveBeenCalledTimes(21);
  });
  it('oversized entries are detached but never admitted; eligible followups still cache normally',async()=>{
    backend.nodes.get('p1').properties.padding='x'.repeat(70000);const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    const first=await store.query(request());first[0].pattern.properties.nested.value='edited';await store.query(request());expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(false);
    expect(store['memoizationDisabled']).toBe(false);expect(store['nodes'].get('p1')!.properties.nested.value).toBe('original');
    await store.query({query:'unknown'});expect(store.isCacheValid()).toBe(true);
  });
  it.each([
    (q:any)=>{q.extra=true;return q;}, (q:any)=>{q[Symbol('unknown')]=1;return q;},
    (q:any)=>Object.assign(Object.create({agent:'agent-x'}),q), (q:any)=>({...q,limit:Infinity}),
    (q:any)=>({...q,limit:NaN}), (q:any)=>({...q,limit:'2'}), (q:any)=>({...q,query:'React '+'x'.repeat(8200)}),
    (q:any)=>({...q,tags:Object.assign(['cache'],{extra:true})}), (q:any)=>({...q,tags:new Array(1)}),
  ])('unsafe input bypass keeps legacy result aliases and poisons future memoization for the instance',async make=>{
    const {store,spy}=await cached();const result=await store.query(make(request()));expect(result.length).toBe(2);
    expect(result[0].pattern).toBe(store['nodes'].get(result[0].pattern.id));expect(store.isCacheValid()).toBe(false);
    result[0].pattern.properties.effectiveness=0.1;result[0].pattern.properties.usageCount=0;
    const next=await store.query(request());expect(next.map(r=>r.pattern.id)).toEqual(['p2','p1']);expect(spy).toHaveBeenCalledTimes(3);
    await store.query(request());expect(spy).toHaveBeenCalledTimes(4);expect(store['memoizationDisabled']).toBe(true);
    store.clearCache();await store.initialize();await store.query(request());expect(store.isCacheValid()).toBe(false);
  });
  it('eligibility inspection invokes no getters while legacy query reads its selector exactly twice',async()=>{
    const {store,spy}=await cached();let invoked=0;const q:any={userId:'fixture-user'};Object.defineProperty(q,'query',{enumerable:true,get(){invoked++;return 'React';}});
    expect((await store.query(q)).length).toBe(2);expect(invoked).toBe(2);expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(false);
  });
  it('unknown getters remain unexecuted through inspection and legacy calculation',async()=>{
    const store=await loaded();let invoked=0;const q=request();Object.defineProperty(q,'unknown',{enumerable:true,get(){invoked++;throw new Error('UNEXPECTED');}});
    expect((await store.query(q)).length).toBe(2);expect(invoked).toBe(0);expect(store.isCacheValid()).toBe(false);
  });
  it('tag accessors retain their legacy single read; no extra eligibility invocation',async()=>{
    const store=await loaded();const tags=['cache'];let invoked=0;Object.defineProperty(tags,'0',{enumerable:true,get(){invoked++;return 'cache';}});
    expect((await store.query(request({tags}))).length).toBe(2);expect(invoked).toBe(1);expect(store.isCacheValid()).toBe(false);
  });
  it('query calculation exceptions propagate unchanged and never fabricate a valid entry',async()=>{
    const store=await loaded();let invoked=0;const q:any={};Object.defineProperty(q,'query',{get(){invoked++;throw new Error('LEGACY_QUERY_ERROR');}});
    await expect(store.query(q)).rejects.toThrow('LEGACY_QUERY_ERROR');expect(invoked).toBe(1);expect(store.isCacheValid()).toBe(false);
    expect(store['queryResults'].size).toBe(0);balanced(store);
  });
  it('unsupported-result fallback preserves aliases and permanently disables admission even after close/reload',async()=>{
    backend.nodes.get('p1').properties.unsupported=()=>1;const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    const result=await store.query(request());expect(result[0].pattern).toBe(store['nodes'].get('p1'));expect(store.isCacheValid()).toBe(false);
    delete result[0].pattern.properties.unsupported;result[0].pattern.properties.effectiveness=0.1;result[0].pattern.properties.usageCount=0;
    expect((await store.query(request())).map(r=>r.pattern.id)).toEqual(['p2','p1']);expect(spy).toHaveBeenCalledTimes(2);
    delete backend.nodes.get('p1').properties.unsupported;await store.close();await store.initialize();await store.query(request());
    expect(store['memoizationDisabled']).toBe(true);expect(store.isCacheValid()).toBe(false);balanced(store);
  });
});

describe('GraphRAG memoization mutation revisions and in-flight boundaries',()=>{
  it.each(['addNode','updateNode','batchAddNodes','addEdge','storePattern','incrementUsageCount','calculateCentrality','clearCache','close'] as const)('invalidates a populated cache for %s and recomputes a genuine result afterwards',async operation=>{
      if(operation==='addEdge')backend.nodes.set('p3',pattern('p3',0.8,5));
      const {store,spy}=await cached();
      if(operation==='addNode')await store.addNode(simple('new'));
      if(operation==='updateNode')await store.updateNode({id:'p1',properties:{...pattern().properties,effectiveness:0.1,usageCount:0}});
      if(operation==='batchAddNodes')await store.batchAddNodes([simple('new'),simple('other')]);
      if(operation==='addEdge')await store.addEdge({id:'react-p3',source:'tech_react',target:'p3',relationship:'uses',weight:1});
      if(operation==='storePattern')await store.storePattern(pattern('new-pattern') as any);
      if(operation==='incrementUsageCount')await store.incrementUsageCount('p1');
      if(operation==='calculateCentrality')await store.calculateCentrality();
      if(operation==='clearCache')store.clearCache();
      if(operation==='close')await store.close();
      expect(store.isCacheValid()).toBe(false);const callsAfterOperation=spy.mock.calls.length;const next=await store.query(request());expect(next.length).toBeGreaterThan(0);
      expect(spy).toHaveBeenCalledTimes(callsAfterOperation+1);expect(store.isCacheValid()).toBe(true);balanced(store);
      if(operation==='updateNode')expect(next.map(r=>r.pattern.id)).toEqual(['p2','p1']);
      if(operation==='addEdge')expect(next.map(r=>r.pattern.id)).toEqual(['p1','p3','p2']);
      if(operation==='calculateCentrality')expect(typeof next[0].pattern.centrality).toBe('number');
      if(operation==='storePattern')expect(next.map(r=>r.pattern.id)).toEqual(['p1','new-pattern','p2']);
      if(operation==='incrementUsageCount')expect(next.find(r=>r.pattern.id==='p1')!.pattern.properties.usageCount).toBe(11);
      expect(await store.query(request())).toEqual(next);expect(spy).toHaveBeenCalledTimes(callsAfterOperation+1);
    });
  it.each(['addNode','updateNode','batchAddNodes','addEdge','storePattern','incrementUsageCount','close'] as const)('never serves or admits entries while %s is awaiting its commit/close',async operation=>{
      const {store,spy}=await cached();const hold=gate();backend.gate=hold.promise;const oldWrites=backend.writes;
      const pending=operation==='addNode'?store.addNode(simple('new')):
        operation==='updateNode'?store.updateNode({id:'p1',label:'changed'}):
        operation==='batchAddNodes'?store.batchAddNodes([simple('new'),simple('other')]):
        operation==='addEdge'?store.addEdge({id:'p1-p2',source:'p1',target:'p2',relationship:'uses',weight:1}):
        operation==='storePattern'?store.storePattern(pattern('new-pattern') as any):operation==='incrementUsageCount'?store.incrementUsageCount('p1'):store.close();
      try{
        await until(()=>operation==='close'?backend.closeCalls>0:backend.writes>oldWrites);
        const callsWhilePending=spy.mock.calls.length;
        expect(store['outstandingGraphMutations']).toBeGreaterThan(0);expect(store.isCacheValid()).toBe(false);
        expect((await store.query(request())).length).toBe(2);expect((await store.query(request())).length).toBe(2);
        expect(spy).toHaveBeenCalledTimes(callsWhilePending+2);expect(store['queryResults'].size).toBe(0);
      }finally{backend.gate=undefined;hold.release();await pending;}
      expect(store.isCacheValid()).toBe(false);const callsAfterRelease=spy.mock.calls.length;await store.query(request());expect(spy).toHaveBeenCalledTimes(callsAfterRelease+1);expect(store.isCacheValid()).toBe(true);balanced(store);
    });
  it('transaction callback retries leave bookkeeping outstanding and do not admit mid-callback queries',async()=>{
    const {store,spy}=await cached();backend.retry=true;let observations=0;
    backend.observe=()=>{observations++;expect(store.getNode('p1')!.label).toBe('p1');
      expect(store['outstandingGraphMutations']).toBeGreaterThan(0);expect(store.isCacheValid()).toBe(false);expect(store['queryResults'].size).toBe(0);};
    await store.updateNode({id:'p1',label:'committed'});expect(observations).toBe(2);expect(store.getNode('p1')!.label).toBe('committed');
    expect(store.isCacheValid()).toBe(false);await store.query(request());expect(spy).toHaveBeenCalledTimes(2);balanced(store);
  });
  it.each(['before','after'] as const)('invalidates on %s writer rejection and does not imply rollback',async failure=>{
    const {store,spy}=await cached();backend.failure=failure;
    await expect(store.updateNode({id:'p1',label:'changed'})).rejects.toThrow(failure==='before'?'KNOWN_BEFORE_COMMIT':'AMBIGUOUS_AFTER_COMMIT');
    expect(store.isCacheValid()).toBe(false);expect(store['queryResults'].size).toBe(0);balanced(store);
    expect(backend.nodes.get('p1').label).toBe(failure==='after'?'changed':'p1');backend.failure=undefined;
    const next=await store.query(request());expect(next[0].pattern.label).toBe(failure==='after'?'changed':'p1');expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(true);
  });
  it('a failed close balances counters and cannot reuse old results, while preserving legacy readiness',async()=>{
    const {store,spy}=await cached();backend.closeFailure=true;
    await expect(store.close()).rejects.toThrow('CLOSE_FAILED');expect(store['initialized']).toBe(true);
    expect(store.isCacheValid()).toBe(false);balanced(store);await store.query(request());expect(spy).toHaveBeenCalledTimes(2);
  });
  it.each(['nodes','edges'] as const)('direct private %s loader exposes legacy aliases only after lifetime poison',async kind=>{
    const {store,spy}=await cached();
    if(kind==='nodes'){
      const records=await store['loadNodesFromFirestore']();expect(records.find(n=>n.id==='p1')).toBe(store['nodes'].get('p1'));
      records.find(n=>n.id==='p1')!.properties.effectiveness=0.1;records.find(n=>n.id==='p1')!.properties.usageCount=0;
    }else{
      backend.edges.set('edge',{id:'edge',source:'p1',target:'p2',relationship:'uses',weight:1});
      const records=await store['loadEdgesFromFirestore']();expect(records[0]).toBe(store['edges'].get('edge'));records[0].relationship='edited';
      expect(store['edges'].get('edge')!.relationship).toBe('edited');
    }
    expect(store.isCacheValid()).toBe(false);await store.query(request());await store.query(request());expect(spy).toHaveBeenCalledTimes(3);
    if(kind==='nodes')expect((await store.query(request())).map(r=>r.pattern.id)).toEqual(['p2','p1']);
    store.clearCache();await store.initialize();await store.query(request());expect(store['memoizationDisabled']).toBe(true);balanced(store);
  });
  it('a direct private full graph reload invalidates without poisoning because it returns no records',async()=>{
    const {store,spy}=await cached();await store['loadGraph']();expect(store.isCacheValid()).toBe(false);expect(store['memoizationDisabled']).toBe(false);
    await store.query(request());expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(true);balanced(store);
  });
  it('a failed full reload of an already ready store preserves legacy partial maps but cannot memoize them',async()=>{
    const {store,spy}=await cached();backend.nodes.get('p1').properties.effectiveness=0.1;backend.nodes.get('p1').properties.usageCount=0;
    backend.readFailure='graphrag_nodes';await expect(store['loadGraph']()).rejects.toThrow('PARTIAL_LOAD_FAILED');
    expect(store['initialized']).toBe(true);expect(store['nodes'].size).toBe(6);expect(store['nodes'].get('p1')!.properties.effectiveness).toBe(0.1);
    balanced(store);expect(store['memoizationDisabled']).toBe(true);expect(store.isCacheValid()).toBe(false);backend.readFailure=undefined;
    expect((await store.query(request())).map(r=>r.pattern.id)).toEqual(['p2','p1']);await store.query(request());expect(spy).toHaveBeenCalledTimes(3);
    expect(store['queryResults'].size).toBe(0);expect(store.isCacheValid()).toBe(false);
  });
  it.each(['graphrag_nodes','graphrag_edges'])('partial initialization failure in %s balances counters and never admits a mixed graph',async collection=>{
    backend.edges.set('edge',{id:'edge',source:'p1',target:'p2',relationship:'uses',weight:1});
    const {store}=await cached();store.clearCache();backend.readFailure=collection;
    await expect(store.initialize()).rejects.toThrow('PARTIAL_LOAD_FAILED');expect(store['initialized']).toBe(false);
    expect(store.isCacheValid()).toBe(false);expect(store['queryResults'].size).toBe(0);balanced(store);
    backend.readFailure=undefined;await store.query(request());expect(store.isCacheValid()).toBe(true);expect(store['memoizationDisabled']).toBe(false);balanced(store);
  });
  it('pending and partial failed direct loader has no hits, keeps aliases legacy and remains poisoned',async()=>{
    const {store,spy}=await cached();const hold=gate();backend.getGate=hold.promise;backend.readFailure='graphrag_nodes';
    const oldFetches=backend.fetches.length;const pending=store['loadNodesFromFirestore']();
    try{await until(()=>backend.fetches.length>oldFetches);expect(store['outstandingGraphMutations']).toBeGreaterThan(0);
      expect((await store.query(request())).length).toBe(2);expect(store['queryResults'].size).toBe(0);
    }finally{backend.getGate=undefined;hold.release();await expect(pending).rejects.toThrow('PARTIAL_LOAD_FAILED');}
    backend.readFailure=undefined;balanced(store);await store.query(request());expect(spy).toHaveBeenCalledTimes(3);expect(store.isCacheValid()).toBe(false);
  });
  it('initialization-event exceptions balance hooks and invalidate instead of leaving cache-inflight forever',async()=>{
    const store=new GraphRAGStore();store.on('initialized',()=>{throw new Error('EVENT_FAILED');});
    await expect(store.initialize()).rejects.toThrow('EVENT_FAILED');balanced(store);expect(store.isCacheValid()).toBe(false);
    store.removeAllListeners('initialized');expect((await store.query(request())).length).toBe(2);expect(store.isCacheValid()).toBe(true);
  });
  it('a revision change during synchronous calculation prevents stale admission',async()=>{
    const store=await loaded();const original=store['extractEntities'].bind(store);let changed=false;
    const spy=vi.spyOn(store as any,'extractEntities').mockImplementation((input:any)=>{
      if(!changed){changed=true;store.calculateCentrality();}return original(input);
    });
    expect((await store.query(request())).length).toBe(2);expect(store.isCacheValid()).toBe(false);expect(store['queryResults'].size).toBe(0);
    await store.query(request());expect(spy).toHaveBeenCalledTimes(2);expect(store.isCacheValid()).toBe(true);balanced(store);
  });
  it('preflight failures that never mutate preserve the genuine cache/hit without fabricated invalidation',async()=>{
    const {store,spy}=await cached();await expect(store.addNode({id:'invalid'} as GraphNode)).rejects.toThrow();
    await expect(store.addEdge({id:'invalid'} as any)).rejects.toThrow();await expect(store.calculateCentrality({damping:1})).rejects.toThrow();
    expect(store.isCacheValid()).toBe(true);await store.query(request());expect(spy).toHaveBeenCalledTimes(1);balanced(store);
  });
  it('legacy addPattern aliases tags/Date/nested/privacy values while permanently poisoning memoization before awaits',async()=>{
    const {store,spy}=await cached();const hold=gate();backend.gate=hold.promise;
    const input:any={pattern:'React caller pattern',agent:'agent-x',category:'ui',effectiveness:0.9,timeSaved:1,tags:['cache'],usageCount:10,
      lastUsed:new Date(2000),nested:{value:'original'},privacy:{isPublic:false,userId:'fixture-user',auditedAt:new Date(3000)}};
    const oldWrites=backend.writes;const pending=store.addPattern(input);
    try{await until(()=>backend.writes>oldWrites);expect(store['memoizationDisabled']).toBe(true);expect(store.isCacheValid()).toBe(false);
      expect(store['outstandingGraphMutations']).toBeGreaterThan(0);await store.query(request());expect(store['queryResults'].size).toBe(0);
    }finally{backend.gate=undefined;hold.release();}
    const id=await pending;expect(store['nodes'].get(id)!.properties.tags).toBe(input.tags);
    await store.query(request());expect(store.isCacheValid()).toBe(false);const beforeCount=spy.mock.calls.length;
    input.tags.push('mutated');input.lastUsed.setTime(9000);input.nested.value='edited';input.privacy.auditedAt.setTime(8000);
    const next=await store.query(request());const added=next.find(r=>r.pattern.id===id)!;expect(added).toBeDefined();
    expect(added.pattern.properties.tags).toEqual(['cache','mutated']);expect(added.pattern.properties.lastUsed.getTime()).toBe(9000);
    expect(added.pattern.properties.nested.value).toBe('edited');expect((added.pattern.privacy as any).auditedAt.getTime()).toBe(8000);
    expect(spy).toHaveBeenCalledTimes(beforeCount+1);expect(store.isCacheValid()).toBe(false);balanced(store);
  });
  it('addPattern rejection preserves its existing partial graph effects without reusable results',async()=>{
    const {store,spy}=await cached();backend.failure='before';
    await expect(store.addPattern({pattern:'React',agent:'agent-x',category:'ui',effectiveness:1,timeSaved:1,tags:[],usageCount:0})).rejects.toThrow('KNOWN_BEFORE_COMMIT');
    expect(store['memoizationDisabled']).toBe(true);expect(store.isCacheValid()).toBe(false);expect(store['queryResults'].size).toBe(0);
    // Agent is extracted first: its cached link mutates before the first edge write rejects.
    // Category/technology are not reached; this is a legacy partial effect, not rollback.
    const partialEdges=[...store['edges'].values()];expect(partialEdges.length).toBe(1);
    const partialEdge=partialEdges[0];expect(partialEdge.target).toBe('agent_agent-x');
    expect(partialEdge.relationship).toBe('owned_by');expect(partialEdge.source).toMatch(/^pattern_/);
    expect(store['nodes'].get('agent_agent-x')!.connections).toEqual(['p1','p2',partialEdge.source]);
    expect(backend.nodes.get('agent_agent-x').connections).toEqual(['p1','p2']);
    expect(store['nodes'].has(partialEdge.source)).toBe(false);expect(backend.nodes.has(partialEdge.source)).toBe(false);
    expect(backend.writes).toBe(1);expect(store['edges'].size).toBeGreaterThan(0);expect(backend.edges.size).toBe(0);
    for(const id of ['tech_react','category_ui']){
      expect(store['nodes'].get(id)!.connections).toEqual(['p1','p2']);
      expect(backend.nodes.get(id).connections).toEqual(['p1','p2']);
    }
    balanced(store);const callsAfterRejection=spy.mock.calls.length;
    expect((await store.query(request())).map(r=>r.pattern.id)).toEqual(['p1','p2']);
    expect((await store.query(request())).map(r=>r.pattern.id)).toEqual(['p1','p2']);
    expect(spy).toHaveBeenCalledTimes(callsAfterRejection+2);expect(store.isCacheValid()).toBe(false);
    expect(store['queryResults'].size).toBe(0);balanced(store);
  });
  it('real caller-shaped own undefined fields remain eligible, and subclass-shaped scope fields preserve markers without a policy claim',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    const shaped:GraphRAGQuery={query:'React',userId:'fixture-user',limit:20,minRelevance:0.3,agent:undefined,tags:undefined};
    const first=await store.query(shaped);expect(first.map(r=>r.pattern.id)).toEqual(['p1','p2']);await store.query(shaped);expect(spy).toHaveBeenCalledTimes(1);
    const publicShape={...shaped,includePublic:true,userId:undefined,teamId:undefined,projectId:undefined};
    const next=await store.query(publicShape);await store.query(publicShape);expect(spy).toHaveBeenCalledTimes(2);
    expect(next).toEqual([]);expect(first[0].pattern.privacy).toEqual({userId:'fixture-user',isPublic:false});expect(store.isCacheValid()).toBe(true);
  });
});
