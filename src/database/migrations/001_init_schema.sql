-- Initial Migration for VERSATIL ML Workflow Database
-- Generated: 2025-10-29
-- Database: PostgreSQL 15+

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ENUM types (Prisma will handle these, but included for reference)
-- Enums: WorkflowStatus, DatasetType, ModelType, ModelVersionStatus,
--        ExperimentStatus, TrainingJobStatus, EndpointStatus, DeploymentStatus,
--        PredictionStatus, PatternType, PatternJobStatus, ServiceStatus, ServiceDeploymentStatus

-- Note: Prisma migrations will handle schema creation via `npx prisma migrate dev`
-- This file serves as documentation of the database schema

-- Indexes for performance optimization
-- Created automatically by Prisma based on @@index directives in schema.prisma

-- Full-text search indexes (to be added later if needed)
-- CREATE INDEX workflows_search_idx ON workflows USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX datasets_search_idx ON datasets USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX models_search_idx ON models USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Vector similarity indexes (for future RAG integration)
-- ALTER TABLE datasets ADD COLUMN embedding vector(1536);
-- CREATE INDEX datasets_embedding_idx ON datasets USING ivfflat (embedding vector_cosine_ops);
