#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Multi-Agent Testing Orchestrator
 * Coordinates all OPERA agents to test their respective domains
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chalk compatibility handling
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

const colors = {
  blue: (text) => chalk.blue(text),
  green: (text) => chalk.green(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  cyan: (text) => chalk.cyan(text),
  gray: (text) => chalk.gray(text),
  magenta: (text) => chalk.magenta(text)
};

class MultiAgentOrchestrator {
  constructor() {
    this.agents = {
      'enhanced-maria': { name: 'Enhanced Maria', domain: 'Quality Assurance', icon: '🧪' },
      'enhanced-james': { name: 'Enhanced James', domain: 'Frontend Development', icon: '🎨' },
      'enhanced-marcus': { name: 'Enhanced Marcus', domain: 'Backend Development', icon: '⚙️' },
      'sarah-pm': { name: 'Sarah PM', domain: 'Project Management', icon: '📋' },
      'alex-ba': { name: 'Alex BA', domain: 'Business Analysis', icon: '📊' },
      'security-sam': { name: 'Security Sam', domain: 'Security Analysis', icon: '🔒' }
    };

    this.testCases = {
      frontend: {
        agent: 'enhanced-james',
        files: [
          {
            filePath: 'src/components/UserProfile.jsx',
            content: `
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="user-profile">
      {loading ? <div>Loading...</div> : (
        <div>
          <h1>{user.name}</h1>
          <img src={user.avatar} alt="Avatar" />
          <button onClick={() => handleEdit(user.id)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
            `.trim()
          },
          {
            filePath: 'src/styles/components.css',
            content: `
.user-profile {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1px solid #ccc;
}

.user-profile h1 {
  color: #333;
  margin-bottom: 10px;
}

.user-profile img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .user-profile {
    padding: 10px;
  }
}
            `.trim()
          }
        ]
      },
      backend: {
        agent: 'enhanced-marcus',
        files: [
          {
            filePath: 'src/api/auth.js',
            content: `
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash });
  await user.save();

  res.status(201).json({ message: 'User created successfully' });
});

module.exports = router;
            `.trim()
          },
          {
            filePath: 'src/database/connection.js',
            content: `
const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
            `.trim()
          }
        ]
      },
      qa: {
        agent: 'enhanced-maria',
        files: [
          {
            filePath: 'test/auth.test.js',
            content: `
const request = require('supertest');
const app = require('../src/app');

describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  test('registration validation', () => {
    const user = { email: 'test@example.com' };
    // Missing assertion for password validation
  });
});
            `.trim()
          }
        ]
      },
      security: {
        agent: 'security-sam',
        files: [
          {
            filePath: 'src/middleware/auth.js',
            content: `
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Potentially vulnerable: SQL injection risk
const getUserData = (userId) => {
  return db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
};

module.exports = { authMiddleware, getUserData };
            `.trim()
          }
        ]
      },
      business: {
        agent: 'alex-ba',
        files: [
          {
            filePath: 'docs/requirements.md',
            content: `
# User Authentication Requirements

## User Stories

### Epic: User Account Management

**US001**: As a user, I want to create an account so that I can access personalized features.
- Acceptance Criteria:
  - User can register with email and password
  - Password must be at least 8 characters
  - Email must be unique
  - User receives confirmation email

**US002**: As a user, I want to login to my account so that I can access my data.
- Acceptance Criteria:
  - User can login with email/password
  - Invalid credentials show error message
  - Successful login redirects to dashboard

**US003**: As a user, I want to reset my password so that I can regain access if I forget it.
- Acceptance Criteria:
  - User can request password reset via email
  - Reset link expires after 1 hour
  - User can set new password via reset link

## Business Rules

1. Passwords must be hashed using bcrypt
2. JWT tokens expire after 24 hours
3. Maximum 5 failed login attempts before account lockout
4. User data must be encrypted at rest
            `.trim()
          }
        ]
      },
      project: {
        agent: 'sarah-pm',
        files: [
          {
            filePath: 'README.md',
            content: `
# Project: User Authentication System

## Overview
A secure user authentication system built with Node.js and React.

## Features
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control

## Tech Stack
- Frontend: React, CSS3
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT, bcrypt

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure
- /src/components - React components
- /src/api - Express routes
- /src/models - Database models
- /test - Test files

## Contributing
1. Fork the repository
2. Create feature branch
3. Submit pull request
            `.trim()
          }
        ]
      }
    };

    this.results = {
      agents: {},
      coordination: [],
      summary: {}
    };
  }

  async orchestrateMultiAgentTesting() {
    console.log(colors.cyan('🎭 Starting Multi-Agent Testing Orchestration...'));
    console.log(colors.gray('━'.repeat(60)));

    // Step 1: Initialize all agents
    await this.loadAgents();

    // Step 2: Execute domain-specific testing
    for (const [domain, testCase] of Object.entries(this.testCases)) {
      await this.runAgentDomainTest(domain, testCase);
    }

    // Step 3: Process agent handoffs
    await this.processAgentHandoffs();

    // Step 4: Generate coordination summary
    this.generateCoordinationSummary();

    // Step 5: Save results
    this.saveResults();

    console.log(colors.green('✅ Multi-Agent Testing Orchestration Complete!'));
    return this.results;
  }

  async loadAgents() {
    console.log(colors.blue('📥 Loading OPERA Agents...'));

    for (const [agentId, agentInfo] of Object.entries(this.agents)) {
      try {
        // Try to load each agent from dist folder
        const agentPath = `../dist/agents/${agentId}.js`;
        const AgentClass = require(agentPath);

        // Handle different export patterns
        const AgentConstructor = AgentClass.EnhancedMaria ||
                                AgentClass.EnhancedJames ||
                                AgentClass.EnhancedMarcus ||
                                AgentClass.SarahPM ||
                                AgentClass.AlexBA ||
                                AgentClass.SecuritySam ||
                                AgentClass.default ||
                                AgentClass;

        this.results.agents[agentId] = {
          ...agentInfo,
          status: 'loaded',
          instance: new AgentConstructor()
        };

        console.log(colors.green(`  ✅ ${agentInfo.icon} ${agentInfo.name} loaded`));
      } catch (error) {
        this.results.agents[agentId] = {
          ...agentInfo,
          status: 'failed',
          error: error.message
        };
        console.log(colors.yellow(`  ⚠️  ${agentInfo.icon} ${agentInfo.name} failed to load: ${error.message}`));
      }
    }
  }

  async runAgentDomainTest(domain, testCase) {
    const agent = this.results.agents[testCase.agent];
    console.log(colors.magenta(`\n🎯 Testing ${domain.toUpperCase()} domain with ${agent.name}...`));

    if (agent.status !== 'loaded') {
      console.log(colors.red(`  ❌ Agent ${agent.name} not available`));
      return;
    }

    const domainResults = {
      domain,
      agent: testCase.agent,
      files: [],
      patterns: [],
      recommendations: [],
      handoffs: []
    };

    // Test each file in the domain
    for (const file of testCase.files) {
      try {
        console.log(colors.gray(`  📄 Analyzing ${file.filePath}...`));

        const result = await agent.instance.activate({
          filePath: file.filePath,
          content: file.content,
          trigger: 'domain-analysis',
          domain: domain
        });

        const fileResult = {
          filePath: file.filePath,
          score: result.context?.analysisScore || 85,
          issues: result.suggestions || [],
          recommendations: result.context?.recommendations || [],
          handoffs: result.handoffTo || []
        };

        domainResults.files.push(fileResult);
        domainResults.patterns.push(...(result.suggestions || []));
        domainResults.recommendations.push(...(result.context?.recommendations || []));
        domainResults.handoffs.push(...(result.handoffTo || []));

        console.log(colors.green(`    ✅ Score: ${fileResult.score}/100, Issues: ${fileResult.issues.length}`));

      } catch (error) {
        console.log(colors.red(`    ❌ Analysis failed: ${error.message}`));
        domainResults.files.push({
          filePath: file.filePath,
          score: 0,
          issues: [],
          error: error.message
        });
      }
    }

    // Store domain results
    this.results[domain] = domainResults;

    // Process handoffs for coordination
    if (domainResults.handoffs.length > 0) {
      this.results.coordination.push({
        from: testCase.agent,
        domain: domain,
        handoffs: [...new Set(domainResults.handoffs)],
        reason: `${domainResults.patterns.length} issues detected in ${domain}`,
        priority: domainResults.patterns.some(p => p.priority === 'critical') ? 'high' : 'medium'
      });
    }

    console.log(colors.green(`  ✅ ${domain} analysis complete: ${domainResults.patterns.length} patterns found`));
  }

  async processAgentHandoffs() {
    console.log(colors.cyan('\n🤝 Processing Agent Handoffs...'));

    if (this.results.coordination.length === 0) {
      console.log(colors.gray('  No handoffs detected'));
      return;
    }

    for (const coordination of this.results.coordination) {
      console.log(colors.yellow(`  🔄 ${this.agents[coordination.from].name} → ${coordination.handoffs.join(', ')}`));
      console.log(colors.gray(`     Reason: ${coordination.reason}`));
      console.log(colors.gray(`     Priority: ${coordination.priority}`));
    }
  }

  generateCoordinationSummary() {
    console.log(colors.cyan('\n📊 Generating Multi-Agent Summary...'));

    const totalDomains = Object.keys(this.testCases).length;
    const activeDomains = Object.keys(this.results).filter(key =>
      key !== 'agents' && key !== 'coordination' && key !== 'summary'
    ).length;

    const totalPatterns = Object.values(this.results)
      .filter(result => result.patterns)
      .reduce((sum, result) => sum + result.patterns.length, 0);

    const criticalIssues = Object.values(this.results)
      .filter(result => result.patterns)
      .reduce((sum, result) => sum + result.patterns.filter(p => p.priority === 'critical').length, 0);

    this.results.summary = {
      totalAgents: Object.keys(this.agents).length,
      activeAgents: Object.values(this.results.agents).filter(a => a.status === 'loaded').length,
      totalDomains,
      activeDomains,
      totalPatterns,
      criticalIssues,
      coordinationEvents: this.results.coordination.length,
      timestamp: new Date().toISOString()
    };

    console.log(colors.green(`  ✅ ${this.results.summary.activeAgents}/${this.results.summary.totalAgents} agents active`));
    console.log(colors.green(`  ✅ ${activeDomains}/${totalDomains} domains tested`));
    console.log(colors.green(`  ✅ ${totalPatterns} patterns detected`));
    console.log(colors.green(`  ✅ ${this.results.coordination.length} coordination events`));
  }

  saveResults() {
    const outputPath = 'multi-agent-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(colors.green(`📄 Results saved to: ${outputPath}`));
  }
}

// Execute if run directly
if (require.main === module) {
  const orchestrator = new MultiAgentOrchestrator();
  orchestrator.orchestrateMultiAgentTesting().then(() => {
    console.log(colors.cyan('\n🎭 Multi-Agent Orchestration Complete!'));
  }).catch(error => {
    console.error(colors.red('❌ Orchestration failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { MultiAgentOrchestrator };