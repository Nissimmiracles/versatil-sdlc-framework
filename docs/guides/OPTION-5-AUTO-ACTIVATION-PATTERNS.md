# Option 5: Auto-Activation Patterns & Customization

**Goal:** Master automatic agent activation and customize for your workflow

**Time:** 20-30 minutes to understand, ongoing for customization

**Benefit:** Zero manual commands - agents activate exactly when you need them

---

## Overview

This guide teaches you how the framework's automatic activation system works and how to customize it for your exact needs.

**Core Concept:** Define patterns → Agents activate automatically → Zero manual intervention

---

## Part 1: Understanding Auto-Activation

### The 7-Layer Automatic Activation System

```
Your Action (Save file, Type message, Commit code)
          ↓
[Layer 1] File System Monitor (detects changes in <100ms)
          ↓
[Layer 2] Pattern Matcher (.cursorrules + settings.json)
          ↓
[Layer 3] Event Dispatcher (routes to correct agent)
          ↓
[Layer 4] Agent Pool (pre-warmed, ready to execute)
          ↓
[Layer 5] Context Injector (adds file/project context)
          ↓
[Layer 6] Agent Execution (analysis, suggestions, fixes)
          ↓
[Layer 7] Quality Gate Validation (automatic enforcement)
          ↓
Result Delivered (in Cursor Chat or inline suggestions)
```

### How It Works (Technical Deep Dive)

**Layer 1: File System Monitor**
```typescript
// ProactiveDaemon watches all files
fs.watch(projectRoot, { recursive: true }, (eventType, filename) => {
  if (eventType === 'change' && shouldProcess(filename)) {
    emit('file:changed', { path: filename, timestamp: Date.now() });
  }
});

// Debounced to prevent spam (configurable: 500-2000ms)
```

**Layer 2: Pattern Matcher**
```typescript
// Reads .cursorrules and settings.json
const triggers = {
  'james-frontend': {
    filePatterns: ['*.tsx', '*.jsx', 'components/**/*'],
    keywords: ['react', 'component', 'ui'],
    autoActivate: true,
    priority: 5
  }
};

// Matches file against all patterns
function shouldActivate(filePath: string): string[] {
  return Object.entries(triggers)
    .filter(([_, config]) => matchesPattern(filePath, config.filePatterns))
    .map(([agentId, _]) => agentId);
}
```

**Layer 3: Event Dispatcher**
```typescript
// Event-driven orchestration (150ms latency target)
orchestrator.on('file:changed', async ({ path }) => {
  const agents = shouldActivate(path);
  for (const agentId of agents) {
    await activateAgent(agentId, { filePath: path });
  }
});
```

**Layer 4: Agent Pool**
```typescript
// Pre-warmed agent instances (50% faster activation)
class AgentPool {
  private pool = new Map<string, Agent>();

  async getAgent(agentId: string): Promise<Agent> {
    if (this.pool.has(agentId)) {
      return this.pool.get(agentId)!; // Instant (warm)
    }
    const agent = await loadAgent(agentId); // ~500ms (cold)
    this.pool.set(agentId, agent);
    return agent;
  }
}
```

---

## Part 2: Configuration Files

### File 1: `.cursorrules` (Simple Pattern Definitions)

**Location:** Project root

**Purpose:** Define which agents activate for which patterns

**Syntax:**
```yaml
<agent-name>_triggers:
  auto_activate: true/false
  priority: 1-10
  focus: "Description of what agent does"
```

**Example:**
```yaml
# .cursorrules
maria-qa_triggers:
  auto_activate: true
  priority: 10
  focus: Automated testing, test coverage, quality assurance

james-frontend_triggers:
  auto_activate: true
  priority: 5
  focus: React components, accessibility, performance optimization

marcus-backend_triggers:
  auto_activate: true
  priority: 5
  focus: API security, OWASP compliance, backend performance

dana-database_triggers:
  auto_activate: true
  priority: 5
  focus: Database schema, migrations, query optimization
```

**How It Works:**
- Cursor AI reads this file automatically
- Uses `focus` to determine when to activate agents
- Higher `priority` = activates first when multiple agents match

---

### File 2: `.cursor/settings.json` (Advanced Configuration)

**Location:** `.cursor/settings.json` in project root

**Purpose:** Detailed activation rules, file patterns, keywords, behaviors

**Full Configuration Reference:**

```json
{
  "versatil.project": {
    "name": "my-project",
    "stack": {
      "frontend": "react",
      "backend": "nodejs",
      "database": "postgresql"
    }
  },

  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "background_monitoring": true,

    "activation_triggers": {
      "james-frontend": {
        "file_patterns": [
          "*.tsx",
          "*.jsx",
          "src/components/**/*",
          "src/pages/**/*"
        ],
        "keywords": [
          "react",
          "component",
          "ui",
          "accessibility",
          "performance"
        ],
        "auto_run_on_save": true,
        "debounce_ms": 1000,
        "priority": 5,
        "proactive_actions": [
          "accessibility_check_wcag",
          "performance_optimization_suggestions",
          "bundle_size_analysis"
        ]
      },

      "marcus-backend": {
        "file_patterns": [
          "src/api/**/*.ts",
          "src/services/**/*",
          "api/**/*"
        ],
        "keywords": [
          "api",
          "endpoint",
          "auth",
          "security"
        ],
        "auto_run_on_save": true,
        "debounce_ms": 1000,
        "priority": 5,
        "proactive_actions": [
          "security_pattern_validation_owasp",
          "response_time_check_200ms",
          "sql_injection_detection"
        ]
      },

      "dana-database": {
        "file_patterns": [
          "prisma/schema.prisma",
          "supabase/migrations/*.sql",
          "db/migrations/**/*"
        ],
        "keywords": [
          "database",
          "schema",
          "migration",
          "query"
        ],
        "auto_run_on_save": true,
        "debounce_ms": 2000,
        "priority": 5,
        "proactive_actions": [
          "schema_validation",
          "rls_policy_check",
          "query_performance_analysis"
        ]
      },

      "maria-qa": {
        "file_patterns": [
          "**/*.test.*",
          "**/*.spec.*",
          "**/__tests__/**",
          "tests/**/*"
        ],
        "keywords": [
          "test",
          "spec",
          "coverage",
          "quality"
        ],
        "auto_run_on_save": true,
        "debounce_ms": 500,
        "priority": 10,
        "proactive_actions": [
          "test_coverage_analysis",
          "missing_test_detection",
          "test_quality_validation"
        ]
      },

      "sarah-pm": {
        "file_patterns": [],
        "keywords": [
          "refactor",
          "architecture",
          "design",
          "coordination"
        ],
        "auto_run_on_save": false,
        "priority": 8,
        "proactive_actions": [
          "architecture_validation",
          "dependency_analysis"
        ]
      }
    }
  },

  "versatil.quality_gates": {
    "enforce_on_commit": true,
    "block_on_failure": true,
    "minimum_coverage": 80,
    "maximum_response_time_ms": 200,
    "security_scan": true,
    "accessibility_check": true
  },

  "versatil.performance": {
    "max_concurrent_agents": 3,
    "agent_timeout_ms": 30000,
    "file_watch_debounce_ms": 1000,
    "background_analysis": true
  }
}
```

---

## Part 3: Common Activation Patterns

### Pattern 1: Frontend Development (React/Vue/Angular)

```json
{
  "activation_triggers": {
    "james-frontend": {
      "file_patterns": [
        "src/components/**/*.{tsx,jsx,vue}",
        "src/pages/**/*",
        "app/**/*.tsx"  // Next.js App Router
      ],
      "keywords": ["component", "ui", "style", "layout"],
      "auto_run_on_save": true,
      "proactive_actions": [
        "accessibility_check_wcag",
        "performance_optimization_suggestions",
        "responsive_design_validation"
      ]
    }
  }
}
```

**Triggers:**
- Save any `.tsx`, `.jsx`, `.vue` file in `components/` or `pages/`
- Type keywords: "component", "ui", "style", "layout"

**Actions:**
- Checks WCAG accessibility compliance
- Suggests performance optimizations (memoization, lazy loading)
- Validates responsive design

---

### Pattern 2: Backend API Development

```json
{
  "activation_triggers": {
    "marcus-backend": {
      "file_patterns": [
        "src/api/**/*.ts",
        "routes/**/*.js",
        "controllers/**/*",
        "src/services/**/*"
      ],
      "keywords": ["api", "endpoint", "route", "controller"],
      "auto_run_on_save": true,
      "proactive_actions": [
        "security_pattern_validation_owasp",
        "response_time_check_200ms",
        "sql_injection_detection",
        "rate_limiting_validation"
      ]
    }
  }
}
```

**Triggers:**
- Save any file in `api/`, `routes/`, `controllers/`, `services/`
- Type keywords: "api", "endpoint", "route"

**Actions:**
- OWASP Top 10 security validation
- Response time analysis (target: <200ms)
- SQL injection detection
- Rate limiting enforcement check

---

### Pattern 3: Database Migrations

```json
{
  "activation_triggers": {
    "dana-database": {
      "file_patterns": [
        "prisma/schema.prisma",
        "supabase/migrations/*.sql",
        "db/migrations/**/*.sql",
        "migrations/**/*.ts"
      ],
      "keywords": ["migration", "schema", "database"],
      "auto_run_on_save": true,
      "proactive_actions": [
        "schema_validation",
        "rls_policy_check_supabase",
        "migration_safety_check",
        "index_optimization_suggestions"
      ]
    }
  }
}
```

**Triggers:**
- Save any schema or migration file
- Type keywords: "migration", "schema", "database"

**Actions:**
- Validates schema correctness
- Checks Row-Level Security policies (Supabase)
- Detects dangerous migrations (DROP TABLE, data loss)
- Suggests missing indexes

---

### Pattern 4: Testing & Quality

```json
{
  "activation_triggers": {
    "maria-qa": {
      "file_patterns": [
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}",
        "**/__tests__/**/*",
        "tests/**/*",
        "e2e/**/*"
      ],
      "keywords": ["test", "spec", "coverage", "e2e"],
      "auto_run_on_save": true,
      "priority": 10,
      "proactive_actions": [
        "test_coverage_analysis",
        "missing_test_detection",
        "test_quality_validation",
        "flaky_test_detection"
      ]
    }
  }
}
```

**Triggers:**
- Save any test file
- Type keywords: "test", "spec", "coverage"

**Actions:**
- Analyzes test coverage (target: 80%)
- Detects missing tests for new code
- Validates test quality (assertions, edge cases)
- Identifies flaky tests (inconsistent results)

---

### Pattern 5: Documentation

```json
{
  "activation_triggers": {
    "sarah-pm": {
      "file_patterns": [
        "docs/**/*.md",
        "*.md",
        "README.md"
      ],
      "keywords": ["documentation", "readme", "guide"],
      "auto_run_on_save": true,
      "priority": 3,
      "proactive_actions": [
        "documentation_completeness_check",
        "broken_link_detection",
        "code_example_validation"
      ]
    }
  }
}
```

**Triggers:**
- Save any Markdown file
- Type keywords: "documentation", "readme"

**Actions:**
- Checks documentation completeness
- Detects broken links
- Validates code examples (runs them)

---

## Part 4: Advanced Customization

### Custom Agent Activation (Domain-Specific)

**Example: E-commerce Project**

```json
{
  "activation_triggers": {
    "ecommerce-specialist": {
      "file_patterns": [
        "src/cart/**/*",
        "src/checkout/**/*",
        "src/payment/**/*",
        "src/inventory/**/*"
      ],
      "keywords": [
        "cart",
        "checkout",
        "payment",
        "stripe",
        "inventory"
      ],
      "auto_run_on_save": true,
      "priority": 7,
      "proactive_actions": [
        "pci_compliance_check",
        "inventory_consistency_validation",
        "cart_abandonment_prevention",
        "payment_error_handling"
      ]
    }
  }
}
```

---

### Conditional Activation

**Example: Only activate in specific branches**

```json
{
  "activation_triggers": {
    "experimental-agent": {
      "file_patterns": ["**/*"],
      "auto_run_on_save": true,
      "conditions": {
        "git_branch": ["feature/*", "experimental/*"],
        "exclude_git_branch": ["main", "production"]
      }
    }
  }
}
```

---

### Time-Based Activation

**Example: Performance testing only during off-hours**

```json
{
  "activation_triggers": {
    "performance-tester": {
      "file_patterns": ["src/**/*"],
      "auto_run_on_save": true,
      "conditions": {
        "time_range": {
          "start": "18:00",
          "end": "08:00",
          "timezone": "America/New_York"
        }
      }
    }
  }
}
```

---

### Contextual Activation

**Example: Different behavior in monorepo**

```json
{
  "activation_triggers": {
    "james-frontend": {
      "contexts": [
        {
          "name": "web-app",
          "root": "packages/web",
          "file_patterns": ["src/**/*.tsx"],
          "priority": 5
        },
        {
          "name": "mobile-app",
          "root": "packages/mobile",
          "file_patterns": ["src/**/*.tsx"],
          "priority": 8,
          "proactive_actions": ["mobile_performance_check"]
        }
      ]
    }
  }
}
```

---

## Part 5: Fine-Tuning Behavior

### Debounce Configuration

Control how quickly agents activate after file changes.

```json
{
  "activation_triggers": {
    "james-frontend": {
      "debounce_ms": 1000  // Wait 1s after last change
    },
    "maria-qa": {
      "debounce_ms": 500   // Activate faster for tests
    },
    "dana-database": {
      "debounce_ms": 2000  // Wait longer for migrations
    }
  }
}
```

**Guidelines:**
- **Fast (<500ms):** Testing, linting
- **Medium (500-1500ms):** Code analysis, suggestions
- **Slow (>1500ms):** Database migrations, heavy analysis

---

### Priority Configuration

Control which agent runs first when multiple match.

```json
{
  "activation_triggers": {
    "maria-qa": { "priority": 10 },      // Highest (always first)
    "sarah-pm": { "priority": 8 },       // High
    "james-frontend": { "priority": 5 }, // Medium
    "marcus-backend": { "priority": 5 }, // Medium
    "dana-database": { "priority": 5 },  // Medium
    "alex-ba": { "priority": 3 }         // Lower
  }
}
```

**Priority Levels:**
- **10:** Critical (QA, security)
- **8-9:** High importance (architecture, PM)
- **5-7:** Normal (specialists)
- **1-4:** Low priority (documentation, refactoring)

---

### Background Analysis

Control whether agents run silently or show progress.

```json
{
  "versatil.performance": {
    "background_analysis": true,  // Agents run silently
    "show_progress": false,       // No notifications
    "notify_on_issues_only": true // Only alert if problems found
  }
}
```

**Use Cases:**
- **background: true** - Silent monitoring, minimal distraction
- **background: false** - See all agent activity (debugging)

---

## Part 6: Troubleshooting

### Issue 1: Agents Not Activating

**Symptoms:**
- Save file, no agent activation
- Type keywords, no suggestions

**Diagnosis:**
```bash
# Check daemon status
npx @versatil/sdlc-framework status

# Expected: ✅ Daemon running (PID: 12345)
# If not running, start daemon:
npx @versatil/sdlc-framework start --daemon
```

**Check Configuration:**
```bash
# Validate .cursorrules syntax
npx @versatil/sdlc-framework validate cursorrules

# Validate settings.json
npx @versatil/sdlc-framework validate settings
```

**Check Logs:**
```bash
# View daemon logs
tail -f ~/.versatil/logs/daemon.log

# Look for errors like:
# - "Pattern match failed"
# - "Agent activation blocked"
# - "Configuration error"
```

---

### Issue 2: Too Many Activations

**Symptoms:**
- Agents activate on every keystroke
- IDE feels slow
- Notifications overwhelming

**Solution: Increase Debounce**
```json
{
  "versatil.performance": {
    "file_watch_debounce_ms": 2000,  // Wait 2s after last change
    "min_change_size": 10            // Ignore small edits (<10 chars)
  }
}
```

**Solution: Disable Background Analysis**
```json
{
  "versatil.performance": {
    "background_analysis": false,     // Only on explicit save
    "notify_on_issues_only": true     // Reduce notifications
  }
}
```

---

### Issue 3: Wrong Agent Activating

**Symptoms:**
- James activates for backend files
- Marcus activates for frontend files

**Solution: Review File Patterns**
```bash
# Show which patterns match a file
npx @versatil/sdlc-framework pattern-match src/api/users.ts

# Expected output:
# ✓ marcus-backend (matched: "src/api/**/*.ts")
# ✗ james-frontend (no match)
```

**Fix Configuration:**
```json
{
  "marcus-backend": {
    "file_patterns": [
      "src/api/**/*.ts",    // Specific path
      "!src/api/types.ts"   // Exclude types (not API endpoints)
    ]
  }
}
```

---

### Issue 4: Performance Impact

**Symptoms:**
- IDE lag when saving files
- High CPU usage
- Battery drain

**Solution: Optimize Performance**
```json
{
  "versatil.performance": {
    "max_concurrent_agents": 2,       // Limit parallel execution
    "agent_timeout_ms": 10000,        // Shorter timeout (10s)
    "background_analysis": false,     // Only on explicit save
    "cache_agent_results": true,      // Cache for 5 minutes
    "exclude_patterns": [
      "node_modules/**",
      "dist/**",
      ".git/**",
      "*.log"
    ]
  }
}
```

---

## Part 7: Real-World Examples

### Example 1: Solo Developer (Lean Setup)

**Goals:**
- Minimal configuration
- Fast activation
- Focus on code quality

```json
{
  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "activation_triggers": {
      "james-frontend": {
        "file_patterns": ["src/**/*.tsx"],
        "auto_run_on_save": true,
        "debounce_ms": 500
      },
      "maria-qa": {
        "file_patterns": ["**/*.test.*"],
        "auto_run_on_save": true,
        "priority": 10
      }
    }
  },
  "versatil.quality_gates": {
    "minimum_coverage": 70,  // Lower for solo (less time)
    "block_on_failure": false // Warn, don't block
  }
}
```

---

### Example 2: Enterprise Team (Strict Quality)

**Goals:**
- Comprehensive coverage
- Strict quality gates
- Team pattern sharing

```json
{
  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "activation_triggers": {
      "james-frontend": { /* Full config */ },
      "marcus-backend": { /* Full config */ },
      "dana-database": { /* Full config */ },
      "maria-qa": { "priority": 10 },
      "sarah-pm": { "priority": 8 },
      "alex-ba": { "priority": 5 }
    }
  },
  "versatil.quality_gates": {
    "minimum_coverage": 90,      // High for enterprise
    "block_on_failure": true,    // Strict enforcement
    "security_scan": true,
    "accessibility_check": true,
    "performance_check": true
  },
  "versatil.rag": {
    "enable_team_learning": true,
    "share_patterns": true,
    "teamId": "enterprise-team-alpha"
  }
}
```

---

### Example 3: Startup (Speed Priority)

**Goals:**
- Fast iteration
- Minimal friction
- Flexible quality

```json
{
  "versatil.proactive_agents": {
    "enabled": true,
    "auto_activation": true,
    "activation_triggers": {
      "james-frontend": { "debounce_ms": 1500 },
      "marcus-backend": { "debounce_ms": 1500 }
    }
  },
  "versatil.quality_gates": {
    "minimum_coverage": 50,       // Lower threshold
    "block_on_failure": false,    // Warn only
    "enforce_on_commit": false,   // Only on push
    "enforce_on_push": true
  },
  "versatil.performance": {
    "background_analysis": true,  // Don't interrupt flow
    "notify_on_issues_only": true
  }
}
```

---

## Part 8: Testing Your Configuration

### Test Command
```bash
# Dry-run activation
npx @versatil/sdlc-framework test-activation \
  --file "src/components/Button.tsx" \
  --dry-run

# Expected output:
# Matched Agents:
#   ✓ james-frontend (pattern: "src/components/**/*.tsx", priority: 5)
# Actions:
#   ✓ accessibility_check_wcag
#   ✓ performance_optimization_suggestions
# Estimated time: 3-5 seconds
```

### Interactive Testing
```bash
# Start interactive test mode
npx @versatil/sdlc-framework test-interactive

# Follow prompts:
# 1. Select agent to test
# 2. Provide sample file/code
# 3. See activation in real-time
```

---

## Success Criteria

**Configuration Working When:**
- ✅ Agents activate within 2 seconds of save
- ✅ Correct agent activates for each file type
- ✅ No excessive activations (not on every keystroke)
- ✅ IDE remains responsive (<1% CPU for monitoring)
- ✅ Quality gates enforce standards consistently
- ✅ Background analysis runs without interruption

---

## Next Steps

1. **Start Simple** - Use default configuration first
2. **Observe Patterns** - See which agents activate naturally
3. **Customize Gradually** - Add patterns as needs arise
4. **Share with Team** - Commit configuration to git
5. **Iterate** - Refine based on team feedback

**Related Guides:**
- [OPTION-2-PROJECT-SETUP.md](./OPTION-2-PROJECT-SETUP.md) - Initial setup
- [OPTION-3-WORKFLOW-DEMO.md](./OPTION-3-WORKFLOW-DEMO.md) - See auto-activation in action
- [OPTION-4-INTELLIGENCE-TESTS.md](./OPTION-4-INTELLIGENCE-TESTS.md) - Validate behavior

---

**Congratulations! You now understand automatic activation patterns. Customize to perfection and enjoy zero-command development. ⚡**
