/**
 * Sub-Agent Activation Test Suite
 *
 * Tests auto-activation and routing for all 10 language-specific sub-agents:
 * - 5 Marcus Backend Sub-Agents (Node, Python, Rails, Go, Java)
 * - 5 James Frontend Sub-Agents (React, Vue, Next.js, Angular, Svelte)
 *
 * Validates tech stack detection, routing logic, and fallback mechanisms.
 *
 * Success Criteria:
 * - Sub-agent selection accuracy >85%
 * - Routing latency <500ms
 * - Correct fallback behavior
 *
 * @module sub-agent-activation.test
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { join } from 'path';
import { SubAgentSelector, SubAgentSelection } from '../../src/agents/core/sub-agent-selector.js';
import { TechStackDetector } from '../../src/agents/core/tech-stack-detector.js';
import { ActivationTracker, getActivationTracker, resetActivationTracker } from '../../src/agents/activation-tracker.js';

describe('Sub-Agent Activation Test Suite', () => {
  let tracker: ActivationTracker;
  let projectPath: string;

  beforeEach(() => {
    projectPath = join(__dirname, '../../');
    tracker = getActivationTracker();
    tracker.clear();
    SubAgentSelector.clearCache();
  });

  afterEach(() => {
    resetActivationTracker();
  });

  /**
   * MARCUS BACKEND SUB-AGENTS (5)
   */

  describe('Marcus-Node Auto-Activation', () => {
    it('should detect Node.js from package.json', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/api/users.ts');
      const content = `
        import express from 'express';
        const router = express.Router();
        router.get('/users', async (req, res) => {});
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('marcus-node');
      expect(selection.baseAgentId).toBe('marcus-backend');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'marcus-node',
        trigger: { type: 'code_content', filePath, content },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Express.js patterns', async () => {
      const filePath = join(projectPath, 'src/server.ts');
      const content = `
        import express from 'express';
        const app = express();
        app.listen(3000);
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-node');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect Fastify patterns', async () => {
      const filePath = join(projectPath, 'src/server.ts');
      const content = `
        import Fastify from 'fastify';
        const fastify = Fastify();
        await fastify.listen({ port: 3000 });
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-node');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect NestJS patterns', async () => {
      const filePath = join(projectPath, 'src/main.ts');
      const content = `
        import { NestFactory } from '@nestjs/core';
        const app = await NestFactory.create(AppModule);
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-node');
    });
  });

  describe('Marcus-Python Auto-Activation', () => {
    it('should detect Python from .py extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/api/users.py');
      const content = `
        from fastapi import FastAPI
        app = FastAPI()
        @app.get("/users")
        async def get_users():
            return []
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('marcus-python');
      expect(selection.baseAgentId).toBe('marcus-backend');
      expect(selection.confidence).toBeGreaterThan(0.6);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'marcus-python',
        trigger: { type: 'file_pattern', pattern: '*.py', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect FastAPI patterns', async () => {
      const filePath = join(projectPath, 'main.py');
      const content = `
        from fastapi import FastAPI, Depends
        from pydantic import BaseModel
        app = FastAPI()
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-python');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect Django patterns', async () => {
      const filePath = join(projectPath, 'views.py');
      const content = `
        from django.http import JsonResponse
        from django.views import View
        class UserView(View):
            def get(self, request):
                return JsonResponse({})
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-python');
    });

    it('should detect Flask patterns', async () => {
      const filePath = join(projectPath, 'app.py');
      const content = `
        from flask import Flask, jsonify
        app = Flask(__name__)
        @app.route('/users')
        def users():
            return jsonify([])
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-python');
    });
  });

  describe('Marcus-Rails Auto-Activation', () => {
    it('should detect Ruby from .rb extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'app/controllers/users_controller.rb');
      const content = `
        class UsersController < ApplicationController
          def index
            @users = User.all
          end
        end
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('marcus-rails');
      expect(selection.baseAgentId).toBe('marcus-backend');
      expect(selection.confidence).toBeGreaterThan(0.6);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'marcus-rails',
        trigger: { type: 'file_pattern', pattern: '*.rb', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Rails patterns', async () => {
      const filePath = join(projectPath, 'config/application.rb');
      const content = `
        module MyApp
          class Application < Rails::Application
            config.load_defaults 7.0
          end
        end
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-rails');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect ActiveRecord patterns', async () => {
      const filePath = join(projectPath, 'app/models/user.rb');
      const content = `
        class User < ApplicationRecord
          has_many :posts
          validates :email, presence: true
        end
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-rails');
    });
  });

  describe('Marcus-Go Auto-Activation', () => {
    it('should detect Go from .go extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'main.go');
      const content = `
        package main
        import "github.com/gin-gonic/gin"
        func main() {
          r := gin.Default()
          r.GET("/users", getUsers)
          r.Run()
        }
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('marcus-go');
      expect(selection.baseAgentId).toBe('marcus-backend');
      expect(selection.confidence).toBeGreaterThan(0.6);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'marcus-go',
        trigger: { type: 'file_pattern', pattern: '*.go', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Gin patterns', async () => {
      const filePath = join(projectPath, 'routes.go');
      const content = `
        import "github.com/gin-gonic/gin"
        func setupRouter() *gin.Engine {
          r := gin.Default()
          return r
        }
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-go');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect Echo patterns', async () => {
      const filePath = join(projectPath, 'server.go');
      const content = `
        import "github.com/labstack/echo/v4"
        func main() {
          e := echo.New()
          e.Start(":8080")
        }
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-go');
    });
  });

  describe('Marcus-Java Auto-Activation', () => {
    it('should detect Java from .java extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/main/java/UserController.java');
      const content = `
        package com.example.demo;
        import org.springframework.web.bind.annotation.*;
        @RestController
        @RequestMapping("/users")
        public class UserController {
          @GetMapping
          public List<User> getUsers() {
            return new ArrayList<>();
          }
        }
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('marcus-java');
      expect(selection.baseAgentId).toBe('marcus-backend');
      expect(selection.confidence).toBeGreaterThan(0.6);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'marcus-java',
        trigger: { type: 'file_pattern', pattern: '*.java', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Spring Boot patterns', async () => {
      const filePath = join(projectPath, 'src/main/java/Application.java');
      const content = `
        package com.example.demo;
        import org.springframework.boot.SpringApplication;
        import org.springframework.boot.autoconfigure.SpringBootApplication;
        @SpringBootApplication
        public class Application {
          public static void main(String[] args) {
            SpringApplication.run(Application.class, args);
          }
        }
      `;

      const selection = await SubAgentSelector.selectBackendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('marcus-java');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });
  });

  /**
   * JAMES FRONTEND SUB-AGENTS (5)
   */

  describe('James-React Auto-Activation', () => {
    it('should detect React from .tsx extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/components/Button.tsx');
      const content = `
        import React from 'react';
        export function Button() {
          const [count, setCount] = React.useState(0);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('james-react');
      expect(selection.baseAgentId).toBe('james-frontend');
      expect(selection.confidence).toBeGreaterThan(0.5);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'james-react',
        trigger: { type: 'file_pattern', pattern: '*.tsx', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect React hooks patterns', async () => {
      const filePath = join(projectPath, 'src/hooks/useUser.ts');
      const content = `
        import { useState, useEffect } from 'react';
        export function useUser(id: string) {
          const [user, setUser] = useState(null);
          useEffect(() => {
            fetchUser(id).then(setUser);
          }, [id]);
          return user;
        }
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-react');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });

    it('should detect JSX syntax', async () => {
      const filePath = join(projectPath, 'src/App.jsx');
      const content = `
        export const App = () => {
          return <div className="app">Hello World</div>;
        };
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-react');
    });
  });

  describe('James-Vue Auto-Activation', () => {
    it('should detect Vue from .vue extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/components/Button.vue');
      const content = `
        <template>
          <button @click="count++">{{ count }}</button>
        </template>
        <script setup>
        import { ref } from 'vue';
        const count = ref(0);
        </script>
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('james-vue');
      expect(selection.baseAgentId).toBe('james-frontend');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'james-vue',
        trigger: { type: 'file_pattern', pattern: '*.vue', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Vue Composition API', async () => {
      const filePath = join(projectPath, 'src/composables/useCounter.ts');
      const content = `
        import { ref } from 'vue';
        export function useCounter() {
          const count = ref(0);
          const increment = () => count.value++;
          return { count, increment };
        }
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-vue');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('James-NextJS Auto-Activation', () => {
    it('should detect Next.js from imports', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'app/page.tsx');
      const content = `
        import Link from 'next/link';
        import Image from 'next/image';
        export default function Page() {
          return <div><Link href="/about">About</Link></div>;
        }
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('james-nextjs');
      expect(selection.baseAgentId).toBe('james-frontend');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'james-nextjs',
        trigger: { type: 'code_content', filePath, content },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect App Router patterns', async () => {
      const filePath = join(projectPath, 'app/layout.tsx');
      const content = `
        export default function RootLayout({ children }) {
          return (
            <html lang="en">
              <body>{children}</body>
            </html>
          );
        }
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-nextjs');
    });
  });

  describe('James-Angular Auto-Activation', () => {
    it('should detect Angular from decorators', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/app/components/button.component.ts');
      const content = `
        import { Component } from '@angular/core';
        @Component({
          selector: 'app-button',
          template: '<button>Click</button>'
        })
        export class ButtonComponent {}
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('james-angular');
      expect(selection.baseAgentId).toBe('james-frontend');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'james-angular',
        trigger: { type: 'code_content', filePath, content },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Angular modules', async () => {
      const filePath = join(projectPath, 'src/app/app.module.ts');
      const content = `
        import { NgModule } from '@angular/core';
        @NgModule({
          declarations: [AppComponent],
          imports: [BrowserModule],
          bootstrap: [AppComponent]
        })
        export class AppModule {}
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-angular');
    });
  });

  describe('James-Svelte Auto-Activation', () => {
    it('should detect Svelte from .svelte extension', async () => {
      const startTime = Date.now();
      const filePath = join(projectPath, 'src/components/Button.svelte');
      const content = `
        <script>
          let count = 0;
        </script>
        <button on:click={() => count++}>
          {count}
        </button>
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);
      const latency = Date.now() - startTime;

      expect(selection.subAgentId).toBe('james-svelte');
      expect(selection.baseAgentId).toBe('james-frontend');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(latency).toBeLessThan(500);

      tracker.trackActivation({
        agentId: 'james-svelte',
        trigger: { type: 'file_pattern', pattern: '*.svelte', filePath },
        latency,
        accuracy: 'correct',
        confidence: selection.confidence * 100
      });
    });

    it('should detect Svelte stores', async () => {
      const filePath = join(projectPath, 'src/stores/counter.ts');
      const content = `
        import { writable } from 'svelte/store';
        export const count = writable(0);
      `;

      const selection = await SubAgentSelector.selectFrontendSubAgent(filePath, content, projectPath);

      expect(selection.subAgentId).toBe('james-svelte');
      expect(selection.confidence).toBeGreaterThan(0.7);
    });
  });

  /**
   * VALIDATION REPORT
   */

  describe('Sub-Agent Validation Report', () => {
    it('should generate sub-agent activation report', () => {
      const report = tracker.generateReport();

      expect(report.overallAccuracy).toBeGreaterThanOrEqual(85);
      expect(report.overallLatency).toBeLessThan(500);

      console.log('\n=== SUB-AGENT ACTIVATION REPORT ===\n');
      console.log(`Overall Accuracy: ${report.overallAccuracy.toFixed(2)}%`);
      console.log(`Overall Latency: ${report.overallLatency.toFixed(0)}ms`);
      console.log(`Total Activations: ${report.totalActivations}`);
      console.log('\nSub-Agent Metrics:');

      const subAgents = [
        'marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java',
        'james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte'
      ];

      subAgents.forEach(agentId => {
        const metrics = report.agentMetrics.get(agentId);
        if (metrics && metrics.totalActivations > 0) {
          console.log(`\n${agentId}:`);
          console.log(`  Accuracy: ${metrics.accuracy.toFixed(2)}%`);
          console.log(`  Avg Latency: ${metrics.averageLatency.toFixed(0)}ms`);
          console.log(`  Total Activations: ${metrics.totalActivations}`);
        }
      });

      console.log(`\n${report.summary}\n`);
    });
  });
});
