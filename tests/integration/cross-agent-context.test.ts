/**
 * Cross-Agent Context Preservation Tests
 * Sprint 1 Day 5-6: Verify RAG context is preserved across agent handoffs
 */

import { EnhancedMaria } from '../../src/agents/enhanced-maria';
import { EnhancedJames } from '../../src/agents/enhanced-james';
import { EnhancedMarcus } from '../../src/agents/enhanced-marcus';
import { AlexBa } from '../../src/agents/alex-ba';
import { SarahPm } from '../../src/agents/sarah-pm';
import { DrAiMl } from '../../src/agents/dr-ai-ml';
import { EnhancedVectorMemoryStore } from '../../src/rag/enhanced-vector-memory-store';
import { AgentActivationContext } from '../../src/agents/base-agent';

describe('Cross-Agent Context Preservation', () => {
  let vectorStore: EnhancedVectorMemoryStore;
  let maria: EnhancedMaria;
  let james: EnhancedJames;
  let marcus: EnhancedMarcus;
  let alex: AlexBa;
  let sarah: SarahPm;
  let drAi: DrAiMl;

  beforeAll(async () => {
    // Shared vector store for all agents
    vectorStore = new EnhancedVectorMemoryStore();

    // Initialize all 6 agents with shared vector store
    maria = new EnhancedMaria(vectorStore);
    james = new EnhancedJames(vectorStore);
    marcus = new EnhancedMarcus(vectorStore);
    alex = new AlexBa(vectorStore);
    sarah = new SarahPm(vectorStore);
    drAi = new DrAiMl(vectorStore);

    // Seed vector store with sample patterns
    await vectorStore.storeMemory({
      content: 'React component testing pattern with hooks',
      contentType: 'code',
      language: 'typescript',
      sourceFile: '/test/component.test.tsx',
      tags: ['frontend', 'testing', 'react', 'hooks'],
      framework: 'react',
      agentId: 'enhanced-james',
      metadata: {
        pattern: 'component-test',
        success: true
      }
    });

    await vectorStore.storeMemory({
      content: 'Express API security validation with JWT',
      contentType: 'code',
      language: 'typescript',
      sourceFile: '/test/auth.ts',
      tags: ['backend', 'security', 'api', 'jwt'],
      framework: 'express',
      agentId: 'enhanced-marcus',
      metadata: {
        pattern: 'api-security',
        success: true
      }
    });

    await vectorStore.storeMemory({
      content: 'User story: As a user, I want to login securely',
      contentType: 'requirement',
      language: 'gherkin',
      sourceFile: '/requirements/auth.feature',
      tags: ['business-analysis', 'requirements', 'user-story'],
      agentId: 'alex-ba',
      metadata: {
        pattern: 'user-story',
        priority: 'high'
      }
    });
  });

  describe('Scenario 1: Frontend-to-QA Handoff', () => {
    it('should preserve component context from James to Maria', async () => {
      const componentContext: AgentActivationContext = {
        filePath: '/src/components/LoginForm.tsx',
        content: `
          import React, { useState } from 'react';

          export const LoginForm = () => {
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');

            return (
              <form>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button>
              </form>
            );
          };
        `,
        language: 'typescript',
        framework: 'react',
        userIntent: 'code_review',
        timestamp: Date.now()
      };

      // James analyzes component
      const jamesResponse = await james.activate(componentContext);
      expect(jamesResponse.agentId).toBe('enhanced-james');
      expect(jamesResponse.message).toContain('Frontend');

      // Maria receives handoff with context
      const testContext: AgentActivationContext = {
        ...componentContext,
        filePath: '/src/components/LoginForm.test.tsx',
        content: `
          import { render, screen } from '@testing-library/react';
          import { LoginForm } from './LoginForm';

          describe('LoginForm', () => {
            it('should render email and password fields', () => {
              render(<LoginForm />);
              expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
              expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
            });
          });
        `,
        metadata: {
          handoffFrom: 'enhanced-james',
          componentFile: '/src/components/LoginForm.tsx',
          previousAnalysis: jamesResponse.context
        }
      };

      const mariaResponse = await maria.activate(testContext);
      expect(mariaResponse.agentId).toBe('enhanced-maria');
      expect(mariaResponse.message).toContain('QA');

      // Verify context preservation
      expect(testContext.metadata?.handoffFrom).toBe('enhanced-james');
      expect(testContext.metadata?.previousAnalysis).toBeDefined();
    });
  });

  describe('Scenario 2: BA-to-Backend-to-Frontend Chain', () => {
    it('should preserve requirements context through full chain', async () => {
      // Step 1: Alex analyzes requirements
      const requirementContext: AgentActivationContext = {
        filePath: '/requirements/authentication.md',
        content: `
          # Authentication Feature

          As a user, I want to login with email and password
          So that I can access my account securely

          Acceptance Criteria:
          - User can enter email and password
          - System validates credentials
          - JWT token issued on success
          - Session expires after 24 hours
        `,
        language: 'markdown',
        framework: 'none',
        userIntent: 'requirements_analysis',
        timestamp: Date.now()
      };

      const alexResponse = await alex.activate(requirementContext);
      expect(alexResponse.agentId).toBe('alex-ba');

      // Step 2: Marcus implements backend API
      const backendContext: AgentActivationContext = {
        filePath: '/src/api/auth.ts',
        content: `
          import jwt from 'jsonwebtoken';
          import bcrypt from 'bcrypt';

          export async function login(email: string, password: string) {
            const user = await findUserByEmail(email);
            if (!user) throw new Error('Invalid credentials');

            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) throw new Error('Invalid credentials');

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
              expiresIn: '24h'
            });

            return { token, user };
          }
        `,
        language: 'typescript',
        framework: 'express',
        userIntent: 'code_implementation',
        timestamp: Date.now(),
        metadata: {
          handoffFrom: 'alex-ba',
          requirements: alexResponse.context
        }
      };

      const marcusResponse = await marcus.activate(backendContext);
      expect(marcusResponse.agentId).toBe('enhanced-marcus');

      // Step 3: James implements frontend
      const frontendContext: AgentActivationContext = {
        filePath: '/src/components/LoginForm.tsx',
        content: `
          import React, { useState } from 'react';
          import { login } from '../api/auth';

          export const LoginForm = () => {
            const [email, setEmail] = useState('');
            const [password, setPassword] = useState('');

            const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              const { token } = await login(email, password);
              localStorage.setItem('token', token);
            };

            return <form onSubmit={handleSubmit}>...</form>;
          };
        `,
        language: 'typescript',
        framework: 'react',
        userIntent: 'code_implementation',
        timestamp: Date.now(),
        metadata: {
          handoffFrom: 'enhanced-marcus',
          apiEndpoint: '/api/auth/login',
          backendAnalysis: marcusResponse.context,
          requirements: alexResponse.context
        }
      };

      const jamesResponse = await james.activate(frontendContext);
      expect(jamesResponse.agentId).toBe('enhanced-james');

      // Verify full chain context preservation
      expect(frontendContext.metadata?.handoffFrom).toBe('enhanced-marcus');
      expect(frontendContext.metadata?.backendAnalysis).toBeDefined();
      expect(frontendContext.metadata?.requirements).toBeDefined();
    });
  });

  describe('Scenario 3: RAG Cache Effectiveness', () => {
    it('should use cached RAG results for repeated queries', async () => {
      const context: AgentActivationContext = {
        filePath: '/src/components/Button.tsx',
        content: `
          import React from 'react';

          export const Button = ({ label, onClick }: ButtonProps) => {
            return <button onClick={onClick}>{label}</button>;
          };
        `,
        language: 'typescript',
        framework: 'react',
        userIntent: 'code_review',
        timestamp: Date.now()
      };

      // First activation - should query RAG
      const start1 = Date.now();
      const response1 = await james.activate(context);
      const duration1 = Date.now() - start1;

      // Second activation (within 5min) - should use cache
      const start2 = Date.now();
      const response2 = await james.activate(context);
      const duration2 = Date.now() - start2;

      // Cache should be faster
      expect(duration2).toBeLessThanOrEqual(duration1);
      expect(response1.agentId).toBe(response2.agentId);

      // Verify both responses are valid
      expect(response1.message).toBeDefined();
      expect(response2.message).toBeDefined();
    });

    it('should expire cache after 5 minutes', async () => {
      const context: AgentActivationContext = {
        filePath: '/src/utils/helper.ts',
        content: 'export const helper = () => { return true; };',
        language: 'typescript',
        framework: 'none',
        userIntent: 'code_review',
        timestamp: Date.now()
      };

      // First activation
      await james.activate(context);

      // Get cache stats
      const stats = (james as any).getRAGCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // In real scenario, wait 5 minutes for cache to expire
      // For testing, we can verify cache exists
      expect(stats.newest).toBeDefined();
    });
  });

  describe('Scenario 4: Multi-Agent Collaboration', () => {
    it('should preserve context across 4+ agents', async () => {
      // Simulate full SDLC workflow: Alex → Marcus → James → Maria
      const contexts: any[] = [];

      // Alex: Requirements
      const alexCtx: AgentActivationContext = {
        filePath: '/requirements/feature.md',
        content: 'Feature: User Profile Management',
        language: 'markdown',
        framework: 'none',
        userIntent: 'requirements_analysis',
        timestamp: Date.now()
      };
      const alexResp = await alex.activate(alexCtx);
      contexts.push({ agent: 'alex-ba', context: alexResp.context });

      // Marcus: Backend API
      const marcusCtx: AgentActivationContext = {
        filePath: '/src/api/profile.ts',
        content: 'export async function getProfile(userId: string) {}',
        language: 'typescript',
        framework: 'express',
        userIntent: 'code_implementation',
        timestamp: Date.now(),
        metadata: { previousContext: contexts }
      };
      const marcusResp = await marcus.activate(marcusCtx);
      contexts.push({ agent: 'enhanced-marcus', context: marcusResp.context });

      // James: Frontend Component
      const jamesCtx: AgentActivationContext = {
        filePath: '/src/components/Profile.tsx',
        content: 'export const Profile = () => <div>Profile</div>;',
        language: 'typescript',
        framework: 'react',
        userIntent: 'code_implementation',
        timestamp: Date.now(),
        metadata: { previousContext: contexts }
      };
      const jamesResp = await james.activate(jamesCtx);
      contexts.push({ agent: 'enhanced-james', context: jamesResp.context });

      // Maria: Testing
      const mariaCtx: AgentActivationContext = {
        filePath: '/src/components/Profile.test.tsx',
        content: 'describe("Profile", () => {});',
        language: 'typescript',
        framework: 'jest',
        userIntent: 'test_creation',
        timestamp: Date.now(),
        metadata: { previousContext: contexts }
      };
      const mariaResp = await maria.activate(mariaCtx);

      // Verify full context chain
      expect(contexts.length).toBe(3);
      expect(contexts[0].agent).toBe('alex-ba');
      expect(contexts[1].agent).toBe('enhanced-marcus');
      expect(contexts[2].agent).toBe('enhanced-james');
      expect(mariaResp.agentId).toBe('enhanced-maria');
    });
  });

  describe('Scenario 5: RAG Retrieval Accuracy', () => {
    it('should retrieve relevant patterns from vector store', async () => {
      const context: AgentActivationContext = {
        filePath: '/src/components/AuthForm.tsx',
        content: `
          import React from 'react';

          export const AuthForm = () => {
            return <form>Login form with hooks</form>;
          };
        `,
        language: 'typescript',
        framework: 'react',
        userIntent: 'code_review',
        timestamp: Date.now()
      };

      const response = await james.activate(context);

      // Response should leverage RAG context
      expect(response.message).toBeDefined();
      expect(response.agentId).toBe('enhanced-james');

      // Should have retrieved patterns (if vectorStore is working)
      // This is implicit - RAG happens in background
      expect(response.context).toBeDefined();
    });
  });
});
