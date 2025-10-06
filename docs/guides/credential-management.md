# VERSATIL Framework - Credential Setup Guide

**Complete guide to configuring API keys and service credentials for all MCP integrations**

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Why Credentials are Needed](#why-credentials-are-needed)
- [Security & Isolation](#security--isolation)
- [Service-by-Service Setup](#service-by-service-setup)
  - [Supabase (Required)](#1-supabase-required)
  - [Google Vertex AI](#2-google-vertex-ai)
  - [GitHub](#3-github)
  - [Sentry](#4-sentry)
  - [Semgrep](#5-semgrep)
  - [Exa Search](#6-exa-search)
  - [n8n](#7-n8n)
  - [OpenAI](#8-openai)
- [CLI Commands](#cli-commands)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Interactive Wizard (Recommended)

```bash
# Run the credential setup wizard
versatil setup credentials

# Or use the credentials command directly
versatil credentials setup
```

The wizard will:
1. Detect which services you need based on your project
2. Guide you through obtaining each credential
3. Validate credentials with connectivity tests
4. Store credentials securely in `~/.versatil/.env`

### Manual Setup

If you prefer to configure credentials manually:

```bash
# Copy the example file
cp .env.example ~/.versatil/.env

# Edit with your credentials
nano ~/.versatil/.env

# Test your credentials
versatil credentials test
```

---

## 🤔 Why Credentials are Needed

VERSATIL integrates with **8 external services** to provide powerful AI-native development capabilities:

| Service | Purpose | Required? | Fallback Available? |
|---------|---------|-----------|---------------------|
| **Supabase** | Vector database for RAG memory | ✅ Yes | ❌ No |
| **Vertex AI** | Google's Gemini models for code generation | ⚠️ Recommended | ✅ Hash-based embeddings |
| **GitHub** | Repository management, PR automation | ⚠️ Recommended | ❌ No |
| **Sentry** | Error monitoring | ⭕ Optional | ✅ Generic stack parser |
| **Semgrep** | Security scanning | ⭕ Optional | ✅ Local binary + patterns |
| **Exa** | AI-powered web search | ⭕ Optional | ❌ No |
| **n8n** | Workflow automation | ⭕ Optional | ❌ No |
| **OpenAI** | Alternative to Vertex AI | ⭕ Optional | ❌ No |

**Without credentials**, the framework will:
- ✅ Still work for basic features
- ✅ Use fallback implementations where available
- ⚠️ Miss advanced AI-powered capabilities
- ⚠️ Cannot store agent memory (Supabase required)

---

## 🔒 Security & Isolation

### Where Credentials are Stored

**All credentials are stored in `~/.versatil/.env`** - your home directory, **NEVER** in your project folder.

```
~/.versatil/                    ← Framework home (isolated)
  ├── .env                      ← Your credentials (600 permissions)
  ├── supabase/                 ← Supabase local setup
  └── daemon/                   ← Daemon logs

/Users/you/my-project/          ← Your project (clean)
  ├── src/
  ├── package.json
  └── .versatil-project.json    ← Only this file (project config)
```

### Security Features

1. **File Permissions**: `.env` file is created with `600` (user read/write only)
2. **No Git Commits**: Framework files never touch your project's git repo
3. **Environment Variables**: Credentials loaded as env vars, never hardcoded
4. **Optional Encryption**: Future versions will support credential encryption at rest

**⚠️ IMPORTANT**: Never commit `~/.versatil/.env` to version control!

---

## 📦 Service-by-Service Setup

### 1. Supabase (Required)

**What it does**: Vector database for storing agent memory, code patterns, and enabling semantic search (RAG system).

**Why required**: Without Supabase, agents cannot remember context across sessions.

#### Get Credentials

1. **Sign up** at [supabase.com](https://app.supabase.com)
2. **Create a new project** (free tier available)
3. Go to **Project Settings** → **API**
4. Copy the following:
   - **Project URL**: `https://xxxxxxxxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

#### Configure

```bash
# Via wizard
versatil credentials setup --service supabase

# Or add to ~/.versatil/.env manually
SUPABASE_URL="https://xxxxxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Verify Setup

```bash
# Test connection
versatil credentials test

# Should show:
# ✅ Supabase - Connected to Supabase successfully (XXms)
```

---

### 2. Google Vertex AI

**What it does**: Google's Gemini models for AI-powered code generation, embeddings, and analysis.

**Why recommended**: Provides state-of-the-art code generation capabilities via Gemini 1.5 Pro/Flash.

**Fallback**: Hash-based deterministic embeddings (development only, not recommended for production).

#### Get Credentials

1. **Create GCP Project** at [console.cloud.google.com](https://console.cloud.google.com/)
2. **Enable Vertex AI API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Vertex AI API"
   - Click **Enable**
3. **Create Service Account**:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `versatil-ai`
   - Role: **Vertex AI User**
   - Click **Create and Continue**
   - Click **Done**
4. **Create Key**:
   - Click on the service account
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Choose **JSON**
   - Save the file (e.g., `versatil-ai-key.json`)

#### Configure

```bash
# Via wizard
versatil credentials setup --service vertex-ai

# Or add to ~/.versatil/.env manually
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_CLOUD_LOCATION="us-central1"  # or europe-west1, asia-southeast1
GOOGLE_APPLICATION_CREDENTIALS="/path/to/versatil-ai-key.json"
```

**Supported Regions**: `us-central1`, `us-east1`, `us-west1`, `europe-west1`, `asia-southeast1`

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ Vertex AI - Connected to Vertex AI project: your-project-id (XXms)
```

---

### 3. GitHub

**What it does**: GitHub API integration for creating issues, managing PRs, syncing code, automated workflows.

**Why recommended**: Enables automated repository management and CI/CD workflows.

#### Get Credentials

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens/new)
2. Click **Generate new token** → **Generate new token (classic)**
3. Name: `VERSATIL Framework`
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub workflows)
   - ✅ `admin:org` (if using organization features)
5. Click **Generate token**
6. Copy the token (starts with `ghp_` or `github_pat_`)

**⚠️ IMPORTANT**: Save this token immediately - GitHub only shows it once!

#### Configure

```bash
# Via wizard
versatil credentials setup --service github

# Or add to ~/.versatil/.env manually
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ GitHub - Connected as your-username (XXms)
```

---

### 4. Sentry

**What it does**: Error monitoring, stack trace analysis, performance tracking.

**Why optional**: Useful for production apps with error monitoring needs.

**Fallback**: Generic JavaScript stack trace parser (works without Sentry account).

#### Get Credentials

1. **Sign up** at [sentry.io/signup](https://sentry.io/signup/)
2. **Create a project** (choose platform: Node.js / Browser JavaScript)
3. Go to **Settings** → **Projects** → **your-project**
4. Copy the **DSN** (Data Source Name):
   - Example: `https://xxxx@xxxx.ingest.sentry.io/xxxx`
5. **(Optional)** Create **Auth Token**:
   - Go to **Settings** → **Developer Settings** → **Auth Tokens**
   - Click **Create New Token**
   - Scopes: `project:read`, `project:write`
   - Copy the token (starts with `sntrys_`)

#### Configure

```bash
# Via wizard
versatil credentials setup --service sentry

# Or add to ~/.versatil/.env manually
SENTRY_DSN="https://xxxx@xxxx.ingest.sentry.io/xxxx"
SENTRY_AUTH_TOKEN="sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Optional
SENTRY_ORG="your-org-slug"  # Optional
```

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ Sentry - Sentry DSN valid for project XXXX (XXms)
```

---

### 5. Semgrep

**What it does**: Static code analysis, security scanning, OWASP Top 10 compliance checking.

**Why optional**: Adds security scanning capabilities.

**Fallback**: Local Semgrep binary + pattern-based fallback (works without API key).

#### Get Credentials

1. **Sign up** at [semgrep.dev/login](https://semgrep.dev/login)
2. Go to **Settings** → **Tokens**
3. Click **Create New Token**
4. Name: `VERSATIL Framework`
5. Copy the token (starts with `sgk_`)

**Note**: API key is **optional**. Semgrep works without it using local binary + rules.

#### Configure

```bash
# Via wizard
versatil credentials setup --service semgrep

# Or add to ~/.versatil/.env manually (optional)
SEMGREP_API_KEY="sgk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Verify Setup

```bash
versatil credentials test

# With API key:
# ✅ Semgrep - Semgrep API key valid (XXms)

# Without API key:
# ✅ Semgrep - Semgrep will use local binary (no API key configured)
```

---

### 6. Exa Search

**What it does**: AI-powered web search for documentation, Stack Overflow, GitHub solutions.

**Why optional**: Enhances agent's ability to find answers from the web.

**Fallback**: None (requires API key).

#### Get Credentials

1. **Sign up** at [dashboard.exa.ai](https://dashboard.exa.ai/api-keys)
2. Click **Create API Key**
3. Name: `VERSATIL Framework`
4. Copy the key (starts with `exa_`)

#### Configure

```bash
# Via wizard
versatil credentials setup --service exa

# Or add to ~/.versatil/.env manually
EXA_API_KEY="exa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ Exa - Exa API key valid (XXms)
```

---

### 7. n8n

**What it does**: Workflow automation platform - trigger actions, integrate external services.

**Why optional**: Adds workflow automation capabilities.

**Fallback**: None (requires n8n instance).

#### Get Credentials

**Option 1: n8n Cloud**
1. Sign up at [n8n.io/cloud](https://n8n.io/cloud/)
2. Go to **Settings** → **API**
3. Create API key
4. Copy base URL and API key

**Option 2: Self-hosted**
1. Install n8n: `npm install -g n8n`
2. Run: `n8n start`
3. Access at `http://localhost:5678`
4. Go to **Settings** → **API** → **Create API Key**

#### Configure

```bash
# Via wizard
versatil credentials setup --service n8n

# Or add to ~/.versatil/.env manually
N8N_BASE_URL="http://localhost:5678"  # or https://your-instance.app.n8n.cloud
N8N_API_KEY="n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ n8n - Connected to n8n successfully (XXms)
```

---

### 8. OpenAI

**What it does**: OpenAI API for embeddings and analysis (alternative to Vertex AI).

**Why optional**: Alternative AI provider if not using Vertex AI.

**Fallback**: Use Vertex AI instead.

#### Get Credentials

1. **Sign up** at [platform.openai.com/signup](https://platform.openai.com/signup)
2. Go to **API Keys**
3. Click **Create new secret key**
4. Name: `VERSATIL Framework`
5. Copy the key (starts with `sk-`)

**⚠️ IMPORTANT**: OpenAI API is paid - monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

#### Configure

```bash
# Via wizard
versatil credentials setup --service openai

# Or add to ~/.versatil/.env manually
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Verify Setup

```bash
versatil credentials test

# Should show:
# ✅ OpenAI - OpenAI API key valid (XXms)
```

---

## 🛠️ CLI Commands

### Setup Commands

```bash
# Run interactive wizard (all services)
versatil setup credentials

# Same as above
versatil credentials setup

# Configure specific service
versatil credentials setup --service vertex-ai
versatil credentials setup --service github

# Configure multiple services
versatil credentials setup --service vertex-ai --service github --service supabase

# Skip connection tests (faster)
versatil credentials setup --skip-tests
```

### Manage Commands

```bash
# List configured services
versatil credentials list

# Test all credentials
versatil credentials test

# Show help
versatil credentials help
```

### Configuration Wizard Options

When you run `versatil setup credentials`, you'll see:

```
Which services would you like to configure?

1. Required services only (Supabase)
2. Recommended services (Supabase + GitHub + Vertex AI)
3. All available services
4. Custom selection

Your choice (1-4):
```

**Recommendation**: Choose option 2 (Recommended services) for best experience.

---

## 🔧 Troubleshooting

### "File not found: ~/.versatil/.env"

**Solution**: Run the wizard to create the file:
```bash
versatil setup credentials
```

### "Invalid Vertex AI service account JSON"

**Problem**: Service account JSON is malformed or missing required fields.

**Solution**:
1. Download a fresh service account key from GCP Console
2. Verify the JSON contains: `"type": "service_account"`, `"private_key"`, `"client_email"`
3. Use absolute path in `GOOGLE_APPLICATION_CREDENTIALS`

### "Supabase connection failed: HTTP 401"

**Problem**: Invalid anon key or service key.

**Solution**:
1. Check keys are correct (copy from Supabase dashboard)
2. Ensure no extra spaces or quotes
3. Verify project URL matches exactly

### "GitHub: Invalid token or insufficient permissions"

**Problem**: Token doesn't have required scopes.

**Solution**:
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Edit your token
3. Enable: `repo`, `workflow`, `admin:org`
4. Click **Update token**
5. Re-run setup: `versatil credentials setup --service github`

### "Connection test timed out"

**Problem**: Network issues or service unavailable.

**Solution**:
1. Check internet connection
2. Verify service is accessible (try in browser)
3. Check firewall/proxy settings
4. Retry later or skip tests: `versatil credentials setup --skip-tests`

### "Permission denied: ~/.versatil/.env"

**Problem**: File permissions incorrect.

**Solution**:
```bash
chmod 600 ~/.versatil/.env
```

### "Want to reconfigure a service"

**Solution**:
```bash
# Run wizard again
versatil credentials setup --service vertex-ai

# Or edit ~/.versatil/.env manually
nano ~/.versatil/.env

# Test your changes
versatil credentials test
```

---

## 📚 Additional Resources

- **Framework Documentation**: [docs/](.)
- **MCP Integration Status**: [docs/MCP_INTEGRATIONS_STATUS.md](MCP_INTEGRATIONS_STATUS.md)
- **Roadmap to 100%**: [docs/ROADMAP_TO_100_PERCENT.md](ROADMAP_TO_100_PERCENT.md)
- **GitHub Repository**: [github.com/Nissimmiracles/versatil-sdlc-framework](https://github.com/Nissimmiracles/versatil-sdlc-framework)

---

## ✅ Next Steps

After configuring credentials:

```bash
# 1. Start the proactive daemon
versatil-daemon start

# 2. Verify everything works
versatil doctor

# 3. Test agents
versatil agents

# 4. Create your first feature
cd ~/my-project
versatil init
```

---

**Need help?** Open an issue at [github.com/Nissimmiracles/versatil-sdlc-framework/issues](https://github.com/Nissimmiracles/versatil-sdlc-framework/issues)
