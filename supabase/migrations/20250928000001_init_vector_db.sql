-- VERSATIL SDLC Framework - Initial Vector Database Migration
-- This migration sets up the vector database for Agentic RAG

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search
CREATE EXTENSION IF NOT EXISTS btree_gin; -- For JSONB indexing

-- Create versatil_memories table for RAG memory storage
CREATE TABLE IF NOT EXISTS public.versatil_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'code', 'image', 'diagram', 'mixed')),
  embedding vector(1536), -- OpenAI ada-002 embeddings
  metadata JSONB NOT NULL DEFAULT '{}',
  agent_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('code', 'decision', 'pattern', 'error', 'success', 'learning')),
  relevance_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_contexts table for full context storage
CREATE TABLE IF NOT EXISTS public.agent_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('repository', 'stack', 'ui', 'plan', 'full')),
  context_data JSONB NOT NULL,
  git_branch TEXT,
  project_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create pattern_detections table
CREATE TABLE IF NOT EXISTS public.pattern_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('code', 'error', 'success', 'anti-pattern')),
  description TEXT NOT NULL,
  occurrences INTEGER DEFAULT 1,
  example_memory_ids UUID[] NOT NULL,
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create context_fusions table for merged agent contexts
CREATE TABLE IF NOT EXISTS public.context_fusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fusion_key TEXT NOT NULL UNIQUE, -- Hash of agent IDs + task
  agent_ids TEXT[] NOT NULL,
  task_description TEXT,
  fused_context JSONB NOT NULL,
  fusion_method TEXT NOT NULL CHECK (fusion_method IN ('merge', 'weighted', 'priority', 'consensus')),
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS versatil_memories_embedding_idx
  ON public.versatil_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS versatil_memories_agent_id_idx
  ON public.versatil_memories(agent_id);

CREATE INDEX IF NOT EXISTS versatil_memories_memory_type_idx
  ON public.versatil_memories(memory_type);

CREATE INDEX IF NOT EXISTS versatil_memories_created_at_idx
  ON public.versatil_memories(created_at DESC);

-- GIN index for JSONB metadata search
CREATE INDEX IF NOT EXISTS versatil_memories_metadata_idx
  ON public.versatil_memories USING GIN (metadata jsonb_path_ops);

-- Text search index for content
CREATE INDEX IF NOT EXISTS versatil_memories_content_idx
  ON public.versatil_memories USING GIN (to_tsvector('english', content));

-- Indexes for agent_contexts
CREATE INDEX IF NOT EXISTS agent_contexts_agent_id_idx
  ON public.agent_contexts(agent_id);

CREATE INDEX IF NOT EXISTS agent_contexts_context_type_idx
  ON public.agent_contexts(context_type);

CREATE INDEX IF NOT EXISTS agent_contexts_expires_at_idx
  ON public.agent_contexts(expires_at);

-- GIN index for context_data JSONB
CREATE INDEX IF NOT EXISTS agent_contexts_data_idx
  ON public.agent_contexts USING GIN (context_data jsonb_path_ops);

-- Indexes for pattern_detections
CREATE INDEX IF NOT EXISTS pattern_detections_type_idx
  ON public.pattern_detections(pattern_type);

CREATE INDEX IF NOT EXISTS pattern_detections_confidence_idx
  ON public.pattern_detections(confidence_score DESC);

CREATE INDEX IF NOT EXISTS pattern_detections_tags_idx
  ON public.pattern_detections USING GIN (tags);

-- Indexes for context_fusions
CREATE INDEX IF NOT EXISTS context_fusions_fusion_key_idx
  ON public.context_fusions(fusion_key);

CREATE INDEX IF NOT EXISTS context_fusions_expires_at_idx
  ON public.context_fusions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER versatil_memories_updated_at
  BEFORE UPDATE ON public.versatil_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER pattern_detections_updated_at
  BEFORE UPDATE ON public.pattern_detections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create cleanup function for expired contexts
CREATE OR REPLACE FUNCTION public.cleanup_expired_contexts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired agent contexts
  DELETE FROM public.agent_contexts
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete expired context fusions
  DELETE FROM public.context_fusions
  WHERE expires_at < NOW();

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for semantic search
CREATE OR REPLACE FUNCTION public.search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_agent_id text DEFAULT NULL,
  filter_memory_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  agent_id text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.agent_id,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.metadata,
    m.created_at
  FROM public.versatil_memories m
  WHERE
    (filter_agent_id IS NULL OR m.agent_id = filter_agent_id)
    AND (filter_memory_type IS NULL OR m.memory_type = filter_memory_type)
    AND (1 - (m.embedding <=> query_embedding)) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for hybrid search (text + vector)
CREATE OR REPLACE FUNCTION public.hybrid_search_memories(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  text_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  agent_id text,
  combined_score float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.agent_id,
    (
      text_weight * ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text))
      + vector_weight * (1 - (m.embedding <=> query_embedding))
    ) as combined_score,
    m.metadata,
    m.created_at
  FROM public.versatil_memories m
  WHERE
    to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
    OR (1 - (m.embedding <=> query_embedding)) > 0.7
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Create RLS policies (Row Level Security)
ALTER TABLE public.versatil_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_fusions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read memories (adjust based on your security needs)
CREATE POLICY "Allow public read access"
  ON public.versatil_memories
  FOR SELECT
  USING (true);

-- Policy: Service role can insert memories
CREATE POLICY "Service role can insert memories"
  ON public.versatil_memories
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update memories
CREATE POLICY "Service role can update memories"
  ON public.versatil_memories
  FOR UPDATE
  USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow public read access"
  ON public.agent_contexts
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can modify contexts"
  ON public.agent_contexts
  FOR ALL
  USING (true);

CREATE POLICY "Allow public read access"
  ON public.pattern_detections
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can modify patterns"
  ON public.pattern_detections
  FOR ALL
  USING (true);

CREATE POLICY "Allow public read access"
  ON public.context_fusions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can modify fusions"
  ON public.context_fusions
  FOR ALL
  USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Comment on tables
COMMENT ON TABLE public.versatil_memories IS 'Stores RAG memories with vector embeddings for semantic search';
COMMENT ON TABLE public.agent_contexts IS 'Stores full agent contexts including repository, stack, UI, and plan data';
COMMENT ON TABLE public.pattern_detections IS 'Stores detected patterns from agent executions';
COMMENT ON TABLE public.context_fusions IS 'Stores merged contexts from multiple agents for collaborative tasks';