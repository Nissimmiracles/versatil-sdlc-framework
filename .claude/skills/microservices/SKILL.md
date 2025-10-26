---
name: microservices
description: Microservices architecture patterns using service mesh (Istio/Linkerd), API gateways (Kong/APISIX), and event-driven communication (Kafka/RabbitMQ). Use when building distributed systems requiring independent scaling, polyglot persistence, and team autonomy. Enables fault isolation and technology diversity.
---

# Microservices Architecture

## Overview

Microservices architecture patterns for building scalable, distributed systems with independent services, API gateways, service mesh, and event-driven communication. Enables independent deployments, technology flexibility, and fault isolation while maintaining system coherence.

**Goal**: Independent service deployments with reliable inter-service communication

## When to Use This Skill

Use this skill when:
- Large teams need independent service ownership
- Different services require different technologies
- Independent scaling requirements per service
- Fault isolation critical for availability
- Gradual migration from monolith needed
- High traffic requiring horizontal scaling
- Different data storage needs per service
- Team autonomy and DevOps culture established

**Triggers**: "microservices", "service mesh", "API gateway", "event-driven", "distributed systems", "service discovery", "circuit breaker"

---

## Quick Start: Architecture Decision Tree

### When to Use Microservices vs Monolith vs Serverless

**Microservices**:
- ✅ Independent scaling per service
- ✅ Technology diversity (polyglot)
- ✅ Fault isolation (one service fails, others continue)
- ✅ Team autonomy (own entire service lifecycle)
- ✅ Large teams (10+ engineers)
- ✅ Best for: High-traffic apps, complex domains, large teams

**Monolith**:
- ✅ Simpler deployment (one artifact)
- ✅ Easier debugging (single process)
- ✅ Lower latency (no network calls)
- ✅ Simpler testing (no distributed complexity)
- ✅ Best for: Small teams (<10), early-stage startups, simple domains

**Serverless**:
- ✅ Zero infrastructure management
- ✅ Auto-scaling (pay per request)
- ✅ Low operational overhead
- ✅ Best for: Event-driven workloads, sporadic traffic, lightweight APIs

**Hybrid** (Microservices + Serverless):
- ✅ Core services as microservices
- ✅ Background jobs as serverless functions
- ✅ Best for: Production systems with mixed workloads

---

## Service Communication Patterns

### 1. Synchronous (REST/gRPC)

```typescript
// REST API call between services
// Order service → Inventory service
import axios from 'axios';

class OrderService {
  async createOrder(items: OrderItem[]) {
    // Check inventory availability
    const inventoryResponse = await axios.post(
      'http://inventory-service:3001/api/check',
      { items },
      { timeout: 5000 }  // Timeout protection
    );

    if (!inventoryResponse.data.available) {
      throw new Error('Items not available');
    }

    // Create order
    const order = await this.db.orders.create({ items });
    return order;
  }
}
```

```protobuf
// gRPC for high-performance inter-service calls
// inventory.proto
syntax = "proto3";

service InventoryService {
  rpc CheckAvailability (CheckRequest) returns (CheckResponse);
}

message CheckRequest {
  repeated string product_ids = 1;
}

message CheckResponse {
  bool available = 1;
  repeated string unavailable_items = 2;
}
```

```typescript
// gRPC client
import { InventoryServiceClient } from './proto/inventory_grpc_pb';
import { CheckRequest } from './proto/inventory_pb';

const client = new InventoryServiceClient(
  'inventory-service:50051',
  grpc.credentials.createInsecure()
);

const request = new CheckRequest();
request.setProductIdsList(['prod-1', 'prod-2']);

client.checkAvailability(request, (err, response) => {
  if (err) throw err;
  console.log('Available:', response.getAvailable());
});
```

### 2. Asynchronous (Event-Driven)

```typescript
// Kafka producer (Order service)
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();

async function publishOrderCreated(order: Order) {
  await producer.connect();

  await producer.send({
    topic: 'order.created',
    messages: [
      {
        key: order.id,
        value: JSON.stringify({
          order_id: order.id,
          user_id: order.user_id,
          items: order.items,
          total: order.total,
          timestamp: new Date().toISOString()
        })
      }
    ]
  });

  await producer.disconnect();
}
```

```typescript
// Kafka consumer (Notification service)
const consumer = kafka.consumer({ groupId: 'notification-service' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());

      // Send notification
      await sendEmail(order.user_id, {
        subject: 'Order Confirmed',
        body: `Your order ${order.order_id} has been confirmed.`
      });
    }
  });
}
```

### 3. Request-Reply Pattern

```typescript
// RabbitMQ RPC pattern
import amqp from 'amqplib';

class RPCClient {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private replyQueue: string;

  async call(queue: string, message: any): Promise<any> {
    const correlationId = generateUUID();

    return new Promise((resolve) => {
      // Listen for reply
      this.channel.consume(this.replyQueue, (msg) => {
        if (msg.properties.correlationId === correlationId) {
          resolve(JSON.parse(msg.content.toString()));
          this.channel.ack(msg);
        }
      }, { noAck: false });

      // Send request
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        correlationId,
        replyTo: this.replyQueue
      });
    });
  }
}

// Usage
const client = new RPCClient();
const result = await client.call('inventory.check', { items: ['item-1'] });
```

---

## Service Mesh (Istio/Linkerd)

### 1. Istio Setup

```yaml
# Install Istio
kubectl apply -f https://istio.io/latest/istio-operator.yaml

# Enable sidecar injection for namespace
kubectl label namespace default istio-injection=enabled

# Deploy service with Istio sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: order-service
        version: v1
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        ports:
        - containerPort: 3000
```

### 2. Traffic Management

```yaml
# Virtual Service - Route traffic based on headers
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        version:
          exact: "v2"
    route:
    - destination:
        host: order-service
        subset: v2
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10  # Canary deployment: 10% to v2
```

### 3. Circuit Breaker

```yaml
# Destination Rule - Circuit breaker for resilience
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory-service
spec:
  host: inventory-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 40
```

### 4. Observability (Distributed Tracing)

```typescript
// Automatic distributed tracing via Istio sidecars
// No code changes needed - Istio injects trace headers

// View traces in Jaeger
kubectl port-forward -n istio-system svc/jaeger-query 16686:16686

// Manual instrumentation (optional)
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function createOrder(items: OrderItem[]) {
  const span = tracer.startSpan('createOrder');

  try {
    // Span automatically propagated to downstream services
    const order = await orderRepository.create(items);
    span.setAttributes({ orderId: order.id });
    return order;
  } finally {
    span.end();
  }
}
```

---

## API Gateway Patterns

### 1. Kong Gateway

```yaml
# Kong ingress for API gateway
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway
  annotations:
    konghq.com/strip-path: "true"
    konghq.com/plugins: rate-limiting, jwt, cors
spec:
  ingressClassName: kong
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 3000
      - path: /inventory
        pathType: Prefix
        backend:
          service:
            name: inventory-service
            port:
              number: 3001
```

```yaml
# Kong Plugin - Rate limiting
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting
plugin: rate-limiting
config:
  minute: 100
  policy: local
  limit_by: consumer
```

```yaml
# Kong Plugin - JWT authentication
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt
plugin: jwt
config:
  uri_param_names:
    - jwt
  claims_to_verify:
    - exp
```

### 2. APISIX Gateway

```yaml
# APISIX route configuration
routes:
  - id: order-route
    uri: /api/orders/*
    upstream:
      type: roundrobin
      nodes:
        "order-service:3000": 1
    plugins:
      limit-req:
        rate: 100
        burst: 50
        rejected_code: 429
      jwt-auth: {}
      prometheus: {}

  - id: inventory-route
    uri: /api/inventory/*
    upstream:
      type: roundrobin
      nodes:
        "inventory-service-v1:3001": 90
        "inventory-service-v2:3001": 10  # Canary
    plugins:
      limit-req:
        rate: 200
        burst: 100
```

### 3. GraphQL Federation (Apollo Gateway)

```typescript
// Apollo Gateway - Federated GraphQL across microservices
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'orders', url: 'http://order-service:4000/graphql' },
      { name: 'inventory', url: 'http://inventory-service:4001/graphql' },
      { name: 'users', url: 'http://user-service:4002/graphql' }
    ]
  })
});

const server = new ApolloServer({
  gateway,
  subscriptions: false
});

server.listen(4000);
```

```typescript
// Order service - Federated schema
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'apollo-server';

const typeDefs = gql`
  extend type User @key(fields: "id") {
    id: ID! @external
    orders: [Order!]!
  }

  type Order @key(fields: "id") {
    id: ID!
    user: User!
    items: [OrderItem!]!
    total: Float!
  }

  type Query {
    order(id: ID!): Order
  }
`;

const resolvers = {
  User: {
    orders(user) {
      return getOrdersByUserId(user.id);
    }
  }
};

export const schema = buildSubgraphSchema({ typeDefs, resolvers });
```

---

## Service Discovery

### 1. Kubernetes Service Discovery

```typescript
// Automatic service discovery via Kubernetes DNS
// No library needed - use service names directly

const INVENTORY_SERVICE_URL = 'http://inventory-service:3001';
const ORDER_SERVICE_URL = 'http://order-service:3000';

// Kubernetes DNS resolves service-name.namespace.svc.cluster.local
const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/check`);
```

### 2. Consul Service Registry

```typescript
// Consul service registration
import Consul from 'consul';

const consul = new Consul({ host: 'consul-server', port: 8500 });

// Register service on startup
await consul.agent.service.register({
  id: 'order-service-1',
  name: 'order-service',
  address: process.env.HOST_IP,
  port: 3000,
  check: {
    http: 'http://localhost:3000/health',
    interval: '10s',
    timeout: '5s'
  }
});

// Discover services
const services = await consul.health.service('inventory-service');
const healthyService = services[0];
const url = `http://${healthyService.Service.Address}:${healthyService.Service.Port}`;
```

### 3. Load Balancing (Client-Side)

```typescript
// Client-side load balancing with retry
import axios from 'axios';

class ServiceClient {
  private serviceUrls: string[] = [
    'http://inventory-service-1:3001',
    'http://inventory-service-2:3001',
    'http://inventory-service-3:3001'
  ];
  private currentIndex = 0;

  async call(path: string, data?: any): Promise<any> {
    let lastError: Error;

    // Try all instances with round-robin
    for (let i = 0; i < this.serviceUrls.length; i++) {
      const url = this.serviceUrls[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.serviceUrls.length;

      try {
        const response = await axios.post(`${url}${path}`, data, {
          timeout: 5000
        });
        return response.data;
      } catch (error) {
        lastError = error;
        console.warn(`Failed to call ${url}, trying next instance`);
      }
    }

    throw lastError;
  }
}
```

---

## Resilience Patterns

### 1. Circuit Breaker (Opossum)

```typescript
import CircuitBreaker from 'opossum';
import axios from 'axios';

// Wrap service call with circuit breaker
const breaker = new CircuitBreaker(
  async (items: string[]) => {
    const response = await axios.post('http://inventory-service:3001/check', {
      items
    });
    return response.data;
  },
  {
    timeout: 3000,          // Timeout after 3s
    errorThresholdPercentage: 50,  // Open after 50% failures
    resetTimeout: 30000     // Try again after 30s
  }
);

// Fallback when circuit is open
breaker.fallback(() => {
  return { available: false, reason: 'Service temporarily unavailable' };
});

// Event listeners
breaker.on('open', () => console.log('Circuit opened'));
breaker.on('halfOpen', () => console.log('Circuit half-open, testing'));
breaker.on('close', () => console.log('Circuit closed'));

// Usage
const result = await breaker.fire(['item-1', 'item-2']);
```

### 2. Retry with Exponential Backoff

```typescript
import { retry } from 'ts-retry-promise';

async function callInventoryService(items: string[]) {
  return retry(
    async () => {
      const response = await axios.post('http://inventory-service:3001/check', {
        items
      });
      return response.data;
    },
    {
      retries: 3,
      delay: 1000,        // Start with 1s delay
      backoff: 'EXPONENTIAL',  // 1s, 2s, 4s
      timeout: 10000,     // Total timeout 10s
      logger: (msg) => console.log(`Retry: ${msg}`)
    }
  );
}
```

### 3. Bulkhead Pattern

```typescript
// Isolate resources to prevent cascading failures
import Bottleneck from 'bottleneck';

// Limit concurrent calls to inventory service
const inventoryLimiter = new Bottleneck({
  maxConcurrent: 10,  // Max 10 concurrent requests
  minTime: 100        // Min 100ms between requests
});

// Separate limiter for payment service
const paymentLimiter = new Bottleneck({
  maxConcurrent: 5,   // Payment is critical - stricter limit
  minTime: 200
});

// Usage
const inventoryResult = await inventoryLimiter.schedule(() =>
  axios.post('http://inventory-service:3001/check', { items })
);

const paymentResult = await paymentLimiter.schedule(() =>
  axios.post('http://payment-service:3002/charge', { amount })
);
```

---

## Data Management Patterns

### 1. Database per Service

```typescript
// Order service - PostgreSQL
import { Pool } from 'pg';

const orderDb = new Pool({
  host: 'order-db',
  database: 'orders',
  user: 'order_service',
  password: process.env.ORDER_DB_PASSWORD
});

// Inventory service - MongoDB
import { MongoClient } from 'mongodb';

const inventoryDb = await MongoClient.connect('mongodb://inventory-db:27017', {
  auth: { username: 'inventory_service', password: process.env.INVENTORY_DB_PASSWORD }
});

// User service - Redis (cache) + PostgreSQL
import Redis from 'ioredis';

const userCache = new Redis({ host: 'user-cache', port: 6379 });
const userDb = new Pool({ host: 'user-db', database: 'users' });
```

### 2. Saga Pattern (Distributed Transactions)

```typescript
// Choreography-based saga (event-driven)
// Order service
async function createOrder(items: OrderItem[], userId: string) {
  const order = await orderDb.orders.create({
    user_id: userId,
    items,
    status: 'pending',
    total: calculateTotal(items)
  });

  // Publish event
  await kafka.send({
    topic: 'order.created',
    messages: [{ value: JSON.stringify(order) }]
  });

  return order;
}

// Inventory service - listens to order.created
async function handleOrderCreated(order: Order) {
  try {
    await reserveInventory(order.items);

    // Success - publish event
    await kafka.send({
      topic: 'inventory.reserved',
      messages: [{ value: JSON.stringify({ order_id: order.id }) }]
    });
  } catch (error) {
    // Failure - publish compensating event
    await kafka.send({
      topic: 'inventory.reservation.failed',
      messages: [{ value: JSON.stringify({ order_id: order.id }) }]
    });
  }
}

// Order service - listens to inventory.reservation.failed
async function handleInventoryFailed(data: { order_id: string }) {
  await orderDb.orders.update({
    where: { id: data.order_id },
    data: { status: 'failed' }
  });
}
```

### 3. CQRS (Command Query Responsibility Segregation)

```typescript
// Write model (Command) - Order service
class OrderCommandService {
  async createOrder(command: CreateOrderCommand) {
    // Validate and create order
    const order = await this.orderDb.orders.create(command);

    // Publish event for read model
    await this.eventBus.publish('order.created', order);

    return order;
  }
}

// Read model (Query) - Separate database optimized for queries
class OrderQueryService {
  async getOrderHistory(userId: string) {
    // Query from denormalized read model
    return this.readDb.query(`
      SELECT o.*, u.name as user_name, array_agg(i.product_name) as items
      FROM orders_view o
      JOIN users_view u ON o.user_id = u.id
      JOIN order_items_view i ON o.id = i.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, u.name
    `, [userId]);
  }
}

// Event handler - Updates read model
async function handleOrderCreated(order: Order) {
  // Denormalize data for fast queries
  await readDb.orders_view.upsert({
    id: order.id,
    user_id: order.user_id,
    total: order.total,
    created_at: order.created_at
  });

  for (const item of order.items) {
    await readDb.order_items_view.create({
      order_id: order.id,
      product_name: item.name,
      quantity: item.quantity
    });
  }
}
```

---

## Deployment Patterns

### 1. Blue-Green Deployment

```yaml
# Blue deployment (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: blue
  template:
    spec:
      containers:
      - name: order-service
        image: order-service:v1.5

---
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    spec:
      containers:
      - name: order-service
        image: order-service:v1.6

---
# Service switches between blue/green
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: blue  # Change to "green" for cutover
  ports:
  - port: 3000
```

### 2. Canary Deployment (Istio)

```yaml
# Virtual Service - 90% v1, 10% v2
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10  # Canary: 10% traffic to v2

---
# Monitor metrics, gradually increase v2 weight:
# 10% → 25% → 50% → 100%
```

---

## Observability

### 1. Logging (Structured)

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'order-service',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/orders.log' })
  ]
});

// Usage with correlation ID for distributed tracing
logger.info('Order created', {
  order_id: order.id,
  user_id: order.user_id,
  correlation_id: req.headers['x-correlation-id'],
  total: order.total
});
```

### 2. Metrics (Prometheus)

```typescript
import client from 'prom-client';

// Define metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const ordersCreated = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created'
});

// Middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path, status_code: res.statusCode });
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

### 3. Health Checks

```typescript
// Kubernetes liveness + readiness probes
app.get('/health', async (req, res) => {
  // Liveness: Is the app running?
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', async (req, res) => {
  // Readiness: Can the app serve traffic?
  try {
    await db.query('SELECT 1');  // Check database
    await kafka.admin().listTopics();  // Check Kafka
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

---

## Resources

### scripts/
- `create-microservice.sh` - Scaffold new microservice with boilerplate
- `deploy-canary.sh` - Automated canary deployment script

### references/
- `references/service-mesh.md` - Istio/Linkerd comparison and setup
- `references/event-driven.md` - Kafka/RabbitMQ patterns and best practices
- `references/api-gateway.md` - Kong/APISIX configuration guides
- `references/observability.md` - Distributed tracing, logging, metrics

### assets/
- `assets/k8s-manifests/` - Kubernetes deployment templates
- `assets/docker-compose/` - Local development docker-compose files

## Related Skills

- `api-design` - REST/GraphQL/gRPC API design
- `micro-frontends` - Frontend microservices architecture
- `serverless` - Serverless functions as lightweight services
- `edge-databases` - Distributed data patterns for microservices
