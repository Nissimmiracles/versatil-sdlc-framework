# VERSATIL Edge Functions - Production Deployment Guide

## Overview

The VERSATIL SDLC Framework includes advanced Supabase Edge Functions that provide cloud-native processing for Enhanced OPERA agents with enterprise-grade performance, security, and monitoring.

## Architecture

### 🏗️ **Edge Function Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Runtime                     │
├─────────────────────────────────────────────────────────────┤
│  📡 opera-agent (Unified Router)                            │
│  ├── Production Optimizations                               │
│  │   ├── 🚀 Response Caching (5min TTL)                    │
│  │   ├── 🛡️ Rate Limiting (200 req/min/IP)                │
│  │   ├── 📦 Response Compression (gzip)                    │
│  │   └── 📊 Performance Monitoring                         │
│  ├── Agent Routing                                         │
│  │   ├── enhanced-maria (QA Specialist)                   │
│  │   ├── enhanced-james (Frontend Expert)                 │
│  │   ├── enhanced-marcus (Backend Expert)                 │
│  │   ├── enhanced-sarah (Project Manager)                 │
│  │   ├── enhanced-alex (Business Analyst)                 │
│  │   └── enhanced-dr-ai (ML Specialist)                   │
│  └── RAG Integration                                       │
│      ├── Vector Similarity Search                         │
│      ├── Pattern Retrieval                                │
│      └── Context Fusion                                   │
├─────────────────────────────────────────────────────────────┤
│  🔍 Specialized RAG Functions                              │
│  ├── maria-rag (QA-specific RAG)                          │
│  ├── james-rag (Frontend-specific RAG)                    │
│  └── marcus-rag (Backend-specific RAG)                    │
├─────────────────────────────────────────────────────────────┤
│  💾 Vector Memory Functions                                │
│  ├── store-memory (Vector Storage)                        │
│  ├── query-memories (Vector Retrieval)                    │
│  └── context-fusion (Context Enhancement)                 │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 🚀 **Production Optimizations**

- **Response Caching**: Intelligent caching with TTL and LRU eviction
- **Rate Limiting**: Sliding window rate limiting per IP address
- **Compression**: Automatic gzip compression for responses > 1KB
- **Monitoring**: Real-time performance metrics and health checks
- **Error Handling**: Comprehensive error tracking and recovery

### 🤖 **Unified Agent Processing**

- **Single Entry Point**: Unified OPERA agent router for all agents
- **Intelligent Routing**: Automatic agent detection and request routing
- **Context Preservation**: Zero context loss during agent processing
- **Performance**: <200ms average response times at scale

### 📊 **Monitoring & Analytics**

- **Health Endpoints**: Comprehensive health checks for all functions
- **Metrics Collection**: Detailed performance and usage analytics
- **Error Tracking**: Real-time error monitoring and alerting
- **Usage Analytics**: Request patterns and optimization insights

## Deployment

### Prerequisites

```bash
# Required environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
export OPENAI_API_KEY="your-openai-key"

# Install Supabase CLI
npm install -g @supabase/cli

# Build the framework
npm run build
```

### Deployment Commands

```bash
# Validate environment and configuration
npm run edge:validate

# Deploy all edge functions
npm run edge:deploy

# Deploy with verification
npm run edge:deploy:verify

# Check health of deployed functions
npm run edge:health

# Monitor function performance
npm run edge:monitor

# Run integration tests
npm run test:edge-functions
```

### Manual Deployment

```bash
# Deploy individual functions
supabase functions deploy opera-agent
supabase functions deploy maria-rag
supabase functions deploy james-rag
supabase functions deploy marcus-rag

# Deploy with environment variables
supabase functions deploy opera-agent --env-file .env.production
```

## Function Reference

### 1. OPERA Agent Router (`opera-agent`)

**Endpoint**: `https://[project-ref].supabase.co/functions/v1/opera-agent`

#### Request Format

```json
{
  "agent": "enhanced-maria",
  "action": "analyze",
  "context": {
    "filePath": "src/components/Button.tsx",
    "content": "import React from 'react'...",
    "language": "typescript",
    "framework": "react",
    "projectId": "my-project"
  },
  "config": {
    "maxExamples": 3,
    "similarityThreshold": 0.8,
    "enableLearning": true,
    "enableCollaboration": true,
    "cacheResults": true
  }
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "analysis": { /* Agent-specific analysis */ },
    "patterns": [ /* Similar code patterns */ ],
    "suggestions": [ /* Actionable recommendations */ ],
    "prompt": "Enhanced prompt with RAG context",
    "ragInsights": {
      "similarPatterns": 3,
      "projectStandards": 2,
      "expertise": 5,
      "avgSimilarity": 0.87,
      "processingMode": "enhanced-maria-qa"
    }
  },
  "metadata": {
    "agentId": "enhanced-maria",
    "processingTime": 245,
    "queryType": "qa-analyze",
    "cacheHit": false,
    "model": "sonnet"
  }
}
```

#### Supported Agents

| Agent | Specialization | Use Cases |
|-------|---------------|-----------|
| `enhanced-maria` | Quality Assurance Lead | Test coverage, bug detection, quality gates |
| `enhanced-james` | Frontend Specialist | React/Vue components, UI/UX, performance |
| `enhanced-marcus` | Backend Expert | API architecture, database, security |
| `enhanced-sarah` | Project Manager | Coordination, documentation, planning |
| `enhanced-alex` | Business Analyst | Requirements, user stories, analysis |
| `enhanced-dr-ai` | ML Specialist | Machine learning, data science, optimization |

#### Health Check

```bash
# Check function health
curl https://[project-ref].supabase.co/functions/v1/opera-agent/health \
  -H "Authorization: Bearer [anon-key]"
```

Response:
```json
{
  "status": "healthy",
  "version": "1.2.1",
  "metrics": {
    "requestCount": 1247,
    "uptime": 86400000,
    "avgProcessingTime": 234,
    "cacheHitRate": 0.73
  }
}
```

#### Metrics Endpoint

```bash
# Get detailed metrics
curl https://[project-ref].supabase.co/functions/v1/opera-agent/metrics \
  -H "Authorization: Bearer [anon-key]"
```

### 2. Specialized RAG Functions

#### Maria RAG (`maria-rag`)
- **Purpose**: QA-specific RAG processing
- **Endpoint**: `/functions/v1/maria-rag`
- **Specializes in**: Test patterns, QA best practices, quality standards

#### James RAG (`james-rag`)
- **Purpose**: Frontend-specific RAG processing
- **Endpoint**: `/functions/v1/james-rag`
- **Specializes in**: Component patterns, UI/UX solutions, performance optimization

#### Marcus RAG (`marcus-rag`)
- **Purpose**: Backend-specific RAG processing
- **Endpoint**: `/functions/v1/marcus-rag`
- **Specializes in**: API patterns, security solutions, database optimization

## Production Configuration

### Rate Limiting

```typescript
// Default rate limiting configuration
{
  windowMs: 60000,        // 1 minute window
  maxRequests: 200,       // 200 requests per minute per IP
  skipSuccessfulRequests: false
}
```

### Caching

```typescript
// Default caching configuration
{
  ttl: 5 * 60 * 1000,     // 5 minutes TTL
  maxSize: 500,           // 500 cached responses
  keyPrefix: 'opera:',     // Cache key prefix
  skipCache: (key, value) => value.success === false  // Skip error responses
}
```

### Compression

```typescript
// Default compression configuration
{
  threshold: 1024,        // Compress responses > 1KB
  level: 6,              // Balanced compression level
  excludeContentTypes: ['image/', 'video/', 'audio/']
}
```

### Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Response Time | < 200ms avg | Real-time |
| Availability | > 99.9% | Continuous |
| Error Rate | < 0.1% | Real-time |
| Cache Hit Rate | > 70% | Hourly |
| Throughput | 10k+ req/min | Load testing |

## Testing

### Comprehensive Test Suite

```bash
# Run all edge function tests
npm run test:edge-functions

# Run specific test suite
npm run test:edge-functions:suite health
npm run test:edge-functions:suite performance
npm run test:edge-functions:suite security
```

### Test Categories

1. **Health Checks**: Validate all functions are responding
2. **Functionality**: Test OPERA agent processing
3. **Performance**: Benchmark response times and throughput
4. **Rate Limiting**: Verify rate limiting behavior
5. **Caching**: Test caching effectiveness
6. **Error Handling**: Validate error responses
7. **Security**: Check CORS headers and security
8. **Monitoring**: Test metrics and health endpoints

### Example Test Results

```
🧪 VERSATIL Edge Function Integration Tests

📋 Running Health Checks Tests...
    ✅ Health check: opera-agent
    ✅ Health check: maria-rag
    ✅ Health check: james-rag
    ✅ Health check: marcus-rag

📋 Running OPERA Agent Functionality Tests...
    ✅ OPERA Agent: enhanced-maria
    ✅ OPERA Agent: enhanced-james
    ✅ OPERA Agent: enhanced-marcus

📋 Running Performance Benchmarks Tests...
    ✅ Performance acceptable (avg: 187ms)

📋 Edge Function Test Report
==================================================
⏱️  Duration: 23s
📊 Total Tests: 24
✅ Passed: 24
❌ Failed: 0
📈 Success Rate: 100.0%

💡 Recommendations:
  ✅ All tests passed! Edge functions are production ready.

🎉 Edge function testing completed!
```

## Monitoring & Troubleshooting

### Health Monitoring

```bash
# Continuous health monitoring
npm run edge:monitor --duration 30  # Monitor for 30 minutes

# Output:
📊 Live Monitoring (45s elapsed)

opera-agent: 100.0% healthy, avg 156ms response
maria-rag: 100.0% healthy, avg 203ms response
james-rag: 100.0% healthy, avg 178ms response
marcus-rag: 100.0% healthy, avg 189ms response
```

### Performance Metrics

```javascript
// Example metrics response
{
  "requestCount": 15847,
  "totalProcessingTime": 3654231,
  "cacheHits": 11589,
  "cacheMisses": 4258,
  "rateLimitHits": 23,
  "errorCount": 7,
  "compressionSaved": 2845670,
  "uptime": 86400000,
  "avgProcessingTime": 230.5,
  "errorRate": 0.0004,
  "cacheHitRate": 0.731
}
```

### Common Issues

#### 1. Function Not Responding
```bash
# Check function deployment status
supabase functions list

# Check logs
supabase functions logs opera-agent

# Redeploy if needed
npm run edge:deploy
```

#### 2. High Response Times
```bash
# Check metrics for bottlenecks
curl https://[project-ref].supabase.co/functions/v1/opera-agent/metrics

# Monitor cache hit rate
npm run edge:monitor --duration 10
```

#### 3. Rate Limit Issues
```bash
# Check rate limit configuration
# Adjust rate limits in production-optimizations.ts
# Redeploy with updated limits
```

#### 4. Memory Issues
```bash
# Monitor cache size and memory usage
# Adjust cache maxSize in configuration
# Consider cache cleanup strategies
```

## Security

### Authentication

All edge functions use Supabase authentication:
- `SUPABASE_ANON_KEY` for read operations
- `SUPABASE_SERVICE_ROLE_KEY` for write operations

### CORS Configuration

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
}
```

### Rate Limiting

- IP-based rate limiting prevents abuse
- Sliding window algorithm for fair usage
- Configurable limits per function

### Data Security

- No sensitive data stored in edge functions
- Temporary caching with automatic cleanup
- Request/response logging excludes sensitive fields

## Scaling & Performance

### Horizontal Scaling

Supabase Edge Functions automatically scale based on demand:
- Auto-scaling to handle traffic spikes
- Global edge deployment for low latency
- Load balancing across multiple regions

### Performance Optimization

1. **Caching Strategy**
   - Intelligent caching of expensive operations
   - TTL-based cache invalidation
   - LRU eviction for memory management

2. **Compression**
   - Automatic response compression
   - Reduced bandwidth usage
   - Faster response delivery

3. **Rate Limiting**
   - Prevents resource exhaustion
   - Fair usage enforcement
   - Configurable per endpoint

### Cost Optimization

- Efficient resource usage through caching
- Compression reduces bandwidth costs
- Rate limiting prevents abuse and overusage

## Migration & Updates

### Updating Functions

```bash
# Update individual function
supabase functions deploy opera-agent

# Update with verification
npm run edge:deploy:verify

# Test updated functions
npm run test:edge-functions
```

### Version Management

- Functions are versioned with the framework
- Rollback capabilities through Supabase dashboard
- Deployment validation prevents broken deployments

### Breaking Changes

When updating functions with breaking changes:
1. Deploy to staging environment first
2. Run comprehensive tests
3. Update client code if needed
4. Deploy to production with verification
5. Monitor for issues post-deployment

---

## Support & Maintenance

### Daily Operations

1. **Health Monitoring**: Automated health checks
2. **Performance Monitoring**: Real-time metrics collection
3. **Error Tracking**: Automated error detection and alerting
4. **Usage Analytics**: Regular usage pattern analysis

### Maintenance Tasks

- **Weekly**: Review performance metrics and optimize
- **Monthly**: Analyze usage patterns and adjust limits
- **Quarterly**: Security review and updates
- **Annually**: Architecture review and modernization

### Getting Help

1. 📖 Check this documentation
2. 🔍 Review function logs: `supabase functions logs <function-name>`
3. 🧪 Run diagnostic tests: `npm run test:edge-functions`
4. 📊 Check metrics: `npm run edge:health`
5. 🤝 Contact VERSATIL support team

**Production Ready! 🚀**

Your VERSATIL Edge Functions are now deployed and ready for enterprise-scale AI-native development with Enhanced OPERA agents.