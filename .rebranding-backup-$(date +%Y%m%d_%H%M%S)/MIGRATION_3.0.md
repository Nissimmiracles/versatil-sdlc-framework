# Migration Guide: VERSATIL Framework 1.x/2.x → 3.0.0

**Version 3.0.0 "Universal Framework"** introduces multi-language support, cloud-native architecture, and Kubernetes orchestration. This guide helps you migrate from earlier versions.

---

## 🎯 What's New in v3.0.0

### Major Features
1. **Multi-Language Support** - Python, Go, Rust, Java projects supported
2. **Cross-Platform Deployment** - Agents as standalone containers
3. **Cloud-Native Architecture** - Stateless orchestrators, distributed RAG
4. **Kubernetes Integration** - Helm charts, auto-scaling, service mesh

### Breaking Changes
- Orchestrators now stateless (requires external state store)
- RAG memory externalized to PostgreSQL/Redis
- Agent configuration format updated
- New API gateway for remote access

---

## 📋 Prerequisites

### Before Migration
- Framework version 1.2.x or 2.x installed
- Git repository with committed changes
- Backup of `.versatil-project.json`
- Node.js 18+ (unchanged)

### New Requirements (v3.0.0)
- **For Cloud Deployment**:
  - Docker 20.10+
  - Kubernetes 1.24+ (optional)
  - PostgreSQL 14+ or Redis 7+ for distributed RAG

---

## 🚀 Migration Steps

### Step 1: Backup Current Setup

```bash
# Backup framework configuration
cp .versatil-project.json .versatil-project.json.backup

# Backup local RAG memory (if using)
cp -r ~/.versatil/rag-memory ~/.versatil/rag-memory.backup

# Note your current version
npm list versatil-sdlc-framework
```

### Step 2: Update Framework

```bash
# Global installation
npm install -g versatil-sdlc-framework@3.0.0

# Project installation
cd your-project
npm install --save-dev versatil-sdlc-framework@3.0.0
```

### Step 3: Run Migration Script

```bash
npm run migrate:v3
```

This script will:
- Update `.versatil-project.json` to v3 format
- Detect project language(s)
- Configure language-specific adapters
- Migrate RAG memory format (if needed)
- Update orchestrator configurations

### Step 4: Configure Language Adapters

#### For Python Projects

```json
{
  "version": "3.0.0",
  "languages": ["typescript", "python"],
  "adapters": {
    "python": {
      "enabled": true,
      "pythonPath": "python3",
      "venvPath": ".venv",
      "agents": ["maria-qa", "marcus-backend"]
    }
  }
}
```

#### For Go Projects

```json
{
  "languages": ["typescript", "go"],
  "adapters": {
    "go": {
      "enabled": true,
      "goPath": "go",
      "modulePath": "./",
      "agents": ["marcus-backend", "devops-dan"]
    }
  }
}
```

### Step 5: Test Migration

```bash
# Validate configuration
npm run validate:v3

# Test framework functionality
npm run test

# Launch dashboard
npm run dashboard
```

---

## 🌐 Cloud-Native Deployment (Optional)

### Local Docker Deployment

```bash
# Build containers
npm run docker:build

# Start with Docker Compose
npm run docker:up

# Access dashboard
open http://localhost:8080
```

### Kubernetes Deployment

```bash
# Install Helm chart
helm install versatil-framework ./k8s/charts/versatil

# Check pods
kubectl get pods -n versatil

# Access dashboard
kubectl port-forward svc/versatil-dashboard 8080:80
```

---

## 🔄 Configuration Changes

### Old Format (v1.x/2.x)

```json
{
  "version": "1.2.1",
  "agents": {
    "maria-qa": { "enabled": true },
    "james-frontend": { "enabled": true }
  },
  "rules": {
    "rule1_parallel_tasks": true
  }
}
```

### New Format (v3.0.0)

```json
{
  "version": "3.0.0",
  "languages": ["typescript"],
  "deployment": {
    "mode": "local",
    "stateless": false
  },
  "agents": {
    "maria-qa": {
      "enabled": true,
      "languages": ["typescript", "python"],
      "deployment": "embedded"
    }
  },
  "adapters": {},
  "rules": {
    "rule1_parallel_tasks": true
  },
  "storage": {
    "rag": {
      "type": "local",
      "path": "~/.versatil/rag-memory"
    }
  }
}
```

---

## 🛠️ Troubleshooting

### Issue: "Language adapter not found"

**Solution**: Install language-specific adapter:

```bash
npm install @versatil/adapter-python
npm install @versatil/adapter-go
```

### Issue: "RAG memory migration failed"

**Solution**: Manually migrate RAG memory:

```bash
node scripts/migrate-rag-v3.cjs
```

### Issue: "Orchestrators not starting"

**Solution**: Check stateless mode configuration:

```json
{
  "deployment": {
    "stateless": true,
    "stateStore": {
      "type": "redis",
      "url": "redis://localhost:6379"
    }
  }
}
```

---

## 📊 Feature Compatibility Matrix

| Feature | v1.x | v2.x | v3.0.0 | Notes |
|---------|------|------|--------|-------|
| TypeScript Projects | ✅ | ✅ | ✅ | Full support |
| Python Projects | ❌ | ❌ | ✅ | NEW in v3.0 |
| Go Projects | ❌ | ❌ | ✅ | NEW in v3.0 |
| Rust Projects | ❌ | ❌ | ✅ | NEW in v3.0 |
| Java Projects | ❌ | ❌ | ✅ | NEW in v3.0 |
| Local RAG Memory | ✅ | ✅ | ✅ | Compatible |
| Distributed RAG | ❌ | ❌ | ✅ | NEW in v3.0 |
| Standalone Agents | ❌ | ❌ | ✅ | NEW in v3.0 |
| Docker Deployment | ❌ | ❌ | ✅ | NEW in v3.0 |
| Kubernetes | ❌ | ❌ | ✅ | NEW in v3.0 |
| Rule 1-5 | ✅ | ✅ | ✅ | Enhanced |
| BMAD Agents | ✅ | ✅ | ✅ | Multi-language |
| Dashboard | ✅ | ✅ | ✅ | Enhanced v3 |

---

## 🔙 Rollback Procedure

If migration fails, rollback to previous version:

```bash
# Restore backup
cp .versatil-project.json.backup .versatil-project.json
cp -r ~/.versatil/rag-memory.backup ~/.versatil/rag-memory

# Reinstall previous version
npm install -g versatil-sdlc-framework@1.2.1

# Verify
npm list versatil-sdlc-framework
```

---

## 📚 Additional Resources

- [v3.0.0 Release Notes](./CHANGELOG.md)
- [Multi-Language Documentation](./docs/multi-language-support.md)
- [Cloud Deployment Guide](./docs/cloud-deployment.md)
- [Kubernetes Guide](./docs/kubernetes-deployment.md)
- [API Reference](./docs/api-reference.md)

---

## 💬 Support

Need help with migration?

- **Issues**: https://github.com/versatil-sdlc-framework/issues
- **Discussions**: https://github.com/versatil-sdlc-framework/discussions
- **Email**: support@versatil-framework.dev

---

**Last Updated**: 2025-09-30
**Framework Version**: 3.0.0
**Maintained By**: VERSATIL Core Team