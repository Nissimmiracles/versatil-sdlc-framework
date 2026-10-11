/** Directed persisted edge transaction; retained mock documents, no live backend/identity claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphEdge, type GraphNode } from './graphrag-store.js';
const backend = vi.hoisted(() => ({ nodes: new Map<string, any>(), edges: new Map<string, any>(),
  fetches: [] as string[], reads: [] as string[], operations: [] as string[], callbacks: 0, transactions: 0,
  failures: undefined as 'before' | 'after' | undefined, retry: false,
  observe: undefined as (() => void) | undefined, afterDiscard: undefined as (() => void) | undefined,
  closes: 0, deletes: 0 }));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  const copy = (value: any): any => {
    if (value===null || typeof value!=='object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof actual.Timestamp) return new actual.Timestamp(value.seconds,value.nanoseconds);
    if (Buffer.isBuffer(value)) return Buffer.from(value);
    if (value instanceof Uint8Array) return new Uint8Array(value);
    if (Array.isArray(value)) return value.map(copy);
    return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,copy(v)]));
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
  return {id,type:'concept',label:id,properties:{nested:{keep:true},date:new Date(1000),timestamp:new Timestamp(3,5),
    bytes:Buffer.from([1,2]),octets:new Uint8Array([3,4])},connections:[],privacy:{userId:'fixture-user',isPublic:false}};
}
const edge=(id='a-b',source='a',target='b'):GraphEdge=>({id,source,target,relationship:'uses',weight:0.8});
beforeEach(()=>{
  backend.nodes.clear();backend.edges.clear();backend.fetches=[];backend.reads=[];backend.operations=[];
  backend.callbacks=0;backend.transactions=0;backend.failures=undefined;backend.retry=false;
  backend.observe=undefined;backend.afterDiscard=undefined;backend.closes=0;backend.deletes=0;
  for(const id of ['a','b','c','unrelated'])backend.nodes.set(id,node(id));
  backend.edges.set('unrelated-edge',edge('unrelated-edge','c','unrelated'));vi.restoreAllMocks();
});
async function loaded(){const store=new GraphRAGStore();await store.initialize();return store;}
function noMutation(){expect(backend.closes+backend.deletes).toBe(0);}
function noIO(){expect(backend.fetches).toEqual([]);expect(backend.transactions).toBe(0);expect(backend.operations).toEqual([]);}

describe('GraphRAG create-only directed edge writes',()=>{
  it('persists the supplied edge ID and source connection atomically, then reloads a directed path',async()=>{
    const store=await loaded();const sourceBefore=store.getNode('a')!;const targetBefore=store.getNode('b')!;
    const input=edge();await store.addEdge(input);
    expect(backend.edges.get('a-b')).toEqual(input);expect(store.getEdge('a-b')).toEqual(input);
    expect(backend.nodes.get('a').connections).toEqual(['b']);expect(store.getNeighbors('a')).toEqual(['b']);
    expect(store['adjacencyList'].get('a')).toEqual(['b']);expect(store.getNeighbors('b')).toEqual([]);
    expect(store['findShortestPath']('a','b')).toEqual(['a','b']);expect(store['findShortestPath']('b','a')).toEqual([]);
    expect(backend.nodes.get('a')).toEqual({...sourceBefore,connections:['b']});expect(backend.nodes.get('b')).toEqual(targetBefore);
    expect(backend.reads).toEqual(['graphrag_edges/a-b','graphrag_nodes/a','graphrag_nodes/b']);
    expect(backend.operations).toEqual(['create:graphrag_edges/a-b','set:graphrag_nodes/a']);
    const fresh=await loaded();expect(fresh.getEdge('a-b')).toEqual(input);expect(fresh.getNeighbors('a')).toEqual(['b']);
    expect(fresh['findShortestPath']('a','b')).toEqual(['a','b']);noMutation();
  });
  it('preserves unrelated records, supported source metadata, and detaches caller/cache values',async()=>{
    const store=await loaded();const unrelated=store.getNode('unrelated');const oldEdge=store.getEdge('unrelated-edge');
    const input={...edge(),metadata:{date:new Date(1000),tags:['original']}};await store.addEdge(input);
    input.relationship='edited';input.metadata.tags.push('edited');
    expect(store.getEdge('a-b')!.relationship).toBe('uses');expect((store.getEdge('a-b') as any).metadata.tags).toEqual(['original']);
    const returned=store.getNode('a')!;returned.properties.bytes[0]=9;returned.properties.octets[0]=9;
    returned.properties.date.setTime(9);returned.properties.nested.keep=false;
    expect(backend.nodes.get('a').properties.bytes.toString('hex')).toBe('0102');
    expect(store.getNode('a')!.properties.timestamp.isEqual(new Timestamp(3,5))).toBe(true);
    expect(store.getNode('a')!.properties.date.getTime()).toBe(1000);expect(store.getNode('a')!.properties.octets[0]).toBe(3);
    expect(store.getNode('unrelated')).toEqual(unrelated);expect(backend.edges.get('unrelated-edge')).toEqual(oldEdge);noMutation();
  });
  it('merges an authoritative source update rather than an obsolete cached projection',async()=>{
    const store=await loaded();backend.nodes.get('a').connections=['c'];backend.nodes.get('a').label='Authoritative';
    await store.addEdge(edge());expect(store.getNode('a')!.label).toBe('Authoritative');
    expect(store.getNeighbors('a')).toEqual(['c','b']);expect((await loaded()).getNeighbors('a')).toEqual(['c','b']);noMutation();
  });
  it('adds target once, retaining unrelated duplicate links and their order',async()=>{
    backend.nodes.get('a').connections=['c','b','b','c'];const store=await loaded();await store.addEdge(edge());
    expect(store.getNeighbors('a')).toEqual(['c','b','c']);expect(backend.nodes.get('a').connections).toEqual(['c','b','c']);
    await store.addEdge(edge('a-b-second'));expect(store.getNeighbors('a')).toEqual(['c','b','c']);
    expect(store.getEdgesForNode('a').map(e=>e.id)).toEqual(['a-b','a-b-second']);noMutation();
  });
  it.each([0,1])('accepts the exact weight boundary %s without normalization',async weight=>{
    const store=await loaded();await store.addEdge({...edge(),weight});
    expect(store.getEdge('a-b')!.weight).toBe(weight);expect(backend.edges.get('a-b').weight).toBe(weight);noMutation();
  });
  it('create precondition rejects a competing edge after reads without a partial source change',async()=>{
    const store=await loaded();backend.observe=()=>{backend.edges.set('a-b',{...edge(),relationship:'competing'});};
    await expect(store.addEdge(edge())).rejects.toThrow('ALREADY_EXISTS');
    expect(backend.edges.get('a-b').relationship).toBe('competing');expect(backend.nodes.get('a').connections).toEqual([]);
    expect(()=>store.getNode('a')).toThrow('cache is not initialized');noMutation();
  });
  it('supports a self-edge with one authoritative node read and one declared connection',async()=>{
    const store=await loaded();await store.addEdge(edge('self','a','a'));
    expect(store.getNeighbors('a')).toEqual(['a']);expect(backend.nodes.get('a').connections).toEqual(['a']);
    expect(backend.reads).toEqual(['graphrag_edges/self','graphrag_nodes/a']);noMutation();
  });
  it('rejects an authoritative duplicate instead of overwriting it, even after a stale initialization',async()=>{
    const store=await loaded();backend.edges.set('a-b',{...edge(),relationship:'original'});
    await expect(store.addEdge(edge())).rejects.toThrow('edge already exists');
    expect(backend.edges.get('a-b').relationship).toBe('original');expect(backend.nodes.get('a').connections).toEqual([]);
    expect(backend.operations).toEqual([]);expect(()=>store.getEdge('a-b')).toThrow('cache is not initialized');noMutation();
  });
  it.each(['source','target'] as const)('rejects a missing persisted %s without manufacturing an endpoint',async missing=>{
    backend.nodes.delete(missing==='source'?'a':'b');const store=await loaded();
    await expect(store.addEdge(edge())).rejects.toThrow('endpoint does not exist');
    expect(backend.edges.has('a-b')).toBe(false);expect(backend.nodes.has(missing==='source'?'a':'b')).toBe(false);
    expect(backend.operations).toEqual([]);expect(()=>store.getNode('c')).toThrow('cache is not initialized');noMutation();
  });
  it('refreshes a real target created after initialization without fabricating or changing its persisted data',async()=>{
    backend.nodes.delete('b');const store=await loaded();const target=node('b');backend.nodes.set('b',target);
    await store.addEdge(edge());expect(store.getNode('b')).toEqual(target);expect(backend.nodes.get('b')).toEqual(target);
    expect(store['findShortestPath']('a','b')).toEqual(['a','b']);noMutation();
  });
  it('retry callbacks never publish cache/adjacency or backend writes, then merge the reread source exactly once',async()=>{
    const store=await loaded();backend.retry=true;let observations=0;
    backend.observe=()=>{observations++;expect(store.getNeighbors('a')).toEqual([]);expect(store.getEdge('a-b')).toBeUndefined();
      expect(backend.edges.has('a-b')).toBe(false);expect(backend.nodes.get('a').connections).toEqual(observations===1?[]:['c']);};
    backend.afterDiscard=()=>{backend.nodes.get('a').connections=['c'];};
    await store.addEdge(edge());expect(backend.callbacks).toBe(2);expect(observations).toBe(2);
    expect(store.getNeighbors('a')).toEqual(['c','b']);expect(backend.nodes.get('a').connections).toEqual(['c','b']);
    expect(backend.edges.get('a-b')).toEqual(edge());noMutation();
  });
  it.each(['before','after'] as const)('invalidates on %s commit rejection without asserting backend rollback',async failure=>{
    const store=await loaded();backend.failures=failure;
    await expect(store.addEdge(edge())).rejects.toThrow(failure==='before'?'KNOWN_BEFORE_COMMIT':'AMBIGUOUS_AFTER_COMMIT');
    expect(()=>store.getNode('a')).toThrow('cache is not initialized');expect(store['nodes'].size).toBe(0);
    expect(store['edges'].size).toBe(0);expect(store['adjacencyList'].size).toBe(0);
    expect(backend.edges.has('a-b')).toBe(failure==='after');expect(backend.nodes.get('a').connections).toEqual(failure==='after'?['b']:[]);
    backend.failures=undefined;await store.initialize();expect(store.getNeighbors('a')).toEqual(failure==='after'?['b']:[]);noMutation();
  });
  it('serializes concurrent local edge writers without losing either source connection',async()=>{
    const store=await loaded();await Promise.all([store.addEdge(edge()),store.addEdge(edge('a-c','a','c'))]);
    expect(store.getNeighbors('a')).toEqual(['b','c']);expect(backend.nodes.get('a').connections).toEqual(['b','c']);
    expect(store.getEdge('a-b')).toEqual(edge());expect(store.getEdge('a-c')).toEqual(edge('a-c','a','c'));noMutation();
  });
  it.each([
    {id:'',source:'a',target:'b',relationship:'uses',weight:0.8}, {...edge(),id:'x/y'}, {...edge(),source:'../a'},
    {...edge(),target:'b/c'}, {...edge(),relationship:''}, {...edge(),relationship:12}, {...edge(),weight:-0.1},
    {...edge(),weight:1.1}, {...edge(),weight:NaN}, {...edge(),weight:Infinity}, {...edge(),weight:'0.8'},
    {...edge(),extra:undefined}, {...edge(),extra:{callback:()=>1}}, {...edge(),extra:new Map()},
    {...edge(),extra:'x'.repeat(65536)}, {id:'only'},
  ])('rejects invalid input before initialization or any write',async input=>{
    const store=new GraphRAGStore();await expect(store.addEdge(input as GraphEdge)).rejects.toThrow();noIO();noMutation();
  });
  it('rejects a field accessor with zero invocation and no SDK activity',async()=>{
    const store=new GraphRAGStore();const input=edge();let invoked=0;
    Object.defineProperty(input,'source',{enumerable:true,get(){invoked++;return 'a';}});
    await expect(store.addEdge(input)).rejects.toThrow('Unsupported GraphRAG cached accessor');expect(invoked).toBe(0);noIO();
  });
  it('rejects a malformed persisted endpoint before writes and invalidates stale cache',async()=>{
    const store=await loaded();backend.nodes.get('b').id='wrong';
    await expect(store.addEdge(edge())).rejects.toThrow('endpoint ID mismatch');expect(backend.operations).toEqual([]);
    expect(backend.nodes.get('a').connections).toEqual([]);expect(backend.edges.has('a-b')).toBe(false);
    expect(()=>store.getNode('a')).toThrow('cache is not initialized');noMutation();
  });
  it.each([
    {userId:'fixture-user',isPublic:false}, {teamId:'fixture-team',isPublic:false},
    {projectId:'fixture-project',isPublic:false}, {isPublic:true,audited:true,sanitized:true}, undefined,
  ])('retains explicit source markers or their absence through commit and reload',async privacy=>{
    if(privacy===undefined)delete backend.nodes.get('a').privacy;else backend.nodes.get('a').privacy=privacy;
    const store=await loaded();await store.addEdge(edge());const fresh=await loaded();
    expect(fresh.getNode('a')!.privacy).toEqual(privacy);expect(fresh.getNode('a')!.properties).not.toHaveProperty('privacy');
    expect(fresh.getNode('b')!.privacy).toEqual({userId:'fixture-user',isPublic:false});noMutation();
  });
});
