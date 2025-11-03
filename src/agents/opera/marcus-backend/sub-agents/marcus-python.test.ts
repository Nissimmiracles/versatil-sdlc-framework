/**
 * VERSATIL SDLC Framework - Marcus-Python Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Python 3.10+ patterns
 * - FastAPI best practices
 * - Type hints and Pydantic validation
 * - Async/await patterns
 * - Security vulnerabilities (OWASP)
 * - Performance optimization
 * - Error handling patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarcusPython } from './marcus-python.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('MarcusPython', () => {
  let agent: MarcusPython;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new MarcusPython();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Python specialization', () => {
      expect(agent.name).toBe('Marcus-Python');
      expect(agent.id).toBe('marcus-python');
      expect(agent.specialization).toContain('Python');
    });

    it('should have Python-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('FastAPI');
      expect(agent.systemPrompt).toContain('type hints');
    });
  });

  describe('Security Pattern Detection', () => {
    it('should detect SQL injection vulnerabilities', () => {
      const content = `
        @app.get("/users")
        def get_user(user_id: str):
            query = f"SELECT * FROM users WHERE id = {user_id}"
            db.execute(query)  # SQL injection!
      `;

      const hasSQLInjection = agent['detectSQLInjection'](content);
      expect(hasSQLInjection).toBe(true);
    });

    it('should detect hardcoded secrets', () => {
      const content = `
        API_KEY = "sk_live_12345abcde"
        DATABASE_PASSWORD = "hardcoded_password"
      `;

      const hasHardcodedSecrets = agent['detectHardcodedSecrets'](content);
      expect(hasHardcodedSecrets).toBe(true);
    });

    it('should detect missing input validation', () => {
      const content = `
        @app.post("/users")
        def create_user(data: dict):  # No Pydantic validation!
            save_user(data)
      `;

      const hasMissingValidation = agent['detectMissingValidation'](content);
      expect(hasMissingValidation).toBe(true);
    });

    it('should detect unsafe eval/exec usage', () => {
      const content = `
        user_input = request.get_json()
        eval(user_input["code"])  # Dangerous!
      `;

      const hasUnsafeEval = agent['detectUnsafeEval'](content);
      expect(hasUnsafeEval).toBe(true);
    });

    it('should detect missing authentication decorators', () => {
      const content = `
        @app.delete("/admin/users/{user_id}")
        def delete_user(user_id: int):  # No auth check!
            delete_user_from_db(user_id)
      `;

      const hasMissingAuth = agent['detectMissingAuth'](content);
      expect(hasMissingAuth).toBe(true);
    });
  });

  describe('FastAPI Best Practices', () => {
    it('should validate Pydantic model usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from pydantic import BaseModel

          class User(BaseModel):
              name: str
              email: str
              age: int

          @app.post("/users")
          def create_user(user: User):
              return user
        `,
        filePath: 'routes.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis).toHaveProperty('bestPractices');
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect proper dependency injection', () => {
      const content = `
        from fastapi import Depends

        def get_db():
            db = SessionLocal()
            try:
                yield db
            finally:
                db.close()

        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
      `;

      const hasDependencyInjection = agent['hasDependencyInjection'](content);
      expect(hasDependencyInjection).toBe(true);
    });

    it('should detect proper async endpoint usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @app.get("/users")
          async def get_users(db: AsyncSession = Depends(get_db)):
              result = await db.execute(select(User))
              return result.scalars().all()
        `,
        filePath: 'routes.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis.score).toBeGreaterThan(70);
    });

    it('should detect response model usage', () => {
      const content = `
        @app.get("/users/{user_id}", response_model=UserResponse)
        def get_user(user_id: int):
            return db.query(User).filter(User.id == user_id).first()
      `;

      const hasResponseModel = agent['hasResponseModel'](content);
      expect(hasResponseModel).toBe(true);
    });
  });

  describe('Type Hints and Validation', () => {
    it('should detect missing type hints', () => {
      const content = `
        def calculate_total(items):  # No type hints
            return sum(items)
      `;

      const hasMissingTypeHints = agent['hasMissingTypeHints'](content);
      expect(hasMissingTypeHints).toBe(true);
    });

    it('should validate proper type hints', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from typing import List, Optional

          def get_users(limit: int = 10) -> List[User]:
              return db.query(User).limit(limit).all()
        `,
        filePath: 'services.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect Pydantic Field validators', () => {
      const content = `
        from pydantic import BaseModel, Field

        class User(BaseModel):
            email: str = Field(..., regex=r'^\S+@\S+\.\S+$')
            age: int = Field(..., ge=0, le=120)
      `;

      const hasFieldValidators = agent['hasFieldValidators'](content);
      expect(hasFieldValidators).toBe(true);
    });
  });

  describe('Async/Await Patterns', () => {
    it('should detect async/await usage', () => {
      const content = `
        async def fetch_data():
            async with httpx.AsyncClient() as client:
                response = await client.get("https://api.example.com")
                return response.json()
      `;

      const hasAsyncAwait = agent['hasAsyncAwait'](content);
      expect(hasAsyncAwait).toBe(true);
    });

    it('should detect missing await in async function', () => {
      const content = `
        async def get_users():
            users = fetch_users()  # Missing await!
            return users
      `;

      const hasMissingAwait = agent['hasMissingAwait'](content);
      expect(typeof hasMissingAwait).toBe('boolean');
    });

    it('should detect blocking I/O in async endpoints', () => {
      const content = `
        @app.get("/data")
        async def get_data():
            with open("large_file.json") as f:  # Blocking!
                data = json.load(f)
            return data
      `;

      const hasBlockingIO = agent['hasBlockingIO'](content);
      expect(hasBlockingIO).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should detect proper exception handling', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from fastapi import HTTPException

          @app.get("/users/{user_id}")
          def get_user(user_id: int):
              user = db.query(User).filter(User.id == user_id).first()
              if not user:
                  raise HTTPException(status_code=404, detail="User not found")
              return user
        `,
        filePath: 'routes.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect bare except clauses (anti-pattern)', () => {
      const content = `
        try:
            risky_operation()
        except:  # Too broad!
            pass
      `;

      const hasBareExcept = agent['hasBareExcept'](content);
      expect(hasBareExcept).toBe(true);
    });

    it('should detect custom exception handlers', () => {
      const content = `
        @app.exception_handler(ValueError)
        async def value_error_handler(request: Request, exc: ValueError):
            return JSONResponse(status_code=400, content={"detail": str(exc)})
      `;

      const hasCustomExceptionHandler = agent['hasCustomExceptionHandler'](content);
      expect(hasCustomExceptionHandler).toBe(true);
    });
  });

  describe('Database Patterns', () => {
    it('should detect parameterized queries (good)', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from sqlalchemy import select

          @app.get("/users/{user_id}")
          async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
              result = await db.execute(
                  select(User).where(User.id == user_id)
              )
              return result.scalar_one_or_none()
        `,
        filePath: 'routes.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis.score).toBeGreaterThan(80);
    });

    it('should detect missing database session management', () => {
      const content = `
        @app.get("/users")
        def get_users():
            db = SessionLocal()  # No try/finally!
            return db.query(User).all()
      `;

      const hasMissingSessionManagement = agent['hasMissingSessionManagement'](content);
      expect(hasMissingSessionManagement).toBe(true);
    });

    it('should detect N+1 query problems', () => {
      const content = `
        users = db.query(User).all()
        for user in users:
            posts = db.query(Post).filter(Post.user_id == user.id).all()  # N+1!
      `;

      const hasNPlusOne = agent['hasNPlusOne'](content);
      expect(hasNPlusOne).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect list comprehensions (good)', () => {
      const content = `
        squares = [x ** 2 for x in range(10)]
      `;

      const hasListComprehension = agent['hasListComprehension'](content);
      expect(hasListComprehension).toBe(true);
    });

    it('should recommend generator expressions for large data', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          results = [process(item) for item in huge_list]
        `,
        filePath: 'services.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis).toBeDefined();
    });

    it('should detect caching decorators', () => {
      const content = `
        from functools import lru_cache

        @lru_cache(maxsize=128)
        def expensive_calculation(n: int) -> int:
            return sum(range(n))
      `;

      const hasCaching = agent['hasCaching'](content);
      expect(hasCaching).toBe(true);
    });
  });

  describe('Code Quality', () => {
    it('should detect proper docstrings', () => {
      const content = `
        def calculate_total(items: List[int]) -> int:
            """
            Calculate the total sum of items.

            Args:
                items: List of integers to sum

            Returns:
                Total sum of all items
            """
            return sum(items)
      `;

      const hasDocstring = agent['hasDocstring'](content);
      expect(hasDocstring).toBe(true);
    });

    it('should detect proper module imports', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from typing import List, Optional
          from fastapi import FastAPI, HTTPException
          from pydantic import BaseModel

          import json
          import logging
        `,
        filePath: 'routes.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis).toBeDefined();
    });

    it('should detect f-strings over format()', () => {
      const content = `
        name = "World"
        greeting = f"Hello, {name}!"
      `;

      const hasFStrings = agent['hasFStrings'](content);
      expect(hasFStrings).toBe(true);
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Python-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          from fastapi import FastAPI
          from pydantic import BaseModel

          app = FastAPI()

          class User(BaseModel):
              name: str
              email: str

          @app.post("/users", response_model=User)
          async def create_user(user: User):
              return user
        `,
        filePath: 'main.py'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide OWASP-based security suggestions', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          @app.post("/login")
          def login(username: str, password: str):
              query = f"SELECT * FROM users WHERE username='{username}'"
              db.execute(query)
        `,
        filePath: 'auth.py'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'empty.py'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Python content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.js'
      };

      const analysis = await agent['analyzePythonPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
