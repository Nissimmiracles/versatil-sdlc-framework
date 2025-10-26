---
name: serverless
description: Serverless computing patterns using AWS Lambda, Vercel Edge Functions, and Cloudflare Workers. Use when building event-driven, auto-scaling applications with zero infrastructure management. Optimizes for cold start performance, memory/cost efficiency, and edge deployment. Best for APIs, background jobs, and edge computing.
---

# Serverless Computing

## Overview

Serverless computing patterns for building auto-scaling, event-driven applications without managing infrastructure. Covers AWS Lambda, Vercel Edge Functions, Cloudflare Workers, cold start optimization, and edge deployment strategies.

**Goal**: Deploy scalable applications with zero infrastructure management and pay-per-use pricing

## When to Use This Skill

Use this skill when:
- Building APIs with sporadic traffic patterns
- Running background jobs and scheduled tasks
- Processing event-driven workloads (file uploads, webhooks)
- Deploying edge functions for low-latency responses
- Prototyping quickly without infrastructure setup
- Optimizing costs (pay only for actual execution time)
- Auto-scaling from zero to millions of requests
- Integrating with cloud services (S3, DynamoDB, etc.)

**Triggers**: "serverless", "lambda", "edge functions", "cold start", "function-as-a-service", "FaaS", "auto-scaling"

---

## Quick Start: Platform Decision Tree

### When to Use Each Platform

**AWS Lambda**:
- ✅ Complex integrations (100+ AWS services)
- ✅ Long-running functions (up to 15 minutes)
- ✅ Large memory requirements (up to 10GB)
- ✅ VPC access for private resources
- ✅ Best for: Enterprise apps, data processing, batch jobs

**Vercel Edge Functions**:
- ✅ Next.js integration (middleware, API routes)
- ✅ Global edge deployment (low latency)
- ✅ Streaming responses (SSE, WebSockets)
- ✅ Zero cold starts (edge runtime)
- ✅ Best for: API routes, user-facing apps, real-time features

**Cloudflare Workers**:
- ✅ Ultra-low latency (<50ms globally)
- ✅ Zero cold starts (V8 isolates)
- ✅ Unlimited scalability
- ✅ KV storage integration
- ✅ Best for: CDN logic, edge APIs, A/B testing

**Google Cloud Functions**:
- ✅ GCP integration (BigQuery, Pub/Sub)
- ✅ Cloud Run integration (containers)
- ✅ Best for: Google Cloud ecosystem

---

## AWS Lambda Patterns

### 1. Basic Lambda Function

```typescript
// handler.ts - Simple Lambda handler
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const body = event.body ? JSON.parse(event.body) : {};

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Success',
      input: body
    })
  };
};
```

### 2. Lambda with Database Connection

```typescript
// Cold start optimization - connection reuse
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Initialize outside handler - reused across invocations
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {
  const { userId, data } = JSON.parse(event.body || '{}');

  // Write to DynamoDB
  await docClient.send(new PutCommand({
    TableName: 'Users',
    Item: {
      userId,
      data,
      createdAt: new Date().toISOString()
    }
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ success: true })
  };
};
```

### 3. S3 Event Trigger

```typescript
// Triggered when file uploaded to S3
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${bucket}/${key}`);

    // Get file from S3
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    const fileContent = await response.Body?.transformToString();

    // Process file (resize image, parse CSV, etc.)
    await processFile(fileContent);
  }
};
```

### 4. Scheduled Lambda (Cron)

```typescript
// CloudWatch Events trigger - runs on schedule
import { ScheduledEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-east-1' });

export const handler = async (event: ScheduledEvent) => {
  console.log(`Scheduled task triggered at: ${event.time}`);

  // Send daily report
  await sesClient.send(new SendEmailCommand({
    Source: 'reports@example.com',
    Destination: { ToAddresses: ['admin@example.com'] },
    Message: {
      Subject: { Data: 'Daily Report' },
      Body: {
        Text: { Data: `Report for ${new Date().toISOString()}` }
      }
    }
  }));

  return { statusCode: 200 };
};
```

### 5. Lambda Layers (Shared Dependencies)

```bash
# Create layer with shared dependencies
mkdir -p layer/nodejs
cd layer/nodejs
npm install pg redis

cd ..
zip -r layer.zip nodejs/

# Deploy layer
aws lambda publish-layer-version \
  --layer-name shared-deps \
  --zip-file fileb://layer.zip \
  --compatible-runtimes nodejs20.x
```

```typescript
// Use layer in Lambda function
// layers: [arn:aws:lambda:us-east-1:123456789:layer:shared-deps:1]

import { Pool } from 'pg';  // From layer

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export const handler = async (event) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [event.userId]);
  return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
};
```

---

## Vercel Edge Functions

### 1. Basic Edge Function

```typescript
// app/api/hello/route.ts - Next.js Edge API Route
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return new Response(JSON.stringify({ message: `Hello, ${name}!` }), {
    headers: { 'content-type': 'application/json' }
  });
}
```

### 2. Middleware (Authentication)

```typescript
// middleware.ts - Runs on all requests at the edge
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify JWT at the edge (fast!)
    try {
      const payload = verifyJWT(token);
      const response = NextResponse.next();
      response.headers.set('x-user-id', payload.userId);
      return response;
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
};
```

### 3. Edge API with Database

```typescript
// app/api/users/route.ts - Edge function with Vercel Postgres
export const runtime = 'edge';

import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  const { rows } = await sql`
    SELECT id, name, email FROM users WHERE id = ${userId}
  `;

  return Response.json(rows[0] || { error: 'Not found' });
}

export async function POST(request: Request) {
  const { name, email } = await request.json();

  const { rows } = await sql`
    INSERT INTO users (name, email) VALUES (${name}, ${email})
    RETURNING id, name, email
  `;

  return Response.json(rows[0], { status: 201 });
}
```

### 4. Streaming Response (SSE)

```typescript
// app/api/stream/route.ts - Server-Sent Events at the edge
export const runtime = 'edge';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const message = `data: ${JSON.stringify({ count: i, time: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(message));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### 5. Geolocation-Based Response

```typescript
// app/api/geo/route.ts - Edge function with geolocation
export const runtime = 'edge';

export async function GET(request: Request) {
  // Vercel Edge provides geolocation headers
  const geo = {
    city: request.headers.get('x-vercel-ip-city'),
    country: request.headers.get('x-vercel-ip-country'),
    region: request.headers.get('x-vercel-ip-country-region'),
    latitude: request.headers.get('x-vercel-ip-latitude'),
    longitude: request.headers.get('x-vercel-ip-longitude')
  };

  // Customize response based on location
  const currency = geo.country === 'US' ? 'USD' : 'EUR';
  const language = geo.country === 'US' ? 'en-US' : 'en-GB';

  return Response.json({
    geo,
    currency,
    language
  });
}
```

---

## Cloudflare Workers

### 1. Basic Worker

```typescript
// index.ts - Cloudflare Worker
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello from the edge!' }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

### 2. Worker with KV Storage

```typescript
// Worker with Cloudflare KV (key-value store)
interface Env {
  MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (request.method === 'GET' && key) {
      const value = await env.MY_KV.get(key);
      return Response.json({ key, value });
    }

    if (request.method === 'POST') {
      const { key, value } = await request.json();
      await env.MY_KV.put(key, value, { expirationTtl: 3600 }); // 1 hour TTL
      return Response.json({ success: true });
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
```

### 3. Worker with Durable Objects (Stateful)

```typescript
// Durable Object - WebSocket chat room
export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());

      this.sessions.add(server);
      server.accept();

      server.addEventListener('message', (event) => {
        // Broadcast to all connected clients
        for (const session of this.sessions) {
          session.send(event.data);
        }
      });

      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }
}

// Worker that uses Durable Object
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomName = url.pathname.slice(1);

    const id = env.CHAT_ROOM.idFromName(roomName);
    const room = env.CHAT_ROOM.get(id);

    return room.fetch(request);
  }
};
```

### 4. Worker with Caching

```typescript
// Edge caching with Cache API
export default {
  async fetch(request: Request): Promise<Response> {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    // Try to get from cache
    let response = await cache.match(cacheKey);

    if (!response) {
      // Cache miss - fetch from origin
      console.log('Cache miss, fetching from origin');
      response = await fetch(request);

      // Clone response before caching (response can only be read once)
      const clonedResponse = response.clone();

      // Cache for 1 hour
      const headers = new Headers(clonedResponse.headers);
      headers.set('Cache-Control', 'public, max-age=3600');

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers
      });

      // Don't await - cache in background
      cache.put(cacheKey, cachedResponse);
    } else {
      console.log('Cache hit');
    }

    return response;
  }
};
```

---

## Cold Start Optimization

### 1. Lambda Cold Start Mitigation

```typescript
// Minimize dependencies - use AWS SDK v3 (modular)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';  // Only what you need

// NOT: import AWS from 'aws-sdk';  // Loads entire SDK (slow!)

// Initialize connections outside handler
const dynamoDb = new DynamoDBClient({ region: 'us-east-1' });

// Lazy load heavy dependencies
let heavyLib: any;

export const handler = async (event: APIGatewayProxyEvent) => {
  // Only load if needed
  if (event.path === '/heavy') {
    if (!heavyLib) {
      heavyLib = await import('./heavy-library');
    }
    return heavyLib.process(event);
  }

  // Fast path - no heavy imports
  return { statusCode: 200, body: JSON.stringify({ message: 'Fast!' }) };
};
```

### 2. Provisioned Concurrency

```yaml
# serverless.yml - AWS Lambda with provisioned concurrency
functions:
  api:
    handler: handler.main
    provisionedConcurrency: 5  # Keep 5 instances warm
    reservedConcurrency: 100   # Max 100 concurrent executions
    events:
      - http:
          path: /api/{proxy+}
          method: ANY
```

### 3. Lambda SnapStart (Java/.NET)

```yaml
# For Java/Spring Boot Lambda
functions:
  springApi:
    handler: org.springframework.cloud.function.adapter.aws.FunctionInvoker
    runtime: java17
    snapStart: true  # Reduces cold start from 10s to 1s
    memorySize: 2048
```

### 4. Warming Strategy

```typescript
// Scheduled event to keep Lambda warm
export const warmer = async (event: any) => {
  if (event.source === 'aws.events') {
    console.log('Warmer ping - keeping function warm');
    return { statusCode: 200, body: 'Warm' };
  }

  // Actual handler logic
  return await handleRequest(event);
};
```

```yaml
# serverless.yml - Warming schedule
functions:
  api:
    handler: handler.warmer
    events:
      - http: ANY /api/{proxy+}
      - schedule:
          rate: rate(5 minutes)  # Ping every 5 minutes
          input:
            source: aws.events
```

---

## Cost Optimization

### 1. Right-Sizing Memory

```typescript
// Lambda pricing: Memory × Duration
// More memory = faster execution = potentially cheaper!

// Example: Process 1000 items
// 128 MB: 5000ms = $0.000000208 × 128 × 5 = $0.000133
// 1024 MB: 625ms = $0.000001667 × 1024 × 0.625 = $0.000107 (cheaper!)

// Run benchmarks to find optimal memory
import { PerformanceObserver, performance } from 'perf_hooks';

export const handler = async (event: any) => {
  const start = performance.now();

  // Your logic here
  await processItems(event.items);

  const duration = performance.now() - start;
  const memoryMB = parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || '128');

  console.log(JSON.stringify({
    memoryMB,
    durationMs: duration,
    cost: calculateCost(memoryMB, duration)
  }));
};

function calculateCost(memoryMB: number, durationMs: number): number {
  const gbSeconds = (memoryMB / 1024) * (durationMs / 1000);
  return gbSeconds * 0.0000166667;  // AWS pricing per GB-second
}
```

### 2. Caching Responses

```typescript
// Edge function with aggressive caching
export const runtime = 'edge';

export async function GET(request: Request) {
  const data = await fetchExpensiveData();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      // Cache for 1 hour, serve stale for 24 hours
    }
  });
}
```

### 3. Batch Processing

```typescript
// Process items in batches to reduce invocations
import { SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
  // Process all messages in one invocation (up to 10)
  const promises = event.Records.map(async (record) => {
    const data = JSON.parse(record.body);
    return processItem(data);
  });

  await Promise.all(promises);

  // Return success for all messages
  return { batchItemFailures: [] };
};
```

---

## Deployment Patterns

### 1. AWS SAM Template

```yaml
# template.yaml - AWS SAM (Serverless Application Model)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        TABLE_NAME: !Ref UsersTable

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/handler.main
      Events:
        Api:
          Type: Api
          Properties:
            Path: /api/{proxy+}
            Method: ANY
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable

  UsersTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: userId
        Type: String
```

### 2. Serverless Framework

```yaml
# serverless.yml
service: my-api

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    TABLE_NAME: ${self:service}-users-${sls:stage}

functions:
  api:
    handler: dist/handler.main
    events:
      - httpApi:
          path: /api/{proxy+}
          method: '*'
    iamRoleStatements:
      - Effect: Allow
        Action:
          - dynamodb:*
        Resource: !GetAtt UsersTable.Arn

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
```

### 3. Vercel Deployment

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "edge",
      "regions": ["iad1", "sfo1", "fra1"],
      "maxDuration": 10
    }
  },
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

---

## Monitoring & Debugging

### 1. Structured Logging

```typescript
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Structured logs for CloudWatch Logs Insights
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const logger = {
    info: (message: string, meta?: any) => console.log(JSON.stringify({
      level: 'info',
      message,
      requestId: context.requestId,
      functionName: context.functionName,
      ...meta
    })),
    error: (message: string, error?: Error) => console.error(JSON.stringify({
      level: 'error',
      message,
      requestId: context.requestId,
      error: error?.message,
      stack: error?.stack
    }))
  };

  try {
    logger.info('Processing request', { path: event.path });
    const result = await processRequest(event);
    logger.info('Request completed', { duration: context.getRemainingTimeInMillis() });
    return result;
  } catch (error) {
    logger.error('Request failed', error as Error);
    throw error;
  }
};
```

### 2. X-Ray Tracing

```typescript
// Enable AWS X-Ray for distributed tracing
import AWSXRay from 'aws-xray-sdk-core';
import AWS from 'aws-sdk';

const dynamodb = AWSXRay.captureAWSClient(new AWS.DynamoDB.DocumentClient());

export const handler = async (event: any) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('process-items');

  try {
    // Traced DynamoDB call
    const result = await dynamodb.get({
      TableName: 'Users',
      Key: { userId: event.userId }
    }).promise();

    subsegment?.close();
    return result;
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};
```

### 3. CloudWatch Metrics

```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-east-1' });

export const handler = async (event: any) => {
  const start = Date.now();

  try {
    const result = await processRequest(event);

    // Custom metric
    await cloudwatch.putMetricData({
      Namespace: 'MyApp/Lambda',
      MetricData: [{
        MetricName: 'ProcessingDuration',
        Value: Date.now() - start,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME! }
        ]
      }]
    });

    return result;
  } catch (error) {
    // Error metric
    await cloudwatch.putMetricData({
      Namespace: 'MyApp/Lambda',
      MetricData: [{
        MetricName: 'Errors',
        Value: 1,
        Unit: 'Count'
      }]
    });

    throw error;
  }
};
```

---

## Resources

### scripts/
- `deploy-lambda.sh` - Deploy Lambda with SAM/Serverless Framework
- `test-edge-function.sh` - Local testing for edge functions

### references/
- `references/lambda-best-practices.md` - AWS Lambda optimization guide
- `references/edge-runtime.md` - Vercel/Cloudflare edge runtime comparison
- `references/serverless-pricing.md` - Cost comparison and optimization

### assets/
- `assets/sam-templates/` - AWS SAM template examples
- `assets/serverless-configs/` - Serverless Framework configurations

## Related Skills

- `microservices` - Microservices vs serverless trade-offs
- `edge-databases` - Edge computing with distributed databases
- `api-design` - API design patterns for serverless functions
