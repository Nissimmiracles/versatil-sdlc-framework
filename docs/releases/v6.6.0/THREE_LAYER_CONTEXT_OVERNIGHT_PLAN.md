# 🌙 Three-Layer Context System - Overnight Implementation Plan

**Date**: 2025-10-22
**Status**: Ready for Overnight Implementation
**Tasks**: 15 (1 completed, 14 remaining)

---

## ✅ Completed Tasks (1/15)

### Task 1: ProjectVisionManager ✅
**File**: `src/project/project-vision-manager.ts` (CREATED)
**Status**: COMPLETE
**Features Implemented**:
- Store/retrieve project vision (mission, market, goals, values)
- Track project events (features, decisions, milestones)
- Store market analysis
- Query project history timeline
- JSONL-based event/decision logging
- Milestone tracking

---

## 📋 Remaining Tasks (14/15)

### Phase 1: Project Context (4 tasks remaining)

#### Task 2: Extend MultiProjectManager
**File**: `src/isolation/multi-project-manager.ts`
**Action**: ADD
**Changes**:
```typescript
import { projectVisionManager, ProjectVision, ProjectHistory } from '../project/project-vision-manager.js';

interface ProjectContext {
  // ... existing fields
  vision?: ProjectVision;           // NEW
  history?: ProjectHistory;         // NEW
  marketContext?: MarketAnalysis;   // NEW
}

class MultiProjectManager {
  // NEW METHODS:
  async storeProjectVision(projectId: string, vision: Partial<ProjectVision>)
  async getProjectVision(projectId: string): Promise<ProjectVision | null>
  async getProjectHistory(projectId: string): Promise<ProjectHistory>
  async trackProjectEvent(projectId: string, event: Omit<ProjectEvent, 'id' | 'timestamp'>)
}
```

#### Task 3: Project History Tracking System
**File**: `src/project/project-history-tracker.ts` (NEW)
**Purpose**: Automatic event tracking when agents complete work
**Features**:
- Auto-track when agents complete features
- Auto-track architecture decisions
- Integration with agent completion hooks
- Timeline visualization

#### Task 4: Sarah-PM Integration
**File**: `src/agents/opera/sarah-pm/sarah-sdk-agent.ts`
**Action**: MODIFY
**Changes**:
```typescript
import { projectVisionManager } from '../../../project/project-vision-manager.js';

class SarahPM {
  // NEW METHOD:
  async generateAndStoreProjectVision(projectId: string): Promise<ProjectVision> {
    // 1. Generate vision document from template
    // 2. Store via projectVisionManager
    // 3. Return stored vision
  }

  // MODIFY EXISTING:
  async activate(context) {
    // Query vision when coordinating
    const vision = await projectVisionManager.getVision(projectId);
    // Use vision to guide decisions
  }
}
```

#### Task 5: Migration Script
**File**: `scripts/migrate-project-context.cjs` (NEW)
**Purpose**: Migrate existing projects to new structure
**Actions**:
- Create vision.json for existing projects
- Create history.jsonl
- Migrate data from .versatil-project.json

---

### Phase 2: User/Team Context (7 tasks remaining)

#### Task 6: UserContextManager
**File**: `src/user/user-context-manager.ts` (NEW)
**Interface**:
```typescript
export interface UserContext {
  userId: string;
  email?: string;
  preferences: UserCodingPreferences;
  agentMemories: Map<string, any>;
  teams: string[];
}

export interface UserCodingPreferences {
  indentation: 'tabs' | 'spaces';
  indentSize: number;
  naming: 'camelCase' | 'snake_case';
  commentStyle: 'jsdoc' | 'inline' | 'minimal';
  testFramework: 'jest' | 'vitest' | 'mocha';
}

export class UserContextManager {
  async createUser(userId: string, preferences?: Partial<UserCodingPreferences>)
  async getUserContext(userId: string): Promise<UserContext>
  async updatePreferences(userId: string, prefs: Partial<UserCodingPreferences>)
}
```
**Storage**: `~/.versatil/users/[user-id]/preferences.json`

#### Task 7: TeamContextManager
**File**: `src/team/team-context-manager.ts` (NEW)
**Interface**:
```typescript
export interface TeamContext {
  teamId: string;
  name: string;
  members: TeamMember[];
  conventions: TeamConventions;
}

export interface TeamConventions {
  codeStyle: 'airbnb' | 'google' | 'standard';
  commitStyle: 'conventional' | 'angular';
  branchingStrategy: 'gitflow' | 'github-flow';
}

export class TeamContextManager {
  async createTeam(teamId: string, name: string)
  async getTeamContext(teamId: string): Promise<TeamContext>
  async updateConventions(teamId: string, conventions)
}
```
**Storage**: `~/.versatil/teams/[team-id]/conventions.json`

#### Task 8: Coding Style Detector
**File**: `src/user/coding-style-detector.ts` (NEW)
**Purpose**: Auto-detect user's coding style from their commits
**Features**:
- Analyze indentation (tabs vs spaces)
- Detect naming conventions
- Infer comment style
- Suggest preferences

#### Task 9: Per-User Agent Memories
**File**: `src/user/user-agent-memory-store.ts` (NEW)
**Purpose**: Privacy-isolated agent memories per user
**Structure**:
```
~/.versatil/users/[user-id]/memories/
  ├── maria-qa/testing-preferences.md
  ├── james-frontend/component-patterns.md
  └── marcus-backend/api-patterns.md
```

#### Task 10: Context Priority Resolver
**File**: `src/context/context-priority-resolver.ts` (NEW)
**Purpose**: Merge contexts with priority system
**Priority**: User > Team > Project > Framework
**Implementation**:
```typescript
export class ContextPriorityResolver {
  async resolveContext(userId, teamId, projectId): Promise<ResolvedContext> {
    const framework = await graphRAGStore.query(...);
    const project = await projectVisionManager.getVision(projectId);
    const team = await teamContextManager.getTeamContext(teamId);
    const user = await userContextManager.getUserContext(userId);

    // Merge with priority: User overrides Team overrides Project overrides Framework
    return this.merge(framework, project, team, user);
  }
}
```

#### Task 11: Agent Integration (All 6 OPERA Agents)
**Files**:
- `src/agents/opera/maria-qa/enhanced-maria.ts`
- `src/agents/opera/james-frontend/enhanced-james.ts`
- `src/agents/opera/marcus-backend/enhanced-marcus.ts`
- `src/agents/opera/sarah-pm/sarah-sdk-agent.ts`
- `src/agents/opera/alex-ba/alex-ba.ts`
- `src/agents/opera/dr-ai-ml/dr-ai-ml.ts`

**Changes for Each**:
```typescript
import { contextPriorityResolver } from '../../../context/context-priority-resolver.js';

async activate(context: AgentActivationContext): Promise<AgentResponse> {
  // 1. Resolve context
  const resolved = await contextPriorityResolver.resolveContext(
    context.userId,
    context.teamId,
    context.projectId
  );

  // 2. Apply user preferences
  const code = this.generateCode(resolved.userPreferences);

  // 3. Respect team conventions
  // 4. Align with project vision
  // 5. Use framework patterns
}
```

#### Task 12: Update GraphRAG
**File**: `src/lib/graphrag-store.ts`
**Changes**:
```typescript
interface PatternNode {
  // ... existing
  userId?: string;    // NEW: Pattern owner
  teamId?: string;    // NEW: Team scope
  privacy: 'private' | 'team' | 'public';  // NEW
}

class GraphRAGStore {
  // NEW METHODS:
  async queryUserPatterns(userId: string, query: string)
  async queryTeamPatterns(teamId: string, query: string)
  async storeUserPattern(userId: string, pattern: any)
}
```

---

### Phase 3: Testing & Documentation (3 tasks)

#### Task 13: Test Suite
**File**: `tests/integration/three-layer-context.test.ts` (NEW)
**Tests**:
- User context CRUD
- Team context CRUD
- Project context storage
- Context priority resolution
- Privacy isolation
- Agent integration

#### Task 14: Documentation
**File**: `docs/THREE_LAYER_CONTEXT_SYSTEM.md` (NEW)
**Contents**:
- Architecture overview
- Layer 1: Framework (GraphRAG)
- Layer 2: Project (vision, history)
- Layer 3: User/Team (preferences, conventions)
- API reference
- Usage examples

#### Task 15: End-to-End Test
**File**: `scripts/test-three-layer-context.cjs` (NEW)
**Workflow**:
1. Create user with tab preference
2. Create team with space convention
3. Verify user's tabs override team's spaces
4. Test agent uses correct context

---

## 📂 Final File Structure

```
~/.versatil/
  ├── users/
  │   └── [user-id]/
  │       ├── preferences.json
  │       └── memories/
  │           ├── maria-qa/
  │           ├── james-frontend/
  │           └── marcus-backend/
  │
  ├── teams/
  │   └── [team-id]/
  │       ├── conventions.json
  │       ├── members.json
  │       └── decisions.jsonl
  │
  ├── projects/
  │   └── [project-id]/
  │       ├── rag/
  │       ├── vision.json              ✅ (structure ready)
  │       ├── history.jsonl            ✅ (structure ready)
  │       ├── market-context.json      ✅ (structure ready)
  │       └── milestones.json          ✅ (structure ready)
  │
  └── learning/patterns/                ✅ (GraphRAG exists)
```

---

## 🎯 Implementation Order

**Tonight's Work**:
1. ✅ Task 1: ProjectVisionManager (DONE)
2. Tasks 2-5: Complete Phase 1 (Project Context)
3. Tasks 6-12: Complete Phase 2 (User/Team Context)
4. Tasks 13-15: Testing & Documentation

**Estimated Time**: 10-13 hours

---

## 🚀 Expected Results

### Morning Summary Report
**File**: `docs/THREE_LAYER_CONTEXT_IMPLEMENTATION_COMPLETE.md`

**Will Include**:
- Implementation summary (all 15 tasks)
- Test results
- Usage examples
- Breaking changes (if any)
- Migration instructions

### Example Workflow (After Implementation)
```typescript
// User A (prefers tabs, verbose comments) asks:
"Add user authentication"

// Context resolved:
{
  framework: "JWT patterns (GraphRAG)",
  project: "Security-first SaaS vision",
  team: "Use Conventional Commits",
  user: "Use tabs, verbose comments"  // HIGHEST PRIORITY
}

// Generated code for User A:
function authenticateUser() {
	// Verbose: Validates credentials and returns JWT
	const token = generateJWT(user);
	return token;
}

// User B (prefers spaces, minimal comments) → Different output:
function authenticateUser() {
  const token = generateJWT(user);
  return token;
}
```

---

## 📊 Progress Tracking

Check overnight progress:
```bash
# View implementation log
tail -f ~/.versatil/logs/overnight-implementation.log

# Check completed tasks
cat docs/THREE_LAYER_CONTEXT_IMPLEMENTATION_COMPLETE.md
```

---

**Sleep well! The three-layer context system will be ready when you wake up.** 🌙✨
