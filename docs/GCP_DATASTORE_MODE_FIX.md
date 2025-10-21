# GCP Datastore Mode Issue - Solution Options

**Issue**: Your GCP project has Firestore in **Datastore Mode**, but we need **Firestore Native Mode** for vector storage.

**Why**: Datastore Mode doesn't support the Firestore SDK features we need (collections, documents, queries).

---

## 🎯 Solution Options

### Option 1: Create New Firestore Database (Recommended - 2 min)

Since GCP now supports multiple databases, create a new Native Mode database alongside your Datastore:

```bash
# Create new Firestore Native Mode database named "versatil-rag"
gcloud firestore databases create \
  --database=versatil-rag \
  --location=us-central1 \
  --type=firestore-native \
  --project=centering-vine-454613-b3
```

**Benefits**:
- ✅ Keeps existing Datastore untouched
- ✅ Isolated database for VERSATIL patterns
- ✅ Native Firestore features available
- ✅ 2 minutes to create

**After creation**, update the code to use the new database name.

### Option 2: Use Different GCP Project (1 min)

Create a new GCP project just for VERSATIL:

1. Visit [GCP Console](https://console.cloud.google.com/projectcreate)
2. Create project: `versatil-rag`
3. Enable Firestore API (Native Mode)
4. Update environment variable: `GOOGLE_CLOUD_PROJECT=versatil-rag`

### Option 3: Migrate to Datastore-Compatible Storage (Fast)

Use Cloud Storage + Vertex AI embeddings instead of Firestore:

**Benefits**:
- ✅ Works with Datastore Mode projects
- ✅ No database mode conflicts
- ✅ Simpler setup
- ✅ Still uses Vertex AI embeddings

**Implementation**: Use Cloud Storage buckets for patterns, query with Vertex AI.

---

## 🚀 Quick Fix: Option 1 (Recommended)

Let me create the new database for you:

```bash
# Step 1: Create new Firestore Native database
gcloud firestore databases create \
  --database=versatil-rag \
  --location=us-central1 \
  --type=firestore-native \
  --project=centering-vine-454613-b3

# Step 2: Wait 1 minute for creation

# Step 3: Run migration (I'll update the code to use new database)
npm run rag:migrate:gcp
```

**Which option do you prefer?**
