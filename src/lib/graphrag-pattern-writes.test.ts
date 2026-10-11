/** Explicit stable pattern writes and durable usage; atomic mock persistence, no backend/tenant claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode, type PatternNode } from './graphrag-store.js';
const backend = vi.hoisted(() => ({ nodes: new Map<string, any>(), edges: new Map<string, any>(),
  fetches: [] as string[], reads: [] as string[], operations: [] as string[], callbacks: 0, transactions: 0,
  failures: undefined as 'before' | 'after' | undefined, retry: false,
  observe: undefined as (() => void) | undefined, afterDiscard: undefined as (() => void) | undefined,
  closes: 0, deletes: 0 }));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  const copy = (value: any, seen=new WeakMap<object,any>()): any => {
    if(value===null || typeof value!=='object')return value;
    if(seen.has(value))return seen.get(value);
    if(value instanceof Date)return new Date(value.getTime());
    if(value instanceof actual.Timestamp)return new actual.Timestamp(value.seconds,value.nanoseconds);
    if(Buffer.isBuffer(value))return Buffer.from(value);
    if(value instanceof Uint8Array)return new Uint8Array(value);
    const output=Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value));seen.set(value,output);
    for(const key of Reflect.ownKeys(value)){
      const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
      if('value' in descriptor)descriptor.value=copy(descriptor.value,seen);
      Object.defineProperty(output,key,descriptor);
    }
    return output;
  };
  type Ref = { collectionName: 'graphrag_nodes' | 'graphrag_edges'; id:string };
  const records = (name:string) => {
    if(name==='graphrag_nodes') return backend.nodes;
    if(name==='graphrag_edges') return backend.edges;
    throw new Error('Unexpected collection');
  };
  class MockFirestore {
    collection(name:Ref['collectionName']) {
      const table=records(name);
      return { get:async()=> {
        backend.fetches.push(name); const docs=[...table].map(([id,data])=>({id,data:()=>copy(data)}));
        return {docs,size:docs.length,empty:docs.length===0,forEach(callback:(doc:typeof docs[number])=>void){docs.forEach(callback);}};
      },doc:(id:string)=>({collectionName:name,id}) };
    }
    async runTransaction(callback:(transaction:any)=>Promise<any>) {
      backend.transactions++;
      const run=async()=> {
        const operations:Array<{kind:'create'|'set';ref:Ref;data:any}>=[];
        const transaction={
          async get(ref:Ref) {
            if(operations.length) throw new Error('READ_AFTER_WRITE');
            backend.reads.push(ref.collectionName+'/'+ref.id);
            const value=records(ref.collectionName).get(ref.id);const detached=copy(value);
            return {id:ref.id,exists:value!==undefined,data:()=>copy(detached)};
          },
          create(ref:Ref,data:any){operations.push({kind:'create',ref,data:copy(data)});backend.operations.push('create:'+ref.collectionName+'/'+ref.id);},
          set(ref:Ref,data:any){operations.push({kind:'set',ref,data:copy(data)});backend.operations.push('set:'+ref.collectionName+'/'+ref.id);},
        };
        backend.callbacks++;const result=await callback(transaction);backend.observe?.();return {result,operations};
      };
      if(backend.retry){await run();backend.retry=false;backend.afterDiscard?.();}
      const {result,operations}=await run();
      const staged={graphrag_nodes:new Map([...backend.nodes].map(([id,v])=>[id,copy(v)])),
        graphrag_edges:new Map([...backend.edges].map(([id,v])=>[id,copy(v)]))};
      for(const op of operations){
        const table=staged[op.ref.collectionName];
        if(op.kind==='create' && table.has(op.ref.id)) throw new Error('ALREADY_EXISTS');
        table.set(op.ref.id,copy(op.data));
      }
      if(backend.failures==='before') throw new Error('KNOWN_BEFORE_COMMIT');
      for(const name of ['graphrag_nodes','graphrag_edges'] as const){const target=records(name);target.clear();for(const[id,v]of staged[name])target.set(id,v);}
      if(backend.failures==='after') throw new Error('AMBIGUOUS_AFTER_COMMIT');
      return result;
    }
    terminate(){backend.closes++;}
  }
  return {...actual,Firestore:MockFirestore};
});
function node(id:string):GraphNode {
  return {id,type:'technology',label:'Authoritative '+id,properties:{nested:{keep:true},date:new Date(1000),
    timestamp:new Timestamp(3,5),bytes:Buffer.from([1,2]),octets:new Uint8Array([3,4])},
    connections:['old-neighbor','old-neighbor'],privacy:{teamId:'shared-fixture',isPublic:false}};
}
function pattern(id='stable-pattern'):PatternNode & {properties:PatternNode['properties'] & Record<string,any>} {
  return {id,type:'pattern',label:'Caller Label',properties:{pattern:'React hooks',agent:'owner',category:'ui',
    effectiveness:0.9,timeSaved:100,tags:['hooks','hooks'],usageCount:0,lastUsed:new Date(1234),
    extra:{nested:['caller']}},connections:['declared-dangling','declared-dangling'],privacy:{userId:'fixture-user',isPublic:false}};
}
beforeEach(()=>{
  backend.nodes.clear();backend.edges.clear();backend.fetches=[];backend.reads=[];backend.operations=[];
  backend.callbacks=0;backend.transactions=0;backend.failures=undefined;backend.retry=false;
  backend.observe=undefined;backend.afterDiscard=undefined;backend.closes=0;backend.deletes=0;
  backend.nodes.set('unrelated',node('unrelated'));vi.restoreAllMocks();
});
async function loaded(){const store=new GraphRAGStore();await store.initialize();return store;}
function noMutation(){expect(backend.closes+backend.deletes).toBe(0);}
function noIO(){expect(backend.fetches).toEqual([]);expect(backend.transactions).toBe(0);expect(backend.operations).toEqual([]);}
function relations(id='stable-pattern'){return ['agent_owner','category_ui','tech_react','concept_hooks'].map(entity=>`edge_${id}_${entity}`);}

describe('GraphRAG stable pattern writes',()=>{
  it('creates stable caller identity, real extracted entities/edges, bidirectional navigation and reload',async()=>{
    const store=await loaded();const input=pattern();const before=structuredClone(input);
    await store.storePattern(input);expect(input).toEqual(before);
    expect(backend.nodes.get(input.id).label).toBe('Caller Label');expect(backend.nodes.get(input.id).properties).toEqual(input.properties);
    expect([...backend.edges.keys()]).toEqual(relations());
    expect(store.getNode(input.id)!.connections).toEqual(['declared-dangling','declared-dangling','agent_owner','category_ui','tech_react','concept_hooks']);
    for(const id of ['agent_owner','category_ui','tech_react','concept_hooks'])expect(store.getNeighbors(id)).toEqual([input.id]);
    expect(store.getEdge('edge_stable-pattern_tech_react')).toMatchObject({source:input.id,target:'tech_react',relationship:'uses',weight:0.8});
    expect(backend.operations.filter(op=>op.startsWith('create:')).length).toBe(9);
    const fresh=await loaded();expect(fresh.getNode(input.id)).toEqual(store.getNode(input.id));
    expect((await fresh.query({query:'React',userId:'fixture-user'})).map(result=>result.pattern.id)).toContain(input.id);noMutation();
  });
  it('deduplicates repeated extracted IDs without duplicate creates or changing original interpretations',async()=>{
    const store=await loaded();await store.storePattern(pattern());
    expect(backend.operations.filter(op=>op==='create:graphrag_nodes/concept_hooks')).toHaveLength(1);
    expect(backend.operations.filter(op=>op==='create:graphrag_edges/edge_stable-pattern_concept_hooks')).toHaveLength(1);
    expect(store.getNode('concept_hooks')).toMatchObject({type:'concept',label:'hooks',properties:{},connections:['stable-pattern']});
  });
  it('merges authoritative shared entity metadata and connections rather than a stale cache',async()=>{
    backend.nodes.set('tech_react',node('tech_react'));const store=await loaded();
    const updated={...backend.nodes.get('tech_react'),label:'Real updated label',properties:{retained:true,nested:{v:7}},connections:['other','other']};
    backend.nodes.set('tech_react',updated);await store.storePattern(pattern());
    const expected={...updated,connections:['other','other','stable-pattern']};
    expect(backend.nodes.get('tech_react')).toEqual(expected);expect(store.getNode('tech_react')).toEqual(expected);
    expect(backend.nodes.get('unrelated')).toEqual(node('unrelated'));noMutation();
  });
  it('detaches supported caller properties and published shared cache records',async()=>{
    backend.nodes.set('tech_react',node('tech_react'));const store=await loaded();const input=pattern();await store.storePattern(input);
    input.properties.extra.nested.push('changed');input.connections.push('changed');input.privacy!.userId='changed';
    const cached=store.getNode('tech_react')!;cached.properties.date.setTime(9000);cached.properties.bytes[0]=99;cached.properties.timestamp=new Timestamp(9,9);
    expect(store.getNode('tech_react')!.properties).toMatchObject({date:new Date(1000),timestamp:new Timestamp(3,5),bytes:Buffer.from([1,2])});
    expect((await loaded()).getNode('stable-pattern')!.properties.extra.nested).toEqual(['caller']);
    expect(store.getNode('stable-pattern')!.privacy!.userId).toBe('fixture-user');noMutation();
  });
  it('preserves explicitly supplied connections without adding a duplicate extracted target',async()=>{
    const store=await loaded();const input=pattern();input.connections.push('tech_react');await store.storePattern(input);
    expect(store.getNode(input.id)!.connections.filter(id=>id==='tech_react')).toHaveLength(1);
    expect(store.getNode(input.id)!.connections.slice(0,2)).toEqual(['declared-dangling','declared-dangling']);
  });
  it('refuses the caller ID colliding with an extracted entity before any I/O',async()=>{
    const store=new GraphRAGStore();await expect(store.storePattern(pattern('tech_react'))).rejects.toThrow('entity ID collision');noIO();
  });
  it('refuses conflicting duplicate extraction rather than changing its interpretation',async()=>{
    const store=new GraphRAGStore();vi.spyOn(store as any,'extractEntities').mockReturnValue([
      {id:'same',type:'agent',label:'first',relationship:'owned_by',weight:1},
      {id:'same',type:'concept',label:'second',relationship:'relates_to',weight:0.6},
    ]);await expect(store.storePattern(pattern())).rejects.toThrow('conflicting extracted');noIO();
  });
  it.each(['existing-pattern','existing-edge','shared-type','shared-id'] as const)('refuses %s collision with no partial records',async collision=>{
    const original=pattern();
    if(collision==='existing-pattern')backend.nodes.set(original.id,original);
    if(collision==='existing-edge')backend.edges.set(relations()[0],{id:relations()[0],source:'another',target:'other',relationship:'other',weight:0.5});
    if(collision==='shared-type')backend.nodes.set('tech_react',{...node('tech_react'),type:'concept'});
    if(collision==='shared-id')backend.nodes.set('tech_react',node('wrong'));
    const store=await loaded();const beforeNodes=[...backend.nodes];const beforeEdges=[...backend.edges];
    await expect(store.storePattern(original)).rejects.toThrow();expect([...backend.nodes]).toEqual(beforeNodes);expect([...backend.edges]).toEqual(beforeEdges);
    expect(backend.operations).toEqual([]);expect(()=>store.getNode(original.id)).toThrow('not initialized');noMutation();
  });
  it('create precondition refuses a competing pattern after reads without publishing its uncommitted plan',async()=>{
    const store=await loaded();const competitor={...pattern(),label:'Competing authoritative record'};
    backend.observe=()=>backend.nodes.set(competitor.id,competitor);
    await expect(store.storePattern(pattern())).rejects.toThrow('ALREADY_EXISTS');
    expect(backend.nodes.get(competitor.id)).toEqual(competitor);expect(backend.edges.size).toBe(0);
    expect(backend.nodes.has('tech_react')).toBe(false);expect(()=>store.getNode(competitor.id)).toThrow('not initialized');
  });
  it.each([{agent:'path/agent'},{category:'path/category'},{tags:['path/tag']}])('refuses unrepresentable extracted IDs before storage rather than normalizing heuristics',async fields=>{
    const input=pattern();Object.assign(input.properties,fields);
    await expect(new GraphRAGStore().storePattern(input)).rejects.toThrow('document ID');noIO();
  });
  it('retry callbacks never publish and merge the newly read shared metadata once at final commit',async()=>{
    backend.nodes.set('tech_react',node('tech_react'));const store=await loaded();backend.retry=true;let observations=0;
    backend.observe=()=>{observations++;expect(store.getNode('stable-pattern')).toBeUndefined();expect(store.getNode('tech_react')!.label).toBe('Authoritative tech_react');expect(backend.nodes.has('stable-pattern')).toBe(false);};
    backend.afterDiscard=()=>backend.nodes.set('tech_react',{...node('tech_react'),label:'Changed between callbacks',connections:['new-neighbor']});
    await store.storePattern(pattern());expect(backend.callbacks).toBe(2);expect(observations).toBe(2);
    expect(store.getNode('tech_react')!.label).toBe('Changed between callbacks');expect(backend.nodes.get('tech_react').connections).toEqual(['new-neighbor','stable-pattern']);noMutation();
  });
  it.each(['before','after'] as const)('invalidates on %s commit rejection without asserting rollback',async failure=>{
    const store=await loaded();backend.failures=failure;await expect(store.storePattern(pattern())).rejects.toThrow(failure==='before'?'KNOWN_BEFORE_COMMIT':'AMBIGUOUS_AFTER_COMMIT');
    expect(()=>store.getNode('stable-pattern')).toThrow('not initialized');expect(backend.nodes.has('stable-pattern')).toBe(failure==='after');
    expect(backend.edges.size).toBe(failure==='after'?4:0);const reloaded=await loaded();expect(reloaded.getNode('stable-pattern')!==undefined).toBe(failure==='after');noMutation();
  });
  it('queues two local pattern writes without losing shared entity connections',async()=>{
    const store=await loaded();await Promise.all([store.storePattern(pattern('one')),store.storePattern(pattern('two'))]);
    expect(backend.nodes.get('tech_react').connections).toEqual(['one','two']);expect((await loaded()).getNeighbors('tech_react')).toEqual(['one','two']);
  });
  it.each([
    {id:''},{id:'path/other'},{type:'concept'},{properties:{pattern:12}},{properties:{agent:12}},{properties:{category:null}},
    {properties:{effectiveness:Infinity}},{properties:{timeSaved:NaN}},{properties:{usageCount:-1}},{properties:{usageCount:1.5}},
    {properties:{usageCount:Number.MAX_SAFE_INTEGER+1}},{properties:{tags:[12]}},{properties:{tags:new Array(1)}},
    {properties:{lastUsed:'yesterday'}},{properties:{lastUsed:new Date(NaN)}},{properties:{description:12}},
    {properties:{code:12}},{properties:{examples:[{}]}},{properties:{extra:undefined}},{properties:{extra:()=>1}},
  ])('rejects malformed pattern before initialization and any write',async patch=>{
    const input=pattern();const fields=patch as Record<string,any>;Object.assign(input,fields,{properties:{...input.properties,...fields.properties}});
    const store=new GraphRAGStore();await expect(store.storePattern(input)).rejects.toThrow();noIO();noMutation();
  });
  it('rejects a caller accessor without executing it or opening storage',async()=>{
    const input=pattern();let calls=0;Object.defineProperty(input.properties,'pattern',{enumerable:true,get(){calls++;return 'React';}});
    await expect(new GraphRAGStore().storePattern(input)).rejects.toThrow('cached accessor');expect(calls).toBe(0);noIO();
  });
  it('rejects document and extracted-plan budgets without starting persistence',async()=>{
    const store=new GraphRAGStore();const tooLarge=pattern();tooLarge.properties.extra='x'.repeat(65536);
    await expect(store.storePattern(tooLarge)).rejects.toThrow('size budget');noIO();
    const tooMany=pattern();tooMany.properties.tags=Array.from({length:50},(_,i)=>'tag'+i);
    await expect(store.storePattern(tooMany)).rejects.toThrow('count budget');noIO();
  });
  it('rejects aggregate shared-document budget atomically after reads but before writes',async()=>{
    const input=pattern();input.properties.pattern='Unmatched';input.properties.tags=Array.from({length:24},(_,i)=>'tag'+i);
    for(const entity of ['agent_owner','category_ui',...input.properties.tags.map(tag=>'concept_'+tag)]){
      backend.nodes.set(entity,{...node(entity),type:entity.startsWith('agent')?'agent':entity.startsWith('category')?'category':'concept',properties:{payload:'x'.repeat(42000)}});
    }
    const store=await loaded();await expect(store.storePattern(input)).rejects.toThrow('transaction size budget');expect(backend.operations).toEqual([]);expect(backend.nodes.has(input.id)).toBe(false);
  });
  it.each([{userId:'fixture-user',isPublic:false},{teamId:'fixture-team',isPublic:false},
    {projectId:'fixture-project',isPublic:false},{isPublic:true,audited:true,sanitized:true},undefined])('preserves exact pattern markers or absence without inferring shared entity privacy',async privacy=>{
    const input=pattern();if(privacy===undefined)delete input.privacy;else input.privacy=privacy;
    const store=await loaded();await store.storePattern(input);const fresh=await loaded();expect(fresh.getNode(input.id)!.privacy).toEqual(privacy);
    expect(fresh.getNode(input.id)!.properties).not.toHaveProperty('privacy');for(const id of ['agent_owner','tech_react'])expect(fresh.getNode(id)!.privacy).toBeUndefined();noMutation();
  });
  it('accepts supported Timestamp lastUsed without replacing caller time or extra properties',async()=>{
    const input=pattern();input.properties.lastUsed=new Timestamp(7,9) as any;const store=await loaded();await store.storePattern(input);
    expect((await loaded()).getNode(input.id)!.properties.lastUsed).toEqual(new Timestamp(7,9));
  });
});

describe('GraphRAG explicit durable usage',()=>{
  it('increments persisted usage exactly once, preserves all metadata/lastUsed and reloads one then two',async()=>{
    const input=pattern();backend.nodes.set(input.id,input);const store=await loaded();
    await store.incrementUsageCount(input.id);expect(store.getNode(input.id)!.properties).toEqual({...input.properties,usageCount:1});
    await store.incrementUsageCount(input.id);expect((await loaded()).getNode(input.id)!.properties.usageCount).toBe(2);
    expect(backend.nodes.get(input.id)).toEqual({...input,properties:{...input.properties,usageCount:2}});noMutation();
  });
  it('allows the final safe integer increment exactly and preserves supplied Timestamp time',async()=>{
    const input=pattern();input.properties.usageCount=Number.MAX_SAFE_INTEGER-1;input.properties.lastUsed=new Timestamp(10,1) as any;
    backend.nodes.set(input.id,input);const store=await loaded();await store.incrementUsageCount(input.id);
    expect((await loaded()).getNode(input.id)!.properties).toEqual({...input.properties,usageCount:Number.MAX_SAFE_INTEGER});
  });
  it('uses the persisted count and properties rather than stale cached values',async()=>{
    const input=pattern();backend.nodes.set(input.id,input);const store=await loaded();backend.nodes.set(input.id,{...input,properties:{...input.properties,usageCount:8,description:'Real update'}});
    await store.incrementUsageCount(input.id);expect(store.getNode(input.id)!.properties).toEqual({...input.properties,usageCount:9,description:'Real update'});
  });
  it('callback retries publish nothing and derive one increment from the final authoritative read',async()=>{
    const input=pattern();backend.nodes.set(input.id,input);const store=await loaded();backend.retry=true;
    backend.observe=()=>{expect(store.getNode(input.id)!.properties.usageCount).toBe(0);};
    backend.afterDiscard=()=>backend.nodes.set(input.id,{...input,properties:{...input.properties,usageCount:5}});
    await store.incrementUsageCount(input.id);expect(backend.callbacks).toBe(2);expect(backend.nodes.get(input.id).properties.usageCount).toBe(6);
  });
  it('queues two local increments and leaves getters/query as reads',async()=>{
    const input=pattern();backend.nodes.set(input.id,input);backend.nodes.set('tech_react',{...node('tech_react'),connections:[input.id]});const store=await loaded();await Promise.all([store.incrementUsageCount(input.id),store.incrementUsageCount(input.id)]);
    expect(backend.nodes.get(input.id).properties.usageCount).toBe(2);const writes=backend.operations.slice();expect(store.getNode(input.id)!.properties.usageCount).toBe(2);expect((await store.query({query:'React',userId:'fixture-user'})).map(result=>result.pattern.id)).toContain(input.id);
    expect(backend.operations).toEqual(writes);expect(backend.nodes.get(input.id).properties.usageCount).toBe(2);
  });
  it.each(['missing','non-pattern','wrong-id','malformed-count','overflow'] as const)('rejects persisted %s without publishing a count',async kind=>{
    const input=pattern();if(kind!=='missing')backend.nodes.set(input.id,input);
    if(kind==='non-pattern')backend.nodes.set(input.id,{...input,type:'concept'});
    if(kind==='wrong-id')backend.nodes.set(input.id,{...input,id:'other'});
    if(kind==='malformed-count')backend.nodes.set(input.id,{...input,properties:{...input.properties,usageCount:1.5}});
    if(kind==='overflow')backend.nodes.set(input.id,{...input,properties:{...input.properties,usageCount:Number.MAX_SAFE_INTEGER}});
    const store=await loaded();const before=[...backend.nodes];await expect(store.incrementUsageCount(input.id)).rejects.toThrow();expect([...backend.nodes]).toEqual(before);
    expect(backend.operations).toEqual([]);expect(()=>store.getNode(input.id)).toThrow('not initialized');noMutation();
  });
  it.each(['before','after'] as const)('invalidates on %s usage commit error without losing observed backend truth',async failure=>{
    const input=pattern();backend.nodes.set(input.id,input);const store=await loaded();backend.failures=failure;
    await expect(store.incrementUsageCount(input.id)).rejects.toThrow(failure==='before'?'KNOWN_BEFORE_COMMIT':'AMBIGUOUS_AFTER_COMMIT');
    expect(()=>store.getNode(input.id)).toThrow('not initialized');expect(backend.nodes.get(input.id).properties.usageCount).toBe(failure==='after'?1:0);
    expect((await loaded()).getNode(input.id)!.properties.usageCount).toBe(failure==='after'?1:0);
  });
  it.each(['','path/other',null,12])('rejects invalid usage ID before storage access',async id=>{
    await expect(new GraphRAGStore().incrementUsageCount(id as string)).rejects.toThrow();noIO();
  });
  it('rejects an authoritative usage accessor without invoking it or writing',async()=>{
    const input=pattern();backend.nodes.set(input.id,input);const store=await loaded();let calls=0;
    Object.defineProperty(backend.nodes.get(input.id).properties,'usageCount',{enumerable:true,get(){calls++;return 0;}});
    await expect(store.incrementUsageCount(input.id)).rejects.toThrow('cached accessor');expect(calls).toBe(0);expect(backend.operations).toEqual([]);
  });
});
