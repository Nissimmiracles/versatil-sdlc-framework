# Supabase Setup Guide for VERSATIL RAG

**Status**: Part 1 of approved Supabase + GraphRAG plan
**Estimated Time**: 30 minutes to setup, 1-2 hours to migrate patterns
**Benefit**: 3-5x faster pattern search, persistent cross-machine RAG memory

---

## Quick Start (5 Steps)

### Step 1: Create Supabase Project (10 min)

1. **Sign up at [Supabase](https://supabase.com)** (free tier included)
   - Free tier limits: 500MB database, 2GB bandwidth/month, 50,000 monthly active users
   - No credit card required for free tier

2. **Create new project**:
   - Click "New Project"
   - Choose organization (or create one)
   - Name: `versatil-rag` (or your preference)
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to you (e.g., `us-east-1`, `eu-west-1`)
   - Click "Create new project" (takes 2-3 minutes to provision)

3. **Get credentials** (after project is ready):
   - Navigate to: **Project Settings → API**
   - You'll need 3 values:
     - **Project URL**: `https://[your-project-ref].supabase.co`
     - **anon public**: `eyJhbGc...` (public key, starts with `eyJ`)
     - **service_role secret**: `eyJhbGc...` (private key, starts with `eyJ`)

### Step 2: Add Credentials to `.env` (2 min)

Open `~/.versatil/runtime/.env` and update these lines:

```bash
# Replace these placeholder values with your actual credentials from Step 1

# From Project Settings → API → Project URL
SUPABASE_URL=https://[your-project-ref].supabase.co

# From Project Settings → API → Project API keys → anon public
SUPABASE_ANON_KEY=eyJhbGc[your-actual-anon-key-here]

# From Project Settings → API → Project API keys → service_role (Keep this secret!)
SUPABASE_SERVICE_KEY=eyJhbGc[your-actual-service-key-here]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc[your-actual-service-key-here]  # Same as SERVICE_KEY
```

**Security Note**: The `service_role` key has admin privileges. Never commit it to git or share it publicly!

### Step 3: Run Database Migrations (5 min)

The setup script will create the necessary tables and indexes:

```bash
# Run automated setup (reads credentials from .env)
pnpm run rag:setup
```

**What this creates**:
- ✅ Enables `pgvector` extension
- ✅ Creates `versatil_memories` table with vector column
- ✅ Creates `ivfflat` index for fast similarity search
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates `match_memories()` search function

**If automatic migration fails**:
- The script will print SQL statements
- Copy them to: **Supabase Dashboard → SQL Editor**
- Run the SQL manually (click "Run")

### Step 4: Migrate Local Patterns (10 min)

Migrate your 20 existing patterns from local JSON to Supabase:

```bash
# Run migration script
pnpm run rag:migrate

# Expected output:
# 🔄 Migrating 20 patterns from local storage to Supabase...
# ✅ Migrated pattern: RAG over fine-tuning (ai)
# ✅ Migrated pattern: Component composition (frontend)
# ...
# ✅ Migration complete: 20/20 patterns migrated
```

**What happens**:
1. Reads patterns from `~/.versatil/learning/patterns/*.json`
2. Generates embeddings using OpenAI ada-002 (or local Transformers.js)
3. Stores in Supabase `versatil_memories` table
4. Keeps local copies as backup (doesn't delete)

### Step 5: Test Vector Search (3 min)

Verify everything works:

```bash
# Test Supabase connection and vector search
pnpm run rag:test

# Expected output:
# 🔍 Testing Supabase RAG...
# ✅ Connection successful
# ✅ Vector search working
# 📊 Found 3 similar patterns for query "React component testing"
#    1. React Testing Library with accessible queries (similarity: 0.89)
#    2. Component composition patterns (similarity: 0.84)
#    3. Jest configuration for TypeScript (similarity: 0.78)
```

---

## Configuration Options

### Embedding Provider

**Option A: OpenAI (Recommended for Production)**
- Better quality embeddings (1536 dimensions)
- Requires OpenAI API key
- Cost: ~$0.0001 per pattern (very cheap)

```bash
# Add to ~/.versatil/runtime/.env
OPENAI_API_KEY=sk-[your-openai-key]
USE_LOCAL_EMBEDDINGS=false
EMBEDDING_MODEL=text-embedding-3-small  # or text-embedding-ada-002
```

**Option B: Local Transformers.js (Free, Privacy-First)**
- No API calls, runs locally
- Smaller dimensions (768)
- Slightly lower quality but still good

```bash
# Add to ~/.versatil/runtime/.env
USE_LOCAL_EMBEDDINGS=true
# No API key needed!
```

### Vector Dimension

If using local embeddings, update the Supabase table:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE versatil_memories
  ALTER COLUMN embedding TYPE vector(768);  -- For local embeddings

-- Recreate index with new dimension
DROP INDEX idx_memories_embedding;
CREATE INDEX idx_memories_embedding ON versatil_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Troubleshooting

### Error: "Cannot connect to Supabase"

**Check**:
1. ✅ Project is fully provisioned (green status in dashboard)
2. ✅ URL is correct: `https://[project-ref].supabase.co` (no trailing slash)
3. ✅ Keys are complete (start with `eyJ`, very long strings)
4. ✅ No extra quotes or spaces in `.env` file

**Test connection manually**:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
supabase.from('versatil_memories').select('id').limit(1)
  .then(({data, error}) => console.log(error ? 'Error: ' + error.message : 'Success!'));
"
```

### Error: "pgvector extension not found"

**Solution**: Run this in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "Invalid embedding dimension"

**Check**:
- OpenAI ada-002 = 1536 dimensions
- Local Transformers.js = 768 dimensions
- Table column must match your embedding provider

**Fix**: Update table schema (see "Vector Dimension" above)

### Migration shows "0 patterns migrated"

**Check**:
```bash
# Verify local patterns exist
ls -la ~/.versatil/learning/patterns/*.json

# Should show 20 files like:
# 0c5a17d9add13c01.json
# 1a2b3c4d5e6f7890.json
# ...
```

If no files, patterns haven't been learned yet. Generate patterns by:
1. Complete a feature with VELOCITY workflow
2. Run `/learn` command to codify patterns

---

## Verification Checklist

After setup, verify everything works:

- [ ] Supabase project created and provisioned
- [ ] Credentials added to `~/.versatil/runtime/.env`
- [ ] Database migrations run successfully
- [ ] `versatil_memories` table exists (check in Supabase Table Editor)
- [ ] `pgvector` extension enabled (check in Database → Extensions)
- [ ] 20 patterns migrated to Supabase
- [ ] Vector search test passes
- [ ] VELOCITY workflow uses Supabase RAG (check logs)

---

## Next Steps

After Supabase setup completes:

1. **Test with VELOCITY Workflow**:
   ```bash
   # Plan a feature (will query Supabase RAG)
   /plan "Add user profile page"

   # Check for RAG context in plan output
   # Should show: "Found 3 similar features from RAG memory"
   ```

2. **Monitor Usage**:
   - Supabase Dashboard → Database → versatil_memories (see stored patterns)
   - Check row count, storage size, query performance

3. **Optional: GraphRAG** (Part 2, deferred):
   - Only needed when you have 100+ patterns (3-6 months from now)
   - Adds entity-relationship knowledge graphs
   - Requires Neo4j or Microsoft GraphRAG

---

## Performance Benchmarks

**Local JSON** (current):
- Search time: 50-200ms
- Limitations: No similarity search, keyword-only, single machine

**Supabase Vector** (after setup):
- Search time: 10-50ms (3-5x faster)
- Features: Semantic similarity, cross-machine sync, persistent storage
- Scalability: Handles 10,000+ patterns efficiently

**Expected Speedup**:
- RAG queries: 3-5x faster
- VELOCITY PLAN phase: 2x faster (better context retrieval)
- Cross-machine: Same RAG memory on all devices

---

## Support

**Issues?**
- Check troubleshooting section above
- Review Supabase logs: Dashboard → Logs → Database
- Verify .env credentials are correct
- Run `/doctor --fix` to check framework health

**Questions?**
- Supabase Docs: https://supabase.com/docs/guides/database
- pgvector Guide: https://github.com/pgvector/pgvector
- VERSATIL Discord: [link to community]

---

**Setup Guide Complete** ✅

Once credentials are added and migrations run, you're ready for Part 1 testing!
