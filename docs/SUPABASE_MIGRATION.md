# Supabase Vector Store Migration Guide

## Overview

The VERSATIL SDLC Framework v1.2.1 introduces **Phase 7: Supabase Client Integration**, providing cloud-native vector storage with dual embedding support, real-time collaboration, and enhanced agent learning capabilities.

This migration system safely transitions existing Enhanced Vector Memory Store data to the new Supabase Vector Store while preserving all agent knowledge and maintaining zero downtime.

## Features

### 🚀 **Zero-Downtime Migration**
- Preserves existing local data during migration
- Gradual transition with fallback mechanisms
- Comprehensive backup and rollback capabilities

### 🔄 **Intelligent Data Conversion**
- Converts memory documents to structured code patterns
- Extracts agent solutions and interactions
- Preserves embeddings and metadata
- Handles duplicate detection and removal

### 📊 **Progress Tracking**
- Real-time migration progress with ETA
- Phase-by-phase status reporting
- Detailed success/error statistics
- Visual progress indicators

### 🛡️ **Safety Features**
- Automatic backup creation
- Dry-run mode for validation
- Integrity validation checks
- Comprehensive error handling

## Prerequisites

### 1. Supabase Configuration

```bash
# Required environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"  # Optional but recommended

# Embedding provider (choose one)
export OPENAI_API_KEY="your-openai-key"  # For production quality
# OR use local embeddings (automatic fallback)
export USE_LOCAL_EMBEDDINGS=true
```

### 2. Database Setup

The migration system requires Supabase with the pgvector extension enabled:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Tables are automatically created during migration
-- See src/lib/supabase-vector-store.ts for schema details
```

### 3. Framework Preparation

```bash
# Build the framework
npm run build

# Verify configuration
npm run migrate:vector-store:status
```

## Migration Commands

### Status Check
```bash
# Check prerequisites and current state
npm run migrate:vector-store:status
```

### Dry Run
```bash
# Preview migration without making changes
npm run migrate:vector-store:dry-run
```

### Full Migration
```bash
# Execute complete migration
npm run migrate:vector-store
```

### Advanced Options
```bash
# Custom migration with options
node scripts/migrate-vector-store.cjs migrate \
  --batch-size 100 \
  --agent-filter enhanced-maria enhanced-james \
  --no-backup \
  --progress-interval 3000
```

## Migration Process

### Phase 1: Pre-Migration Validation
- ✅ Validates source store availability
- ✅ Checks Supabase configuration
- ✅ Verifies embedding provider setup
- ✅ Detects existing target data

### Phase 2: Backup Creation
- 📦 Creates timestamped backup file
- 📊 Includes metadata and statistics
- 💾 Stored in `.versatil/backups/`

### Phase 3: Target Store Initialization
- 🏗️ Initializes Supabase Vector Store
- 🔗 Establishes database connections
- 📋 Creates required tables and indexes

### Phase 4: Memory Migration
- 🔄 Converts memory documents to code patterns
- 🧠 Preserves embeddings when possible
- 🚫 Skips duplicates (configurable)
- ⚡ Processes in configurable batches

### Phase 5: Solution Migration
- 🎯 Extracts solution-oriented memories
- 📝 Creates agent solution records
- 🤝 Generates interaction history
- 📈 Maintains effectiveness scores

### Phase 6: Post-Migration Validation
- ✅ Validates data integrity
- 🔍 Tests search functionality
- 📊 Generates migration report
- 💡 Provides recommendations

## Migration Options

| Option | Default | Description |
|--------|---------|-------------|
| `--dry-run` | false | Preview changes without executing |
| `--no-backup` | false | Skip backup creation (not recommended) |
| `--no-preserve-local` | false | Remove local data after migration |
| `--batch-size <num>` | 50 | Items to process per batch |
| `--no-skip-duplicates` | false | Migrate duplicate patterns |
| `--no-preserve-embeddings` | false | Regenerate all embeddings |
| `--agent-filter <agents>` | all | Migrate only specified agents |
| `--time-range <start,end>` | all | Migrate items in time range |
| `--no-validate-integrity` | false | Skip post-migration validation |

## Post-Migration

### 1. Agent Configuration

After successful migration, update agent configurations to use Supabase:

```typescript
// Update Enhanced OPERA agents
import { createSupabaseEnhancedAgent } from './src/agents/supabase-agent-integration.js';
import { supabaseConfig } from './src/config/supabase-config.js';

// Wrap existing agents with Supabase integration
const mariaAgent = createSupabaseEnhancedAgent(
  existingMariaAgent,
  supabaseConfig.getAgentConfig('enhanced-maria')
);
```

### 2. Validation Testing

```bash
# Test Supabase integration
npm run test:supabase

# Test agent functionality
npm run test:maria-qa
npm run test:agents

# Validate search performance
npm run migrate:vector-store:validate
```

### 3. Performance Monitoring

```bash
# Monitor framework health
npm run health-check

# Check Supabase metrics
npm run test:supabase:cloud
```

## Troubleshooting

### Common Issues

#### ❌ "Supabase not configured"
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verify configuration
npm run migrate:vector-store:status
```

#### ❌ "Migration failed: duplicate patterns"
```bash
# Use skip duplicates option
npm run migrate:vector-store -- --skip-duplicates
```

#### ❌ "Embedding generation failed"
```bash
# Use local embeddings fallback
export USE_LOCAL_EMBEDDINGS=true
npm run migrate:vector-store
```

#### ❌ "Target store has existing data"
```bash
# Clean target store or skip duplicates
npm run migrate:vector-store -- --skip-duplicates
```

### Recovery Procedures

#### Restore from Backup
```bash
# Backups are stored in .versatil/backups/
ls .versatil/backups/

# Manual restore (implementation depends on backup format)
# See migration documentation for specific procedures
```

#### Rollback Migration
```bash
# Rollback functionality (future enhancement)
npm run migrate:vector-store:rollback
```

## Migration Report

After completion, the migration generates a comprehensive report:

```typescript
interface MigrationReport {
  success: boolean;
  duration: number;
  phases: {
    [phaseName: string]: {
      completed: boolean;
      items: number;
      success: number;
      errors: number;
      warnings: string[];
    };
  };
  finalStats: {
    totalMemories: number;
    migratedPatterns: number;
    migratedSolutions: number;
    migratedInteractions: number;
    preservedEmbeddings: number;
    duplicatesSkipped: number;
  };
  recommendations: string[];
}
```

## Example Migration Flow

```bash
# 1. Check current status
npm run migrate:vector-store:status
# ✅ Source: 1,247 memories across 6 agents
# ✅ Supabase: Configured and ready
# ✅ Embeddings: OpenAI provider available

# 2. Perform dry run
npm run migrate:vector-store:dry-run
# 🔍 DRY RUN: Would migrate 1,247 memories
# 📊 Breakdown: 340 patterns, 123 solutions, 784 interactions
# ⚠️  47 duplicates would be skipped

# 3. Execute migration
npm run migrate:vector-store
# 🚀 Starting migration...
# Phase 1: ✅ Pre-validation (1,247 items)
# Phase 2: ✅ Backup created (vector-store-1703123456789.json)
# Phase 3: ✅ Target initialized
# Phase 4: 🔄 Migrating memories... 78% (978/1,247)
# Phase 5: ✅ Solutions migrated (123 solutions)
# Phase 6: ✅ Validation passed
#
# ✅ Migration completed in 45s
# 📊 Final stats:
#   - Migrated patterns: 1,200
#   - Preserved embeddings: 1,156
#   - Duplicates skipped: 47
#   - Success rate: 98.2%

# 4. Validate results
npm run migrate:vector-store:validate
# ✅ Search functionality working
# ✅ Agent integration successful
# ✅ Real-time collaboration active

# 5. Test framework
npm run test:supabase
# ✅ All Supabase integration tests pass
```

## Best Practices

### 1. Pre-Migration
- ✅ Always run status check first
- ✅ Perform dry run to preview changes
- ✅ Ensure stable internet connection
- ✅ Have sufficient Supabase quota
- ✅ Test with small agent subset first

### 2. During Migration
- ✅ Monitor progress and logs
- ✅ Don't interrupt the migration process
- ✅ Keep terminal session active
- ✅ Watch for error patterns

### 3. Post-Migration
- ✅ Validate search functionality
- ✅ Test agent interactions
- ✅ Monitor performance metrics
- ✅ Update documentation
- ✅ Train team on new features

## Advanced Configuration

### Custom Embedding Models

```typescript
// Configure custom embedding model
export const customConfig = {
  embeddingModel: 'text-embedding-3-small',
  useLocalEmbeddings: false,
  batchSize: 100
};
```

### Real-time Collaboration

```typescript
// Enable real-time collaboration
export const collaborationConfig = {
  enableCollaboration: true,
  enableLearning: true,
  enableMonitoring: true
};
```

### Performance Tuning

```typescript
// Optimize for large datasets
export const performanceConfig = {
  batchSize: 200,           // Larger batches for speed
  maxRetries: 5,           // More retries for reliability
  retryDelay: 2000,        // Longer delays for stability
  cacheSize: 500           // Larger cache for performance
};
```

---

## Support

For migration issues or questions:

1. 📖 Check this documentation
2. 🔍 Search existing issues
3. 📝 Create detailed issue report
4. 🤝 Contact VERSATIL support team

**Happy migrating! 🚀**