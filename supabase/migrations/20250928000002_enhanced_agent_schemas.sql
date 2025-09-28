-- VERSATIL SDLC Framework - Enhanced Agent-Specific Schemas
-- This migration adds domain-specific tables for production agentic RAG
-- Following the user's proposed architecture for Supabase + Edge deployment

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================================
-- AGENT CODE PATTERNS TABLE
-- Stores domain-specific code patterns per agent (Maria, James, Marcus)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_code_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'security-sam', 'devops-dan')),
  pattern_type TEXT NOT NULL, -- 'test-pattern', 'component-pattern', 'api-pattern', etc.
  code_content TEXT NOT NULL,
  file_path TEXT,
  language TEXT NOT NULL, -- 'typescript', 'javascript', 'python', etc.
  framework TEXT, -- 'react', 'vue', 'express', 'jest', etc.
  project_id UUID,
  quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 100),
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 1.0 CHECK (success_rate >= 0 AND success_rate <= 1),
  embedding vector(1536), -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT SOLUTIONS TABLE
-- Stores proven solutions database per agent domain
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'security-sam', 'devops-dan')),
  problem_type TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  solution_code TEXT NOT NULL,
  solution_explanation TEXT,
  effectiveness_score FLOAT CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  implementation_time_mins INTEGER, -- Time to implement solution
  dependencies TEXT[], -- Required dependencies/packages
  compatibility JSONB DEFAULT '{}', -- Framework/version compatibility
  embedding vector(1536),
  context JSONB DEFAULT '{}',
  success_cases INTEGER DEFAULT 0,
  failure_cases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECT STANDARDS TABLE
-- Project-specific conventions and standards per domain
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  agent_domain TEXT NOT NULL CHECK (agent_domain IN ('qa', 'frontend', 'backend', 'security', 'devops')),
  standard_type TEXT NOT NULL, -- 'coding-standard', 'testing-standard', 'security-policy', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1=highest, 10=lowest
  enforcement_level TEXT DEFAULT 'recommended' CHECK (enforcement_level IN ('required', 'recommended', 'optional')),
  embedding vector(1536),
  examples JSONB DEFAULT '[]', -- Code examples demonstrating the standard
  violations JSONB DEFAULT '[]', -- Common violations and fixes
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT EXPERTISE TABLE
-- Agent-specific knowledge accumulation and learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'security-sam', 'devops-dan')),
  expertise_domain TEXT NOT NULL, -- 'testing', 'react', 'api-design', 'security', etc.
  knowledge_item TEXT NOT NULL,
  knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('best-practice', 'pattern', 'anti-pattern', 'technique', 'tip')),
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_count INTEGER DEFAULT 1, -- Number of times this knowledge proved useful
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(1536),
  related_patterns UUID[], -- References to agent_code_patterns
  related_solutions UUID[], -- References to agent_solutions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENT LEARNING SESSIONS TABLE
-- Track agent learning and improvement over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('pattern-learning', 'solution-validation', 'error-analysis', 'success-analysis')),
  input_context JSONB NOT NULL,
  learned_items JSONB NOT NULL, -- What the agent learned
  performance_improvement FLOAT, -- Measured improvement if any
  session_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED INDEXES FOR AGENT-OPTIMIZED QUERIES
-- ============================================================================

-- Vector similarity indexes with agent-specific optimization
CREATE INDEX IF NOT EXISTS agent_code_patterns_embedding_idx
  ON public.agent_code_patterns
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS agent_solutions_embedding_idx
  ON public.agent_solutions
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS project_standards_embedding_idx
  ON public.project_standards
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS agent_expertise_embedding_idx
  ON public.agent_expertise
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Agent-specific lookup indexes
CREATE INDEX IF NOT EXISTS agent_code_patterns_agent_idx
  ON public.agent_code_patterns(agent_name, pattern_type);

CREATE INDEX IF NOT EXISTS agent_solutions_agent_idx
  ON public.agent_solutions(agent_name, problem_type);

CREATE INDEX IF NOT EXISTS project_standards_domain_idx
  ON public.project_standards(agent_domain, project_id);

CREATE INDEX IF NOT EXISTS agent_expertise_agent_domain_idx
  ON public.agent_expertise(agent_name, expertise_domain);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS agent_code_patterns_quality_idx
  ON public.agent_code_patterns(quality_score DESC, usage_count DESC);

CREATE INDEX IF NOT EXISTS agent_solutions_effectiveness_idx
  ON public.agent_solutions(effectiveness_score DESC, success_cases DESC);

CREATE INDEX IF NOT EXISTS project_standards_priority_idx
  ON public.project_standards(priority ASC, enforcement_level);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS agent_patterns_lang_framework_idx
  ON public.agent_code_patterns(agent_name, language, framework);

CREATE INDEX IF NOT EXISTS agent_solutions_problem_effectiveness_idx
  ON public.agent_solutions(agent_name, problem_type, effectiveness_score DESC);

-- JSONB indexes for metadata search
CREATE INDEX IF NOT EXISTS agent_code_patterns_metadata_idx
  ON public.agent_code_patterns USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS agent_solutions_context_idx
  ON public.agent_solutions USING GIN (context jsonb_path_ops);

CREATE INDEX IF NOT EXISTS project_standards_examples_idx
  ON public.project_standards USING GIN (examples jsonb_path_ops);

-- Tags array indexes
CREATE INDEX IF NOT EXISTS agent_code_patterns_tags_idx
  ON public.agent_code_patterns USING GIN (tags);

-- ============================================================================
-- AGENT-SPECIFIC SEARCH FUNCTIONS
-- Optimized for each agent's domain and query patterns
-- ============================================================================

-- Enhanced Maria (QA) - Test patterns and quality standards
CREATE OR REPLACE FUNCTION public.search_qa_patterns(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  language_filter text DEFAULT NULL,
  framework_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  pattern_type text,
  code_content text,
  language text,
  framework text,
  quality_score float,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pattern_type,
    p.code_content,
    p.language,
    p.framework,
    p.quality_score,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.metadata
  FROM public.agent_code_patterns p
  WHERE
    p.agent_name = 'enhanced-maria'
    AND (language_filter IS NULL OR p.language = language_filter)
    AND (framework_filter IS NULL OR p.framework = framework_filter)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding, p.quality_score DESC
  LIMIT match_count;
END;
$$;

-- Enhanced James (Frontend) - Component patterns and UI solutions
CREATE OR REPLACE FUNCTION public.search_frontend_patterns(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  framework_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  pattern_type text,
  code_content text,
  framework text,
  quality_score float,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pattern_type,
    p.code_content,
    p.framework,
    p.quality_score,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.metadata
  FROM public.agent_code_patterns p
  WHERE
    p.agent_name = 'enhanced-james'
    AND (framework_filter IS NULL OR p.framework = framework_filter)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding, p.quality_score DESC
  LIMIT match_count;
END;
$$;

-- Enhanced Marcus (Backend) - API patterns and security solutions
CREATE OR REPLACE FUNCTION public.search_backend_patterns(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  include_security boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  pattern_type text,
  code_content text,
  language text,
  framework text,
  quality_score float,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pattern_type,
    p.code_content,
    p.language,
    p.framework,
    p.quality_score,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.metadata
  FROM public.agent_code_patterns p
  WHERE
    (p.agent_name = 'enhanced-marcus' OR (include_security AND p.agent_name = 'security-sam'))
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding, p.quality_score DESC
  LIMIT match_count;
END;
$$;

-- Multi-agent solution search
CREATE OR REPLACE FUNCTION public.search_agent_solutions(
  query_embedding vector(1536),
  agent_filter text DEFAULT NULL,
  problem_type_filter text DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  agent_name text,
  problem_type text,
  solution_code text,
  solution_explanation text,
  effectiveness_score float,
  similarity float,
  success_rate float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.agent_name,
    s.problem_type,
    s.solution_code,
    s.solution_explanation,
    s.effectiveness_score,
    1 - (s.embedding <=> query_embedding) as similarity,
    CASE WHEN (s.success_cases + s.failure_cases) > 0
         THEN s.success_cases::float / (s.success_cases + s.failure_cases)
         ELSE 1.0
    END as success_rate
  FROM public.agent_solutions s
  WHERE
    (agent_filter IS NULL OR s.agent_name = agent_filter)
    AND (problem_type_filter IS NULL OR s.problem_type = problem_type_filter)
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
  ORDER BY s.embedding <=> query_embedding, s.effectiveness_score DESC
  LIMIT match_count;
END;
$$;

-- Project standards search
CREATE OR REPLACE FUNCTION public.search_project_standards(
  query_embedding vector(1536),
  project_id_filter uuid,
  domain_filter text DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  agent_domain text,
  title text,
  content text,
  priority integer,
  enforcement_level text,
  similarity float,
  examples jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.agent_domain,
    ps.title,
    ps.content,
    ps.priority,
    ps.enforcement_level,
    1 - (ps.embedding <=> query_embedding) as similarity,
    ps.examples
  FROM public.project_standards ps
  WHERE
    ps.project_id = project_id_filter
    AND (domain_filter IS NULL OR ps.agent_domain = domain_filter)
    AND (1 - (ps.embedding <=> query_embedding)) > match_threshold
  ORDER BY ps.priority ASC, ps.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.agent_code_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access" ON public.agent_code_patterns FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.agent_solutions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.project_standards FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.agent_expertise FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.agent_learning_sessions FOR SELECT USING (true);

-- Service role modification policies
CREATE POLICY "Service role can modify patterns" ON public.agent_code_patterns FOR ALL USING (true);
CREATE POLICY "Service role can modify solutions" ON public.agent_solutions FOR ALL USING (true);
CREATE POLICY "Service role can modify standards" ON public.project_standards FOR ALL USING (true);
CREATE POLICY "Service role can modify expertise" ON public.agent_expertise FOR ALL USING (true);
CREATE POLICY "Service role can modify sessions" ON public.agent_learning_sessions FOR ALL USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER agent_code_patterns_updated_at
  BEFORE UPDATE ON public.agent_code_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER agent_solutions_updated_at
  BEFORE UPDATE ON public.agent_solutions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER project_standards_updated_at
  BEFORE UPDATE ON public.project_standards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER agent_expertise_updated_at
  BEFORE UPDATE ON public.agent_expertise
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE public.agent_code_patterns IS 'Domain-specific code patterns for each Enhanced BMAD agent';
COMMENT ON TABLE public.agent_solutions IS 'Proven solutions database per agent domain with effectiveness tracking';
COMMENT ON TABLE public.project_standards IS 'Project-specific conventions and standards per domain';
COMMENT ON TABLE public.agent_expertise IS 'Agent-specific knowledge accumulation and learning';
COMMENT ON TABLE public.agent_learning_sessions IS 'Track agent learning and improvement over time';

-- Completion message
SELECT 'Enhanced agent schemas created successfully! 🚀' as status;