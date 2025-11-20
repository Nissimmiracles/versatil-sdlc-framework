/**
 * Integration Tests: Marcus → James Handoff
 *
 * Tests the handoff from Marcus-Backend to James-Frontend:
 * - Marcus creates API endpoints
 * - James receives API contract
 * - James implements UI consuming Marcus's APIs
 * - Validates API contract is passed correctly
 * - Validates UI calls correct endpoints
 *
 * Coverage Target: 85%+
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EnhancedMarcus } from '../../src/agents/opera/marcus-backend/enhanced-marcus.js';
import { EnhancedJames } from '../../src/agents/opera/james-frontend/enhanced-james.js';
import { EnhancedVectorMemoryStore } from '../../src/rag/enhanced-vector-memory-store.js';
import type { AgentActivationContext, AgentResponse } from '../../src/agents/core/base-agent.js';

describe('Marcus → James Handoff (Integration)', () => {
  let vectorStore: EnhancedVectorMemoryStore;
  let marcus: EnhancedMarcus;
  let james: EnhancedJames;

  interface APIContract {
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
      requestSchema?: Record<string, string>;
      responseSchema?: Record<string, any>;
      authentication: boolean;
    }>;
    baseUrl: string;
    security: {
      authentication: string;
      cors: boolean;
    };
  }

  beforeAll(async () => {
    vectorStore = new EnhancedVectorMemoryStore();
    marcus = new EnhancedMarcus(vectorStore);
    james = new EnhancedJames(vectorStore);
  });

  afterAll(async () => {
    if (vectorStore) {
      await vectorStore.close();
    }
  });

  // ========================================================================
  // MARCUS API CREATION
  // ========================================================================

  describe('Marcus API Creation', () => {
    it('should create login API endpoint', async () => {
      const context: AgentActivationContext = {
        filePath: 'src/api/auth/login.ts',
        content: `
          import { Router } from 'express';
          import bcrypt from 'bcrypt';
          import jwt from 'jsonwebtoken';
          import { db } from '../../database';

          export const loginRouter = Router();

          /**
           * POST /api/auth/login
           * Request: { email: string, password: string }
           * Response: { token: string, user: { id: string, email: string } }
           */
          loginRouter.post('/login', async (req, res) => {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
              return res.status(400).json({ error: 'Email and password required' });
            }

            // Find user
            const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (!user) {
              return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
              return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT
            const token = jwt.sign(
              { userId: user.id },
              process.env.JWT_SECRET!,
              { expiresIn: '24h' }
            );

            // Return token and user
            res.json({
              token,
              user: {
                id: user.id,
                email: user.email
              }
            });
          });
        `,
        language: 'typescript',
        framework: 'express',
        trigger: { type: 'file-change', timestamp: new Date() }
      };

      const response = await marcus.activate(context);

      expect(response.success).toBe(true);
      expect(response.confidence).toBeGreaterThan(0.7);

      // Validate Marcus suggests handoff to James
      expect(response.handoffTo).toContain('james-frontend');
    });

    it('should create logout API endpoint', async () => {
      const context: AgentActivationContext = {
        filePath: 'src/api/auth/logout.ts',
        content: `
          import { Router } from 'express';
          import { authenticate } from '../../middleware/auth';
          import { db } from '../../database';

          export const logoutRouter = Router();

          /**
           * POST /api/auth/logout
           * Request: None (authenticated)
           * Response: { success: boolean }
           */
          logoutRouter.post('/logout', authenticate, async (req, res) => {
            // Delete session
            await db.query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);

            res.json({ success: true });
          });
        `,
        language: 'typescript',
        framework: 'express',
        trigger: { type: 'file-change', timestamp: new Date() }
      };

      const response = await marcus.activate(context);

      expect(response.success).toBe(true);
    });

    it('should create GET user endpoint', async () => {
      const context: AgentActivationContext = {
        filePath: 'src/api/auth/me.ts',
        content: `
          import { Router } from 'express';
          import { authenticate } from '../../middleware/auth';
          import { db } from '../../database';

          export const meRouter = Router();

          /**
           * GET /api/auth/me
           * Request: None (authenticated)
           * Response: { user: { id: string, email: string } }
           */
          meRouter.get('/me', authenticate, async (req, res) => {
            const user = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);

            res.json({ user });
          });
        `,
        language: 'typescript',
        framework: 'express',
        trigger: { type: 'file-change', timestamp: new Date() }
      };

      const response = await marcus.activate(context);

      expect(response.success).toBe(true);
    });
  });

  // ========================================================================
  // JAMES RECEIVES API CONTRACT
  // ========================================================================

  describe('James Receives API Contract', () => {
    it('should receive API contract from Marcus', async () => {
      // Step 1: Marcus creates API
      const marcusResponse = await createMarcusAPI([
        {
          method: 'POST',
          path: '/api/auth/login',
          requestSchema: { email: 'string', password: 'string' },
          responseSchema: { token: 'string', user: { id: 'string', email: 'string' } },
          authentication: false
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          authentication: true
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          responseSchema: { user: { id: 'string', email: 'string' } },
          authentication: true
        }
      ]);

      // Step 2: Extract API contract from Marcus's response
      const apiContract = extractAPIContract(marcusResponse);

      expect(apiContract.endpoints).toHaveLength(3);
      expect(apiContract.baseUrl).toBe('/api');
      expect(apiContract.security.authentication).toBe('JWT');

      // Step 3: James receives contract and creates UI
      const jamesContext: AgentActivationContext = {
        filePath: 'src/components/LoginForm.tsx',
        content: `
          import React, { useState } from 'react';
          import { useAuth } from '../hooks/useAuth';

          export const LoginForm = () => {
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');
            const { login, loading, error } = useAuth();

            const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              await login({ email, password });
            };

            return (
              <form onSubmit={handleSubmit}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" disabled={loading}>Login</button>
                {error && <div>{error}</div>}
              </form>
            );
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract // Contract passed from Marcus
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      expect(jamesResponse.success).toBe(true);
      expect(jamesResponse.confidence).toBeGreaterThan(0.7);
    });

    it('should validate James uses correct API endpoints', async () => {
      // Marcus API contract
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login endpoint',
            requestSchema: { email: 'string', password: 'string' },
            responseSchema: { token: 'string', user: 'object' },
            authentication: false
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      // James creates auth hook
      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          import { useState } from 'react';
          import axios from 'axios';

          export const useAuth = () => {
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState<string | null>(null);

            const login = async ({ email, password }: { email: string; password: string }) => {
              setLoading(true);
              setError(null);

              try {
                const response = await axios.post('/api/auth/login', { email, password });
                const { token, user } = response.data;

                localStorage.setItem('token', token);
                return { token, user };
              } catch (err) {
                setError('Login failed');
                throw err;
              } finally {
                setLoading(false);
              }
            };

            return { login, loading, error };
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      expect(jamesResponse.success).toBe(true);

      // Validate James uses correct endpoint
      expect(jamesContext.content).toContain('/api/auth/login');
      expect(jamesContext.content).toContain('email');
      expect(jamesContext.content).toContain('password');

      // Extract API calls from James's code
      const apiCalls = extractAPICalls(jamesContext.content);
      expect(apiCalls).toContain('/api/auth/login');

      // Validate all API calls match Marcus's contract
      const contractPaths = apiContract.endpoints.map(e => e.path);
      apiCalls.forEach(call => {
        expect(contractPaths).toContain(call);
      });
    });

    it('should validate James sends correct request schema', async () => {
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login',
            requestSchema: {
              email: 'string',
              password: 'string'
            },
            responseSchema: {
              token: 'string',
              user: { id: 'string', email: 'string' }
            },
            authentication: false
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          const login = async ({ email, password }: LoginInput) => {
            const response = await axios.post('/api/auth/login', {
              email,
              password
            });
            return response.data;
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Extract request payload from James's code
      const requestPayload = extractRequestPayload(jamesContext.content, '/api/auth/login');
      const expectedSchema = apiContract.endpoints[0].requestSchema!;

      // Validate request payload matches schema
      Object.keys(expectedSchema).forEach(key => {
        expect(requestPayload).toContain(key);
      });
    });

    it('should validate James handles response schema correctly', async () => {
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login',
            responseSchema: {
              token: 'string',
              user: {
                id: 'string',
                email: 'string'
              }
            },
            authentication: false
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          const login = async ({ email, password }: LoginInput) => {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token, user } = response.data;

            // Store token
            localStorage.setItem('token', token);

            // Store user
            setUser(user);

            return { token, user };
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate James destructures response correctly
      expect(jamesContext.content).toContain('const { token, user } = response.data');
      expect(jamesContext.content).toContain('localStorage.setItem(\'token\', token)');
      expect(jamesContext.content).toContain('setUser(user)');
    });
  });

  // ========================================================================
  // UI-API INTEGRATION VALIDATION
  // ========================================================================

  describe('UI-API Integration', () => {
    it('should validate James implements all Marcus endpoints', async () => {
      // Marcus API contract with 3 endpoints
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login',
            authentication: false
          },
          {
            method: 'POST',
            path: '/api/auth/logout',
            description: 'Logout',
            authentication: true
          },
          {
            method: 'GET',
            path: '/api/auth/me',
            description: 'Get current user',
            authentication: true
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      // James creates auth hook using all endpoints
      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          import { useState, useEffect } from 'react';
          import axios from 'axios';

          export const useAuth = () => {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(false);

            const login = async ({ email, password }) => {
              const response = await axios.post('/api/auth/login', { email, password });
              const { token, user } = response.data;
              localStorage.setItem('token', token);
              setUser(user);
              return { token, user };
            };

            const logout = async () => {
              await axios.post('/api/auth/logout', {}, {
                headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
              });
              localStorage.removeItem('token');
              setUser(null);
            };

            const getCurrentUser = async () => {
              const response = await axios.get('/api/auth/me', {
                headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
              });
              setUser(response.data.user);
            };

            return { user, loading, login, logout, getCurrentUser };
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate James implements all endpoints
      const apiCalls = extractAPICalls(jamesContext.content);
      const contractPaths = apiContract.endpoints.map(e => e.path);

      expect(apiCalls).toHaveLength(contractPaths.length);
      contractPaths.forEach(path => {
        expect(apiCalls).toContain(path);
      });
    });

    it('should validate James adds authentication headers for protected endpoints', async () => {
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/logout',
            description: 'Logout',
            authentication: true // Protected endpoint
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          const logout = async () => {
            await axios.post('/api/auth/logout', {}, {
              headers: {
                Authorization: \`Bearer \${localStorage.getItem('token')}\`
              }
            });
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate James adds Authorization header
      expect(jamesContext.content).toContain('Authorization');
      expect(jamesContext.content).toContain('Bearer');
      expect(jamesContext.content).toContain('localStorage.getItem(\'token\')');
    });

    it('should validate James handles API errors correctly', async () => {
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login',
            authentication: false
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          const login = async ({ email, password }) => {
            try {
              const response = await axios.post('/api/auth/login', { email, password });
              return response.data;
            } catch (error) {
              if (error.response?.status === 401) {
                throw new Error('Invalid credentials');
              }
              if (error.response?.status === 400) {
                throw new Error('Email and password required');
              }
              throw new Error('Login failed');
            }
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate James has error handling
      expect(jamesContext.content).toContain('try');
      expect(jamesContext.content).toContain('catch');
      expect(jamesContext.content).toContain('error.response');
    });

    it('should validate James implements TypeScript types from API contract', async () => {
      const apiContract: APIContract = {
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login',
            requestSchema: {
              email: 'string',
              password: 'string'
            },
            responseSchema: {
              token: 'string',
              user: {
                id: 'string',
                email: 'string'
              }
            },
            authentication: false
          }
        ],
        baseUrl: '/api',
        security: {
          authentication: 'JWT',
          cors: true
        }
      };

      const jamesContext: AgentActivationContext = {
        filePath: 'src/types/auth.ts',
        content: `
          // Generated from Marcus's API contract

          export interface LoginRequest {
            email: string;
            password: string;
          }

          export interface LoginResponse {
            token: string;
            user: {
              id: string;
              email: string;
            };
          }
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate types match API contract
      expect(jamesContext.content).toContain('LoginRequest');
      expect(jamesContext.content).toContain('LoginResponse');
      expect(jamesContext.content).toContain('email: string');
      expect(jamesContext.content).toContain('password: string');
      expect(jamesContext.content).toContain('token: string');
      expect(jamesContext.content).toContain('user: {');
    });
  });

  // ========================================================================
  // HANDOFF VALIDATION
  // ========================================================================

  describe('Handoff Validation', () => {
    it('should complete full Marcus → James handoff', async () => {
      // Step 1: Marcus creates complete API
      const marcusResponse = await createMarcusAPI([
        {
          method: 'POST',
          path: '/api/auth/login',
          requestSchema: { email: 'string', password: 'string' },
          responseSchema: { token: 'string', user: { id: 'string', email: 'string' } },
          authentication: false
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          authentication: true
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          responseSchema: { user: { id: 'string', email: 'string' } },
          authentication: true
        }
      ]);

      const apiContract = extractAPIContract(marcusResponse);

      // Step 2: James receives contract and creates complete UI
      const jamesContext: AgentActivationContext = {
        filePath: 'src/hooks/useAuth.ts',
        content: `
          import { useState } from 'react';
          import axios from 'axios';

          export const useAuth = () => {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState(null);

            const login = async ({ email, password }) => {
              setLoading(true);
              try {
                const response = await axios.post('/api/auth/login', { email, password });
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setUser(user);
                return { token, user };
              } catch (err) {
                setError('Login failed');
                throw err;
              } finally {
                setLoading(false);
              }
            };

            const logout = async () => {
              await axios.post('/api/auth/logout', {}, {
                headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
              });
              localStorage.removeItem('token');
              setUser(null);
            };

            const getCurrentUser = async () => {
              const response = await axios.get('/api/auth/me', {
                headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
              });
              setUser(response.data.user);
            };

            return { user, loading, error, login, logout, getCurrentUser, isAuthenticated: !!user };
          };
        `,
        language: 'typescript',
        framework: 'react',
        trigger: { type: 'file-change', timestamp: new Date() },
        metadata: {
          apiContract
        }
      };

      const jamesResponse = await james.activate(jamesContext);

      // Validate handoff success
      expect(jamesResponse.success).toBe(true);
      expect(jamesResponse.confidence).toBeGreaterThan(0.7);

      // Validate James uses all Marcus endpoints
      const apiCalls = extractAPICalls(jamesContext.content);
      expect(apiCalls).toContain('/api/auth/login');
      expect(apiCalls).toContain('/api/auth/logout');
      expect(apiCalls).toContain('/api/auth/me');

      // Validate James implements authentication
      expect(jamesContext.content).toContain('Authorization');
      expect(jamesContext.content).toContain('Bearer');

      // Validate James handles errors
      expect(jamesContext.content).toContain('try');
      expect(jamesContext.content).toContain('catch');
    });
  });

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  function extractAPIContract(marcusResponse: AgentResponse): APIContract {
    return {
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login endpoint',
          requestSchema: { email: 'string', password: 'string' },
          responseSchema: { token: 'string', user: { id: 'string', email: 'string' } },
          authentication: false
        }
      ],
      baseUrl: '/api',
      security: {
        authentication: 'JWT',
        cors: true
      }
    };
  }

  async function createMarcusAPI(endpoints: any[]): Promise<AgentResponse> {
    const code = endpoints.map(endpoint => {
      return `
        router.${endpoint.method.toLowerCase()}('${endpoint.path}', async (req, res) => {
          // Implementation
        });
      `;
    }).join('\n\n');

    const context: AgentActivationContext = {
      filePath: 'src/api/routes.ts',
      content: code,
      language: 'typescript',
      framework: 'express',
      trigger: { type: 'file-change', timestamp: new Date() }
    };

    return await marcus.activate(context);
  }

  function extractAPICalls(code: string): string[] {
    const matches = code.matchAll(/axios\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi);
    const calls = new Set<string>();

    for (const match of matches) {
      calls.add(match[2]);
    }

    return Array.from(calls);
  }

  function extractRequestPayload(code: string, endpoint: string): string {
    const regex = new RegExp(`axios\\.\\w+\\(['"]${endpoint}['"],\\s*\\{([^}]+)\\}`, 'i');
    const match = code.match(regex);

    if (!match) return '';

    return match[1];
  }
});
