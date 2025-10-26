---
name: auth-security
description: Authentication and security patterns using OAuth2/PKCE, JWT (short-lived tokens), OWASP Top 10 mitigation, and rate limiting. Use when implementing auth systems, securing APIs, or addressing security vulnerabilities. Provides defense-in-depth security with industry best practices.
---

# Authentication & Security

## Overview

Comprehensive authentication and security patterns covering OAuth2/PKCE, JWT token management, OWASP Top 10 vulnerabilities, rate limiting, and security headers. Provides defense-in-depth approach to application security.

**Goal**: Secure authentication with protection against common vulnerabilities (OWASP Top 10)

## When to Use This Skill

Use this skill when:
- Implementing authentication (OAuth2, JWT, sessions)
- Securing API endpoints
- Addressing security vulnerabilities (OWASP Top 10)
- Implementing rate limiting and DDOS protection
- Setting up security headers (CSP, HSTS, etc.)
- Conducting security audits
- Implementing RBAC (Role-Based Access Control)
- Migrating from session-based to token-based auth

**Triggers**: "authentication", "OAuth2", "JWT", "security", "OWASP", "rate limiting", "RBAC", "security headers"

---

## Quick Start: Auth Strategy Decision Tree

### When to Use OAuth2 vs JWT vs Sessions

**OAuth2/PKCE** (Authorization Framework):
- ✅ Third-party login (Google, GitHub, etc.)
- ✅ Mobile apps (PKCE flow for security)
- ✅ Single Sign-On (SSO)
- ✅ Delegated authorization
- ✅ Best for: Social login, multi-app ecosystems, mobile apps

**JWT** (Stateless Tokens):
- ✅ Stateless authentication (no server sessions)
- ✅ Microservices (token passed between services)
- ✅ API authentication
- ✅ Scalability (no session store needed)
- ✅ Best for: APIs, microservices, mobile backends

**Sessions** (Server-side Storage):
- ✅ Traditional web apps
- ✅ Easy revocation (server controls sessions)
- ✅ Smaller payload (only session ID in cookie)
- ✅ Sensitive data stays server-side
- ✅ Best for: Traditional MVC apps, high-security requirements

**Hybrid** (JWT + Refresh Token):
- ✅ Short-lived access tokens (15min JWT)
- ✅ Long-lived refresh tokens (7-30 days, database-backed)
- ✅ Balance security and UX
- ✅ Best for: Production apps, balance between stateless and revocability

---

## OAuth2/PKCE Patterns

### 1. Authorization Code Flow with PKCE

```typescript
// Step 1: Generate PKCE challenge
import crypto from 'crypto';

function generatePKCE() {
  // Code verifier: random string (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');

  // Code challenge: SHA256 hash of verifier
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

// Step 2: Redirect to authorization URL
app.get('/auth/google', (req, res) => {
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store code_verifier in session (needed for token exchange)
  req.session.codeVerifier = codeVerifier;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/auth/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// Step 3: Handle callback and exchange code for token
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const codeVerifier = req.session.codeVerifier;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3000/auth/callback'
    })
  });

  const tokens = await tokenResponse.json();
  const { access_token, id_token, refresh_token } = tokens;

  // Decode ID token to get user info
  const userInfo = JSON.parse(
    Buffer.from(id_token.split('.')[1], 'base64').toString()
  );

  req.session.user = userInfo;
  res.redirect('/dashboard');
});
```

---

## JWT Patterns

### 1. JWT Generation & Validation

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// Generate JWT tokens
function generateTokens(userId: string) {
  // Access token: short-lived (15 minutes)
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh token: long-lived (7 days), stored in DB
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Verify JWT
function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string };
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

// Middleware to protect routes
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

// Usage
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'Protected data', userId: req.user.userId });
});
```

### 2. Refresh Token Flow

```typescript
// Store refresh tokens in database
interface RefreshToken {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Login endpoint: generate both tokens
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Verify credentials
  const user = await db.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token in database
  await db.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  res.json({ accessToken, refreshToken });
});

// Refresh endpoint: exchange refresh token for new access token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  let payload;
  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Check if refresh token exists in database
  const storedToken = await db.refreshToken.findFirst({
    where: {
      userId: payload.userId,
      token: refreshToken,
      expiresAt: { gt: new Date() }
    }
  });

  if (!storedToken) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: payload.userId, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken });
});

// Logout endpoint: revoke refresh token
app.post('/auth/logout', authenticateJWT, async (req, res) => {
  const { refreshToken } = req.body;

  await db.refreshToken.deleteMany({
    where: {
      userId: req.user.userId,
      token: refreshToken
    }
  });

  res.json({ message: 'Logged out' });
});
```

---

## OWASP Top 10 Mitigation

### 1. Injection (SQL, NoSQL, Command)

```typescript
// ❌ Bad - SQL Injection vulnerable
app.get('/users', async (req, res) => {
  const { search } = req.query;
  const users = await db.query(`SELECT * FROM users WHERE name = '${search}'`);
  res.json(users);
});

// ✅ Good - Parameterized queries
app.get('/users', async (req, res) => {
  const { search } = req.query;
  const users = await db.query('SELECT * FROM users WHERE name = $1', [search]);
  res.json(users);
});

// ✅ Good - ORM (Prisma)
app.get('/users', async (req, res) => {
  const { search } = req.query;
  const users = await db.user.findMany({
    where: { name: search }
  });
  res.json(users);
});
```

### 2. Broken Authentication

```typescript
// ✅ Password hashing with bcrypt
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Computational cost (higher = slower but more secure)

// Hash password before storing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Rate limit login attempts
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

### 3. Sensitive Data Exposure

```typescript
// ✅ Security headers
import helmet from 'helmet';

app.use(helmet()); // Sets multiple security headers

// Specific headers:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:']
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

// ✅ Encrypt sensitive data at rest
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 4. XML External Entities (XXE)

```typescript
// ✅ Disable external entities in XML parsing
import { DOMParser } from 'xmldom';

const parser = new DOMParser({
  // Disable external entity resolution
  locator: {},
  errorHandler: {
    warning: () => {},
    error: () => {},
    fatalError: (error) => { throw error; }
  }
});

// Parse XML safely
function parseXML(xmlString: string) {
  // Remove DOCTYPE declarations (prevents XXE)
  const sanitized = xmlString.replace(/<!DOCTYPE[^>]*>/gi, '');
  return parser.parseFromString(sanitized, 'text/xml');
}
```

### 5. Broken Access Control

```typescript
// ✅ RBAC (Role-Based Access Control)
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

function requireRole(...allowedRoles: Role[]) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage
app.delete('/api/users/:id', authenticateJWT, requireRole(Role.ADMIN), async (req, res) => {
  // Only admins can delete users
  await db.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User deleted' });
});

// ✅ Resource ownership check
app.patch('/api/posts/:id', authenticateJWT, async (req, res) => {
  const post = await db.post.findUnique({ where: { id: req.params.id } });

  // Check ownership
  if (post.authorId !== req.user.userId && req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await db.post.update({
    where: { id: req.params.id },
    data: req.body
  });

  res.json(updated);
});
```

### 6. Security Misconfiguration

```typescript
// ✅ Environment-specific configuration
const config = {
  development: {
    cors: { origin: '*' },
    logging: 'debug',
    rateLimit: { max: 1000 }
  },
  production: {
    cors: { origin: process.env.ALLOWED_ORIGINS!.split(',') },
    logging: 'error',
    rateLimit: { max: 100 }
  }
};

const env = process.env.NODE_ENV || 'development';
app.use(cors(config[env].cors));
```

### 7. Cross-Site Scripting (XSS)

```typescript
// ✅ Input sanitization
import DOMPurify from 'isomorphic-dompurify';

app.post('/api/posts', authenticateJWT, async (req, res) => {
  const { title, content } = req.body;

  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href']
  });

  const post = await db.post.create({
    data: {
      title,
      content: sanitizedContent,
      authorId: req.user.userId
    }
  });

  res.json(post);
});

// ✅ CSP header (prevents inline scripts)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], // No 'unsafe-inline'
    objectSrc: ["'none'"]
  }
}));
```

### 8. Insecure Deserialization

```typescript
// ❌ Bad - eval() is dangerous
app.post('/api/execute', (req, res) => {
  const result = eval(req.body.code); // NEVER DO THIS
  res.json({ result });
});

// ✅ Good - Use JSON.parse with validation
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive()
});

app.post('/api/users', async (req, res) => {
  try {
    const validated = userSchema.parse(req.body);
    const user = await db.user.create({ data: validated });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Validation failed', details: error.errors });
  }
});
```

---

## Rate Limiting & DDOS Protection

### 1. Express Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis();

// Global rate limit
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', globalLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true // Only count failed attempts
});

app.post('/auth/login', authLimiter, loginHandler);

// Per-user rate limit
const userLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:user:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per user
  keyGenerator: (req) => req.user?.userId || req.ip
});

app.use('/api/', authenticateJWT, userLimiter);
```

---

## Resources

### scripts/
- `security-audit.js` - Run automated security audit (npm audit + OWASP ZAP)
- `generate-secrets.js` - Generate secure random secrets for JWT/encryption

### references/
- `references/owasp-top-10.md` - OWASP Top 10 vulnerabilities with examples
- `references/oauth2-flows.md` - OAuth2 flow diagrams and implementations
- `references/jwt-best-practices.md` - JWT security patterns and anti-patterns
- `references/security-headers.md` - Complete security headers reference

### assets/
- `assets/security-checklists/` - Pre-deployment security checklists
- `assets/zap-configs/` - OWASP ZAP scan configurations

## Related Skills

- `api-design` - API authentication patterns
- `schema-optimization` - Database security (RLS policies)
- `testing-strategies` - Security testing with Playwright
- `rls-policies` - Row-level security in PostgreSQL
