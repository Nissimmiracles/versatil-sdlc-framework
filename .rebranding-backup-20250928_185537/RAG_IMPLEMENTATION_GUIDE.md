# 🧠 RAG Implementation Guide

## Current Implementation (Local Mock)

What I built is a **demonstration version** that stores memories locally:

```javascript
// Current: Local file-based storage
class VectorMemoryStore {
  async storeMemory(doc) {
    // Saves to .versatil/rag/vector-index/{id}.json
    const id = generateId();
    await fs.writeFile(`${id}.json`, JSON.stringify(doc));
    return id;
  }
  
  async queryMemories(query) {
    // Simple text matching (no real embeddings)
    const files = await fs.readdir('.versatil/rag/vector-index');
    return files.filter(f => f.includes(query));
  }
}
```

## Production Implementation with Supabase

Here's how to implement real RAG with Supabase:

### 1. **Database Setup**

```sql
-- Create vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memories table
CREATE TABLE versatil_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(384), -- OpenAI embeddings
  metadata JSONB,
  agent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  relevance_score FLOAT DEFAULT 1.0
);

-- Create index for vector similarity search
CREATE INDEX memories_embedding_idx ON versatil_memories 
USING ivfflat (embedding vector_cosine_ops);
```

### 2. **Edge Functions Setup**

Create edge functions for memory operations:

```typescript
// supabase/functions/store-memory/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

serve(async (req) => {
  const { content, metadata, agentId } = await req.json()
  
  // Generate embedding
  const openai = new OpenAI(Deno.env.get('OPENAI_API_KEY'))
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  })
  
  // Store in Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_KEY')!
  )
  
  const { data, error } = await supabase
    .from('versatil_memories')
    .insert({
      content,
      embedding: embedding.data[0].embedding,
      metadata,
      agent_id: agentId
    })
    
  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

```typescript
// supabase/functions/query-memories/index.ts
serve(async (req) => {
  const { query, topK = 5, agentId } = await req.json()
  
  // Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  })
  
  // Vector similarity search
  const { data } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding.data[0].embedding,
    match_threshold: 0.7,
    match_count: topK,
    agent_id: agentId
  })
  
  return new Response(JSON.stringify({ memories: data }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 3. **RPC Function for Vector Search**

```sql
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  agent_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  agent_id text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.metadata,
    m.agent_id,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM versatil_memories m
  WHERE 
    1 - (m.embedding <=> query_embedding) > match_threshold
    AND (match_memories.agent_id IS NULL OR m.agent_id = match_memories.agent_id)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4. **Client Integration**

```typescript
// src/rag/supabase-vector-store.ts
import { createClient } from '@supabase/supabase-js';

export class SupabaseVectorStore {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  
  async storeMemory(doc: MemoryDocument): Promise<string> {
    const { data, error } = await this.supabase.functions.invoke('store-memory', {
      body: doc
    });
    
    if (error) throw error;
    return data.id;
  }
  
  async queryMemories(query: RAGQuery): Promise<RAGResult> {
    const { data, error } = await this.supabase.functions.invoke('query-memories', {
      body: query
    });
    
    if (error) throw error;
    return { documents: data.memories };
  }
}
```

### 5. **Environment Setup**

```bash
# .env.local
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

## Migration Path

1. **Start with local mock** (what we have now)
2. **Add Supabase gradually**:
   - Set up database
   - Deploy edge functions
   - Update vector store class
   - Migrate existing memories
3. **Scale as needed**:
   - Add caching layer
   - Implement batch operations
   - Add memory compression
   - Set up replication

## Cost Considerations

- **Supabase**: Free tier includes 500MB database
- **OpenAI Embeddings**: ~$0.0001 per 1K tokens
- **Edge Function Invocations**: 2M free/month
- **Vector Storage**: ~1KB per memory

For typical usage, stays well within free tiers.

## Testing RAG Locally

Until you set up Supabase:
```bash
# Use the mock implementation
node working-demo.cjs

# Test memory operations
node test-enhanced-bmad-working.cjs
```

The mock gives you the same API, so switching to Supabase later is seamless.
