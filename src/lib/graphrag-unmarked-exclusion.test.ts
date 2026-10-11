/** Explicit classification exclusion only; no scope authorization or measured-speed claim. */
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
  const excluded=pattern('unmarked',1,10);delete excluded.privacy;
  const allowed=pattern('classified',0.5,0);allowed.privacy={isPublic:true};
  backend.nodes.set(excluded.id,excluded);backend.nodes.set(allowed.id,allowed);
  backend.nodes.set('tech_react',{...simple('tech_react',['unmarked','classified']),type:'technology'});
});
const query=()=>({query:'React',limit:1,minRelevance:0.01});
async function loaded(){const store=new GraphRAGStore();await store.initialize();return store;}
const invalidMarkers:[string,any][]=[
  ['missing',undefined],['null',null],['empty',{}],['array',[]],['string','private'],['boolean',false],
  ['public-string',{isPublic:'true'}],['public-null',{isPublic:null}],['scope-number',{userId:7}],
  ['scope-empty',{userId:''}],['scope-whitespace',{teamId:' '}],['only-undefined',{isPublic:undefined,userId:undefined}],
  ['only-audit',{auditedAt:'fixture',sanitized:true}],['public-with-bad-scope',{isPublic:true,projectId:7}],
  ['inherited-only',Object.create({isPublic:true})],
];
const classifiedMarkers:[string,any][]=[
  ['public',{isPublic:true}],['private-user',{isPublic:false,userId:'fixture-user'}],['user-only',{userId:'fixture-user'}],
  ['team-only',{teamId:'fixture-team'}],['project-only',{projectId:'fixture-project'}],
  ['private-with-scopes',{isPublic:false,userId:'fixture-user',teamId:'fixture-team',projectId:'fixture-project'}],
  ['public-audited',{isPublic:true,sanitized:true,auditedAt:'fixture'}],['optional-undefined',{isPublic:undefined,userId:'fixture-user'}],
];
describe('GraphRAG excludes unclassified pattern results without changing storage or asserting authenticated authorization',()=>{
  it('excludes a higher-score unmarked pattern before limit and keeps its backend/cache record unchanged',async()=>{
    const store=await loaded();const before=store.getNode('unmarked');
    const results=await store.query(query());expect(results.map(r=>r.pattern.id)).toEqual(['classified']);
    expect(store.getNode('unmarked')).toEqual(before);expect(backend.nodes.get('unmarked').privacy).toBeUndefined();
    expect(backend.nodes.size).toBe(3);expect(backend.writes).toBe(0);expect(backend.fetches).toEqual(['graphrag_nodes','graphrag_edges']);
  });
  it.each(invalidMarkers)('excludes absent or malformed classification %s without removing the node',async(_,marker)=>{
    const store=await loaded();const node=store['nodes'].get('unmarked')!;node.privacy=marker;
    const results=await store.query(query());expect(results.map(r=>r.pattern.id)).toEqual(['classified']);
    expect(store['nodes'].has('unmarked')).toBe(true);expect(node.privacy).toBe(marker);expect(backend.writes).toBe(0);
  });
  it.each(classifiedMarkers)('selects explicit classification %s through public or a matching OR scope without new mandatory fields',async(_,marker)=>{
    const node=backend.nodes.get('unmarked');node.privacy=marker;
    const store=await loaded();const results=await store.query({...query(),userId:'fixture-user',teamId:'fixture-team',projectId:'fixture-project'});
    expect(results.map(r=>r.pattern.id)).toEqual(['unmarked']);expect(results[0].pattern.privacy).toEqual(marker);
    expect(backend.writes).toBe(0);
  });
  it('excludes a malformed high-score bridge from graphPath and explanation, retaining an independent positive result',async()=>{
    backend.nodes.get('tech_react').connections=['unmarked','classified'];backend.nodes.get('unmarked').label='SECRET_BRIDGE_LABEL';
    backend.nodes.get('unmarked').connections=['classified-via-bridge'];
    const via=pattern('classified-via-bridge',1,10);via.privacy={isPublic:true};backend.nodes.set(via.id,via);
    const store=await loaded();const results=await store.query({...query(),limit:10});expect(results.map(r=>r.pattern.id)).toEqual(['classified']);
    expect(results[0].graphPath).toEqual(['tech_react','classified']);expect(results[0].explanation).not.toContain('SECRET_BRIDGE_LABEL');
    expect(results[0].graphPath).not.toContain('unmarked');expect(store.getNode('classified-via-bridge')).toBeDefined();
  });
  it('keeps non-pattern intermediate nodes traversable without classification',async()=>{
    const middle=simple('middle',['classified']);backend.nodes.set(middle.id,middle);backend.nodes.get('tech_react').connections=['middle'];
    const store=await loaded();const results=await store.query(query());expect(results.map(r=>r.pattern.id)).toEqual(['classified']);
    expect(results[0].graphPath).toEqual(['tech_react','middle','classified']);expect(backend.writes).toBe(0);
  });
  it('applies exclusion on real memoized misses and hits without changing result ordering',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    expect((await store.query(query())).map(r=>r.pattern.id)).toEqual(['classified']);expect(store.isCacheValid()).toBe(true);
    expect((await store.query(query())).map(r=>r.pattern.id)).toEqual(['classified']);expect(spy).toHaveBeenCalledTimes(1);
    expect(backend.writes).toBe(0);
  });
  it('applies exclusion in the legacy unsafe-input bypass and preserves lifetime poisoning',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');const unsafe={...query(),extra:'legacy-bypass'};
    expect((await store.query(unsafe)).map(r=>r.pattern.id)).toEqual(['classified']);expect(store.isCacheValid()).toBe(false);
    expect((await store.query(query())).map(r=>r.pattern.id)).toEqual(['classified']);expect(spy).toHaveBeenCalledTimes(2);
    expect(store['memoizationDisabled']).toBe(true);
  });
  it('allows real empty-result memoization while retaining all unmarked stored records',async()=>{
    delete backend.nodes.get('classified').privacy;const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');
    expect(await store.query(query())).toEqual([]);expect(store.isCacheValid()).toBe(true);expect(await store.query(query())).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(1);expect(store.getNode('classified')).toBeDefined();expect(store.getNode('unmarked')).toBeDefined();
  });
  it('invalidates a populated hit when a write changes a selected public marker to an unmatched private marker without deleting the stored node',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');expect((await store.query(query())).length).toBe(1);
    await store.updateNode({id:'classified',privacy:{isPublic:false,userId:'another-user'}});expect(store.isCacheValid()).toBe(false);
    expect(await store.query(query())).toEqual([]);expect(spy).toHaveBeenCalledTimes(2);expect(store.getNode('classified')).toBeDefined();
    expect(backend.nodes.get('classified').privacy).toEqual({isPublic:false,userId:'another-user'});
    expect(await store.query(query())).toEqual([]);expect(spy).toHaveBeenCalledTimes(2);
  });
  it('does not execute own classification getters and excludes the malformed marker',async()=>{
    const store=await loaded();let invocations=0;const privacy:any={};Object.defineProperty(privacy,'isPublic',{get(){invocations++;return true;}});
    store['nodes'].get('unmarked')!.privacy=privacy;
    expect((await store.query(query())).map(r=>r.pattern.id)).toEqual(['classified']);expect(invocations).toBe(0);expect(backend.writes).toBe(0);
  });
  it('explicit private false without a scope is retained in storage but not selected',async()=>{
    backend.nodes.get('unmarked').privacy={isPublic:false};const store=await loaded();
    expect((await store.query({...query(),userId:'fixture-user'})).map(r=>r.pattern.id)).toEqual(['classified']);
    expect(store.getNode('unmarked')!.privacy).toEqual({isPublic:false});expect(backend.writes).toBe(0);
  });
  it.each(['userId','teamId','projectId'] as const)('matches any explicit OR scope %s even when the other scopes differ',async field=>{
    backend.nodes.get('unmarked').privacy={isPublic:false,userId:'u',teamId:'t',projectId:'p'};const store=await loaded();
    const scopes={userId:'other-u',teamId:'other-t',projectId:'other-p'};scopes[field]={userId:'u',teamId:'t',projectId:'p'}[field];
    expect((await store.query({...query(),...scopes,includePublic:false})).map(r=>r.pattern.id)).toEqual(['unmarked']);
    expect(await store.query({...query(),userId:'other-u',teamId:'other-t',projectId:'other-p',includePublic:false})).toEqual([]);
  });
  it('includePublic false excludes only the public branch and retains a matching explicit scope branch',async()=>{
    backend.nodes.get('unmarked').privacy={isPublic:true,userId:'u'};const store=await loaded();
    expect(await store.query({...query(),includePublic:false})).toEqual([]);
    expect((await store.query({...query(),includePublic:false,userId:'u'})).map(r=>r.pattern.id)).toEqual(['unmarked']);
  });
  it('unmatched classified private bridges do not leak IDs or labels through selected public results',async()=>{
    backend.nodes.get('unmarked').privacy={isPublic:false,userId:'other'};backend.nodes.get('unmarked').label='PRIVATE_BRIDGE';
    backend.nodes.get('unmarked').connections=['classified-via-private'];const node=pattern('classified-via-private',1,10);node.privacy={isPublic:true};backend.nodes.set(node.id,node);
    const store=await loaded();const results=await store.query({...query(),limit:10,userId:'u'});
    expect(results.map(r=>r.pattern.id)).toEqual(['classified']);expect(results[0].explanation).not.toContain('PRIVATE_BRIDGE');
    expect(results[0].graphPath).not.toContain('unmarked');expect(store.getNode(node.id)).toBeDefined();
  });
  it('keeps default ranking and exact calculation values for selected positive controls',async()=>{
    const other=pattern('second-classified',0.2,0);other.privacy={isPublic:true};backend.nodes.set(other.id,other);
    backend.nodes.get('tech_react').connections.push(other.id);const store=await loaded();
    const request={query:'React',limit:0,minRelevance:0};const original=store['computeQuery'](request);
    expect(original.map(r=>r.pattern.id)).toEqual(['classified','second-classified']);
    expect(await store.query(request)).toEqual(original);expect(store.isCacheValid()).toBe(true);
  });
  it('detaches selected first-result and hit Date/Timestamp/bytes/nested metadata from cache and graph',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');const result=await store.query(query());
    result[0].pattern.properties.lastUsed.setTime(9);result[0].pattern.properties.nested.value='edited';
    result[0].pattern.properties.bytes[0]=9;result[0].pattern.properties.octets[0]=9;result[0].graphPath.push('invented');
    const hit=await store.query(query());expect(spy).toHaveBeenCalledTimes(1);
    expect(hit[0].pattern.properties.lastUsed.getTime()).toBe(1000);expect(hit[0].pattern.properties.nested.value).toBe('original');
    expect(hit[0].pattern.properties.timestamp.isEqual(new Timestamp(3,5))).toBe(true);
    expect(hit[0].pattern.properties.bytes.toString('hex')).toBe('0102');expect(hit[0].pattern.properties.octets[0]).toBe(3);
    expect(hit[0].graphPath).toEqual(['tech_react','classified']);expect(store.getNode('classified')!.properties.nested.value).toBe('original');
  });
  it('selected legacy addPattern caller aliases still poison cache and reflect later mutation',async()=>{
    const store=await loaded();const spy=vi.spyOn(store as any,'extractEntities');await store.query(query());expect(store.isCacheValid()).toBe(true);
    const input:any={pattern:'React caller',agent:'agent-x',category:'ui',effectiveness:1,timeSaved:1,tags:['cache'],usageCount:10,lastUsed:new Date(2000),nested:{value:'original'},privacy:{isPublic:true}};
    const id=await store.addPattern(input);expect(store['memoizationDisabled']).toBe(true);expect(store['nodes'].get(id)!.properties.lastUsed).toBe(input.lastUsed);
    input.lastUsed.setTime(9000);input.tags.push('changed');input.nested.value='edited';const calls=spy.mock.calls.length;
    const first=await store.query({...query(),limit:10});expect(first.find(r=>r.pattern.id===id)!.pattern.properties.lastUsed.getTime()).toBe(9000);
    expect(first.find(r=>r.pattern.id===id)!.pattern.properties.tags).toEqual(['cache','changed']);
    expect(first.find(r=>r.pattern.id===id)!.pattern.properties.nested.value).toBe('edited');
    await store.query({...query(),limit:10});expect(spy).toHaveBeenCalledTimes(calls+2);expect(store.isCacheValid()).toBe(false);
  });
  it('does not treat properties.privacy as top-level classification',async()=>{
    backend.nodes.get('unmarked').properties.privacy={isPublic:true};const store=await loaded();
    expect((await store.query(query())).map(r=>r.pattern.id)).toEqual(['classified']);expect(backend.writes).toBe(0);
  });
});
