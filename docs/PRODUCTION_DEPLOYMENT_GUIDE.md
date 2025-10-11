# Production Deployment Guide

**VERSATIL SDLC Framework v6.1.0**
**Last Updated**: 2025-10-08
**Deployment Readiness**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Platform Deployment](#cloud-platform-deployment)
6. [Database Setup](#database-setup)
7. [MCP Server Configuration](#mcp-server-configuration)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Observability](#monitoring--observability)
10. [Backup & Disaster Recovery](#backup--disaster-recovery)
11. [Scaling Strategies](#scaling-strategies)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Pre-Deployment Checklist

### Essential Requirements

- [ ] Node.js ≥ 18.0.0 installed
- [ ] npm ≥ 9.0.0 installed
- [ ] Production environment variables configured
- [ ] Anthropic API key obtained (for Claude integration)
- [ ] Supabase project created (for RAG memory - optional but recommended)
- [ ] SSL/TLS certificates ready
- [ ] Domain name configured (if applicable)
- [ ] Backup strategy defined
- [ ] Monitoring solution chosen

### Security Checklist

- [ ] All API keys secured in environment variables
- [ ] `.env` file never committed to version control
- [ ] HTTPS/TLS enabled for all external communications
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers configured
- [ ] Regular security audits scheduled

### Performance Checklist

- [ ] Load testing completed
- [ ] Response time targets defined (< 200ms recommended)
- [ ] Caching strategy implemented
- [ ] CDN configured (if needed)
- [ ] Database indexes optimized

---

## 🔐 Environment Configuration

### Required Environment Variables

Create a `.env` file in production with these variables:

```bash
# =============================================================================
# CORE CONFIGURATION
# =============================================================================

# Node Environment
NODE_ENV=production

# Application
APP_NAME=VERSATIL-SDLC-Framework
APP_VERSION=6.1.0
PORT=3000

# =============================================================================
# ANTHROPIC (Claude AI) - REQUIRED
# =============================================================================

ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_API_URL=https://api.anthropic.com

# =============================================================================
# SUPABASE (RAG Memory Storage) - RECOMMENDED
# =============================================================================

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database connection (if using Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# =============================================================================
# MCP SERVER CONFIGURATION
# =============================================================================

# Chrome MCP (Browser Automation)
CHROME_MCP_ENABLED=true
CHROME_MCP_HEADLESS=true

# GitHub MCP
GITHUB_TOKEN=ghp_your_token_here
GITHUB_MCP_ENABLED=true

# Google Cloud (Vertex AI) - Optional
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
VERTEX_AI_LOCATION=us-central1

# =============================================================================
# SECURITY
# =============================================================================

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secure-random-secret

# JWT Secret (if using JWT authentication)
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=24h

# =============================================================================
# MONITORING & LOGGING
# =============================================================================

# Sentry Error Tracking (Optional)
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Log Level
LOG_LEVEL=info  # debug, info, warn, error

# =============================================================================
# PERFORMANCE
# =============================================================================

# Worker Threads
MAX_WORKERS=4  # Adjust based on CPU cores

# Cache Configuration
REDIS_URL=redis://localhost:6379  # If using Redis for caching
CACHE_TTL=3600  # 1 hour

# =============================================================================
# VERSATIL FRAMEWORK SPECIFIC
# =============================================================================

# Framework Home Directory
VERSATIL_HOME=~/.versatil

# Agent Configuration
MAX_AGENT_INSTANCES=10
AGENT_TIMEOUT_MS=30000

# RAG Configuration
RAG_ENABLED=true
RAG_MAX_EXAMPLES=5
RAG_SIMILARITY_THRESHOLD=0.75

# MCP Health Check Interval (ms)
MCP_HEALTH_CHECK_INTERVAL=60000

# =============================================================================
# OPTIONAL INTEGRATIONS
# =============================================================================

# n8n Workflow Automation (Optional)
N8N_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# Semgrep Security Scanning (Optional)
SEMGREP_API_TOKEN=your-semgrep-token

# Exa Search API (Optional)
EXA_API_KEY=your-exa-api-key
```

### Environment Variable Validation

Add validation script to verify all required variables:

```bash
#!/bin/bash
# scripts/validate-env.sh

required_vars=(
  "NODE_ENV"
  "ANTHROPIC_API_KEY"
)

recommended_vars=(
  "SUPABASE_URL"
  "SUPABASE_KEY"
)

echo "🔍 Validating production environment..."

# Check required variables
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ ERROR: Required variable $var is not set"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

# Check recommended variables
for var in "${recommended_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️  WARNING: Recommended variable $var is not set"
  else
    echo "✅ $var is set"
  fi
done

echo "✅ Environment validation complete"
```

---

## 🐳 Docker Deployment

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# =============================================================================
# Build Stage
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g typescript

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# =============================================================================
# Production Stage
# =============================================================================
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 versatil && \
    adduser -D -u 1001 -G versatil versatil

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy scripts and configuration
COPY scripts ./scripts
COPY .claude ./.claude
COPY bin ./bin

# Set ownership
RUN chown -R versatil:versatil /app

# Switch to non-root user
USER versatil

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

### Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  versatil:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: versatil-framework
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    volumes:
      - versatil-data:/app/.versatil
      - versatil-logs:/app/logs
    networks:
      - versatil-network
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: versatil-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - versatil-network
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: versatil-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - versatil-network
    depends_on:
      - versatil

volumes:
  versatil-data:
  versatil-logs:
  redis-data:

networks:
  versatil-network:
    driver: bridge
```

### Build and Deploy

```bash
# Build Docker image
docker build -t versatil-framework:6.1.0 .

# Tag for registry
docker tag versatil-framework:6.1.0 your-registry.com/versatil-framework:6.1.0
docker tag versatil-framework:6.1.0 your-registry.com/versatil-framework:latest

# Push to registry
docker push your-registry.com/versatil-framework:6.1.0
docker push your-registry.com/versatil-framework:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f versatil

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## ☸️ Kubernetes Deployment

### Namespace

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: versatil
  labels:
    name: versatil
    environment: production
```

### ConfigMap

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: versatil-config
  namespace: versatil
data:
  NODE_ENV: "production"
  APP_NAME: "VERSATIL-SDLC-Framework"
  APP_VERSION: "6.1.0"
  PORT: "3000"
  LOG_LEVEL: "info"
  RAG_ENABLED: "true"
  MCP_HEALTH_CHECK_INTERVAL: "60000"
```

### Secret

Create `k8s/secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: versatil-secrets
  namespace: versatil
type: Opaque
stringData:
  ANTHROPIC_API_KEY: "sk-ant-api03-..."
  SUPABASE_URL: "https://your-project.supabase.co"
  SUPABASE_KEY: "your-anon-key"
  GITHUB_TOKEN: "ghp_..."
  SESSION_SECRET: "your-secret"
```

### Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: versatil-deployment
  namespace: versatil
  labels:
    app: versatil
    version: v6.1.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: versatil
  template:
    metadata:
      labels:
        app: versatil
        version: v6.1.0
    spec:
      containers:
      - name: versatil
        image: your-registry.com/versatil-framework:6.1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: versatil-config
              key: NODE_ENV
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: versatil-secrets
              key: ANTHROPIC_API_KEY
        # Add more env vars as needed
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: versatil-data
          mountPath: /app/.versatil
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: versatil-data
        persistentVolumeClaim:
          claimName: versatil-pvc
      - name: logs
        emptyDir: {}
```

### Service

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: versatil-service
  namespace: versatil
  labels:
    app: versatil
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: versatil
```

### Horizontal Pod Autoscaler

Create `k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: versatil-hpa
  namespace: versatil
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: versatil-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create configmap and secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Check deployment
kubectl get pods -n versatil
kubectl get svc -n versatil

# View logs
kubectl logs -f -n versatil -l app=versatil

# Scale manually (if needed)
kubectl scale deployment versatil-deployment --replicas=5 -n versatil
```

---

## ☁️ Cloud Platform Deployment

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init versatil-framework --platform node.js --region us-east-1

# Create environment
eb create versatil-prod --instance-type t3.medium --scale 3

# Set environment variables
eb setenv NODE_ENV=production ANTHROPIC_API_KEY=sk-ant-...

# Deploy
eb deploy

# Open application
eb open

# View logs
eb logs
```

### Google Cloud Platform (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT/versatil-framework

# Deploy to Cloud Run
gcloud run deploy versatil-framework \
  --image gcr.io/YOUR_PROJECT/versatil-framework \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80

# Get URL
gcloud run services describe versatil-framework --region us-central1
```

### Microsoft Azure (App Service)

```bash
# Create resource group
az group create --name versatil-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name versatil-plan \
  --resource-group versatil-rg \
  --sku P1V2 \
  --is-linux

# Create web app
az webapp create \
  --name versatil-framework \
  --resource-group versatil-rg \
  --plan versatil-plan \
  --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name versatil-framework \
  --resource-group versatil-rg \
  --settings NODE_ENV=production ANTHROPIC_API_KEY=sk-ant-...

# Deploy from Docker
az webapp config container set \
  --name versatil-framework \
  --resource-group versatil-rg \
  --docker-custom-image-name your-registry.com/versatil-framework:6.1.0
```

---

## 🗄️ Database Setup

### Supabase (Recommended for RAG Memory)

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create new project
   - Note down URL and API keys

2. **Create Tables**:

```sql
-- RAG Memory Table
CREATE TABLE IF NOT EXISTS rag_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX ON rag_memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Agent execution history
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  context JSONB,
  response JSONB,
  success BOOLEAN,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_created_at ON agent_executions(created_at DESC);
```

3. **Configure Environment Variables**:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔌 MCP Server Configuration

### Production MCP Setup

Create `mcp-config.prod.json`:

```json
{
  "mcpServers": {
    "chrome": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "HEADLESS": "true",
        "ALLOWED_ORIGINS": "https://yourdomain.com"
      }
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## 🔒 Security Hardening

### SSL/TLS Configuration

**Nginx Configuration** (`nginx.conf`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://versatil:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Rate Limiting

Add to application code:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

---

## 📊 Monitoring & Observability

### Health Check Endpoint

Ensure your application has a health check endpoint:

```typescript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: '6.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

### Logging

**Production Logging Setup**:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Metrics Collection

**Prometheus Setup** (`prometheus.yml`):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'versatil-framework'
    static_configs:
      - targets: ['versatil:3000']
```

---

## 💾 Backup & Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

# Backup Supabase data
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup .versatil directory
tar -czf versatil_data_$(date +%Y%m%d_%H%M%S).tar.gz ~/.versatil/

# Upload to S3 (or your preferred storage)
aws s3 cp backup_*.sql s3://your-backup-bucket/
aws s3 cp versatil_data_*.tar.gz s3://your-backup-bucket/

# Cleanup old backups (keep last 30 days)
find . -name "backup_*.sql" -mtime +30 -delete
find . -name "versatil_data_*.tar.gz" -mtime +30 -delete
```

### Automated Backups

Add to crontab:

```cron
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh
```

---

## 📈 Scaling Strategies

### Horizontal Scaling

- Use Kubernetes HPA (configured above)
- Load balance across multiple instances
- Stateless design allows easy scaling

### Vertical Scaling

- Increase container resources (CPU, memory)
- Optimize Node.js heap size: `node --max-old-space-size=4096`

### Database Scaling

- Read replicas for Supabase
- Connection pooling
- Query optimization

---

## 🔧 Troubleshooting

### Common Issues

**1. Out of Memory**:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" node dist/index.js
```

**2. Slow Response Times**:
- Check database connection pooling
- Enable caching (Redis)
- Review agent timeouts

**3. MCP Server Connection Issues**:
- Verify MCP server process is running
- Check network connectivity
- Review MCP server logs

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Enable Node.js debug
NODE_DEBUG=* npm start
```

---

## 📞 Support

- **Documentation**: https://github.com/Nissimmiracles/versatil-sdlc-framework
- **Issues**: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- **Security**: security@versatil-framework.dev

---

**Production Deployment Guide v1.0**
**VERSATIL SDLC Framework v6.1.0**
**Ready for Production** ✅
