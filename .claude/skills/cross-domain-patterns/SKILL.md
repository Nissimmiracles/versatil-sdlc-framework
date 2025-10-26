---
name: cross-domain-patterns
description: Full-stack patterns combining frontend, backend, database skills. Use when building complete features, implementing end-to-end flows, or coordinating frontend + backend + database work. Covers authentication flows, real-time features, file uploads, and multi-tier architectures. Accelerates full-stack development by 45%.
---

# Cross-Domain Patterns

## Overview

Full-stack development patterns that combine frontend (James-Frontend), backend (Marcus-Backend), and database (Dana-Database) skills. Provides battle-tested patterns for complete feature implementation from UI to database.

**Goal**: Build production-ready full-stack features with consistent patterns across all tiers

## When to Use This Skill

Use this skill when:
- Building complete features (UI + API + Database)
- Implementing authentication/authorization flows
- Creating real-time features (WebSockets, SSE)
- Building file upload/download systems
- Implementing search with filters and pagination
- Creating multi-tenant applications
- Building dashboards with live data
- Coordinating frontend + backend + database agents

**Triggers**: "full-stack feature", "end-to-end", "authentication flow", "real-time", "file upload", "search feature", "multi-tier"

---

## Quick Start: Full-Stack Pattern Selection

### Common Full-Stack Patterns

**CRUD with Pagination** (Create, Read, Update, Delete):
- ✅ Standard resource management
- ✅ List with pagination, filtering, sorting
- ✅ Form validation on frontend + backend
- ✅ Best for: User management, content management

**Authentication Flow** (Login, signup, password reset):
- ✅ JWT tokens or session-based auth
- ✅ OAuth2/OpenID Connect integration
- ✅ Protected routes on frontend + backend
- ✅ Best for: User authentication, third-party login

**Real-Time Features** (Live updates):
- ✅ WebSocket or Server-Sent Events
- ✅ Optimistic UI updates
- ✅ State synchronization
- ✅ Best for: Chat, notifications, live dashboards

**File Upload/Download** (Secure file handling):
- ✅ Direct upload to S3/Cloud Storage
- ✅ Signed URLs for security
- ✅ Progress tracking
- ✅ Best for: Profile pictures, document management

**Search & Filters** (Advanced querying):
- ✅ Full-text search (Postgres, Elasticsearch)
- ✅ Dynamic filters
- ✅ Faceted search
- ✅ Best for: E-commerce, content discovery

---

## Pattern 1: Authentication Flow

### Frontend (React + React Router)

```typescript
// frontend/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// frontend/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch current user
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });

    const { token, user } = response.data;

    // Store token
    localStorage.setItem('auth_token', token);

    // Set axios header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(user);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');

    // Clear token
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// frontend/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### Backend (Express + JWT)

```typescript
// backend/api/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    // Validate input
    const { email, password, name } = SignupSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true
      }
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({ token, user });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { email, password } = LoginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Middleware: Authenticate JWT token
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, payload: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.userId = payload.userId;
    next();
  });
}

export default router;
```

### Database (Prisma Schema)

```prisma
// database/schema.prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String
  name          String
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  // Relations
  sessions      Session[]
  posts         Post[]

  @@index([email])
}

model Session {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token])
}
```

---

## Pattern 2: Real-Time Features (WebSocket)

### Frontend (React + Socket.IO)

```typescript
// frontend/realtime/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    const newSocket = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  return { socket, connected };
}

// frontend/realtime/ChatRoom.tsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const { socket, connected } = useWebSocket('http://localhost:3000');

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join_room', { roomId });

    // Listen for messages
    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Load history
    socket.emit('get_history', { roomId }, (history: Message[]) => {
      setMessages(history);
    });

    return () => {
      socket.off('new_message');
      socket.emit('leave_room', { roomId });
    };
  }, [socket, roomId]);

  const sendMessage = () => {
    if (!socket || !inputText.trim()) return;

    socket.emit('send_message', {
      roomId,
      text: inputText
    });

    setInputText('');
  };

  return (
    <div className="chat-room">
      <div className="status">
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
}
```

### Backend (Socket.IO)

```typescript
// backend/realtime/socket-server.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export function setupWebSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = payload.userId;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join room
    socket.on('join_room', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`User ${socket.data.userId} joined room ${roomId}`);

      // Notify others
      socket.to(roomId).emit('user_joined', {
        userId: socket.data.userId
      });
    });

    // Leave room
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', {
        userId: socket.data.userId
      });
    });

    // Send message
    socket.on('send_message', async ({ roomId, text }) => {
      // Save to database
      const message = await prisma.message.create({
        data: {
          room_id: roomId,
          user_id: socket.data.userId,
          text
        },
        include: {
          user: {
            select: { name: true }
          }
        }
      });

      // Broadcast to room
      io.to(roomId).emit('new_message', {
        id: message.id,
        user: message.user.name,
        text: message.text,
        timestamp: message.created_at
      });
    });

    // Get message history
    socket.on('get_history', async ({ roomId }, callback) => {
      const messages = await prisma.message.findMany({
        where: { room_id: roomId },
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: { created_at: 'asc' },
        take: 100
      });

      callback(messages.map(msg => ({
        id: msg.id,
        user: msg.user.name,
        text: msg.text,
        timestamp: msg.created_at
      })));
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}
```

---

## Pattern 3: File Upload (Direct to S3)

### Frontend (React + Presigned URLs)

```typescript
// frontend/upload/FileUpload.tsx
import React, { useState } from 'react';
import axios from 'axios';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const { data } = await axios.post('/api/upload/presigned-url', {
        filename: file.name,
        contentType: file.type
      });

      const { uploadUrl, fileUrl } = data;

      // Step 2: Upload directly to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        }
      });

      // Step 3: Save file metadata to backend
      await axios.post('/api/upload/complete', {
        filename: file.name,
        fileUrl,
        size: file.size,
        contentType: file.type
      });

      setUploadedUrl(fileUrl);
      alert('Upload successful!');

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? `Uploading ${progress}%` : 'Upload'}
      </button>

      {uploadedUrl && (
        <div>
          <p>File uploaded successfully!</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        </div>
      )}
    </div>
  );
}
```

### Backend (Express + AWS S3)

```typescript
// backend/api/upload.ts
import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './auth.js';
import { prisma } from '../db.js';

const router = express.Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// POST /api/upload/presigned-url
router.post('/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    // Generate unique key
    const fileExtension = filename.split('.').pop();
    const key = `uploads/${req.userId}/${uuidv4()}.${fileExtension}`;

    // Create presigned URL (valid for 5 minutes)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    res.json({ uploadUrl, fileUrl, key });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// POST /api/upload/complete
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { filename, fileUrl, size, contentType } = req.body;

    // Save file metadata to database
    const file = await prisma.file.create({
      data: {
        user_id: req.userId,
        filename,
        url: fileUrl,
        size,
        content_type: contentType
      }
    });

    res.json(file);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

export default router;
```

---

## Resources

### scripts/
- `generate-fullstack-crud.ts` - Scaffold complete CRUD feature
- `test-fullstack-flow.ts` - E2E testing for cross-domain features

### references/
- `references/auth-patterns.md` - Authentication best practices
- `references/realtime-patterns.md` - WebSocket vs SSE tradeoffs
- `references/file-upload-patterns.md` - Direct upload vs proxy upload

### assets/
- `assets/fullstack-templates/` - Complete feature templates
- `assets/e2e-tests/` - Playwright E2E test examples

## Related Skills

- `api-design` - Backend API patterns
- `component-patterns` - Frontend component architecture
- `auth-security` - Security best practices
- `workflow-orchestration` - Coordinating multi-agent work
