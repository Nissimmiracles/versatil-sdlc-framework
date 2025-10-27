/**
 * VERSATIL SDLC Framework - Context Identity Detection
 * Enables framework self-enhancement without context contamination
 *
 * Detects whether code is running in:
 * - Framework Development Mode (working ON VERSATIL)
 * - User Project Mode (working WITH VERSATIL)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface ContextIdentity {
  role: 'framework-developer' | 'framework-user';
  intent: 'enhance-framework' | 'build-with-framework';
  audience: 'opera-team' | 'opera-customers';
  boundary: 'framework-internals' | 'customer-project';
  projectPath: string;
  isolation: {
    ragNamespace: string;
    learnStorage: string;
    blockedPatterns: string[];
    allowedPatterns: string[];
    allowedAgents: string[];
    blockedAgents: string[];
  };
}

/**
 * Detect context identity from project characteristics
 */
export async function detectContextIdentity(workingDir: string): Promise<ContextIdentity> {
  // Method 1: Git remote detection (most reliable for framework dev)
  const isFrameworkDev = await isFrameworkDevelopment(workingDir);

  if (isFrameworkDev) {
    return createFrameworkDevIdentity(workingDir);
  }

  // Method 2: Package.json dependency check
  const isUserProject = await hasVERSATILDependency(workingDir);

  if (isUserProject) {
    return createUserProjectIdentity(workingDir);
  }

  // Fallback: Default to user-project mode (most restrictive)
  console.warn(`[context-identity] Unable to determine context for ${workingDir} - defaulting to user-project mode (safest)`);
  return createUserProjectIdentity(workingDir);
}

/**
 * Check if working directory is VERSATIL framework repository
 */
async function isFrameworkDevelopment(workingDir: string): Promise<boolean> {
  try {
    // Check 1: Git remote contains versatil-sdlc-framework
    const gitRemote = execSync('git remote -v', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    if (gitRemote.includes('versatil-sdlc-framework')) {
      return true;
    }

    // Check 2: Presence of framework marker files
    const frameworkMarkers = [
      '.claude/agents/',
      'src/agents/core/agent-registry.ts',
      'src/flywheel/sdlc-orchestrator.ts',
      'src/mcp/versatil-mcp-server-v2.ts'
    ];

    const hasMarkers = frameworkMarkers.every(marker =>
      existsSync(join(workingDir, marker))
    );

    if (hasMarkers) {
      return true;
    }

    // Check 3: package.json name field
    const packageJsonPath = join(workingDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name === '@versatil/sdlc-framework') {
        return true;
      }
    }

    return false;
  } catch (error) {
    // Git command failed or no git repo
    return false;
  }
}

/**
 * Check if project has VERSATIL as a dependency
 */
async function hasVERSATILDependency(workingDir: string): Promise<boolean> {
  try {
    const packageJsonPath = join(workingDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return false;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };

    return '@versatil/sdlc-framework' in allDeps;
  } catch (error) {
    return false;
  }
}

/**
 * Create framework development identity
 */
function createFrameworkDevIdentity(workingDir: string): ContextIdentity {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '~';

  return {
    role: 'framework-developer',
    intent: 'enhance-framework',
    audience: 'opera-team',
    boundary: 'framework-internals',
    projectPath: workingDir,
    isolation: {
      ragNamespace: join(homeDir, '.versatil-global', 'framework-dev'),
      learnStorage: join(homeDir, '.versatil-global', 'framework-dev', 'learning'),

      // Framework dev can access framework files + shared cross-project patterns
      allowedPatterns: [
        `${workingDir}/src/**`,
        `${workingDir}/.claude/**`,
        `${workingDir}/docs/**`,
        `${workingDir}/scripts/**`,
        `${homeDir}/.versatil-global/framework-dev/**`,
        `${homeDir}/.versatil-global/cross-project/**`
      ],

      // Framework dev CANNOT access customer project data
      blockedPatterns: [
        `${homeDir}/.versatil-global/projects/**`,
        `${homeDir}/**/node_modules/@versatil/**`,
        `**/project-*/.versatil/**`
      ],

      // Framework dev has access to architecture agents
      allowedAgents: [
        'Sarah-PM',
        'Maria-QA',
        'James-Frontend',
        'Marcus-Backend',
        'Dana-Database',
        'Dr.AI-ML',
        'Alex-BA',
        'Oliver-MCP'
      ],

      // No blocked agents for framework dev
      blockedAgents: []
    }
  };
}

/**
 * Create user project identity
 */
function createUserProjectIdentity(workingDir: string): ContextIdentity {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '~';

  return {
    role: 'framework-user',
    intent: 'build-with-framework',
    audience: 'opera-customers',
    boundary: 'customer-project',
    projectPath: workingDir,
    isolation: {
      ragNamespace: join(workingDir, '.versatil'),
      learnStorage: join(workingDir, '.versatil', 'learning'),

      // User project can access own files + shared patterns + public framework docs
      allowedPatterns: [
        `${workingDir}/**`,
        `${homeDir}/.versatil-global/cross-project/**`,
        `${workingDir}/node_modules/@versatil/sdlc-framework/docs/**`
      ],

      // User project CANNOT access framework internals
      blockedPatterns: [
        `${homeDir}/.versatil-global/framework-dev/**`,
        `**/VERSATIL*/src/**`,
        `**/versatil-sdlc-framework/src/**`
      ],

      // User project has access to customer-facing agents only
      allowedAgents: [
        'Maria-QA',
        'James-Frontend',
        'Marcus-Backend',
        'Dana-Database',
        'Dr.AI-ML',
        'Alex-BA'
      ],

      // Sarah-PM is framework architecture agent (not for customers)
      blockedAgents: [
        'Sarah-PM'
      ]
    }
  };
}

/**
 * Check if path matches any pattern (glob-style)
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Simple glob matching (** = any directory, * = any file)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  });
}

/**
 * Validate if access to target path is allowed from source context
 */
export function validateAccess(
  identity: ContextIdentity,
  targetPath: string
): { allowed: boolean; reason: string } {
  // Check if blocked
  if (matchesPattern(targetPath, identity.isolation.blockedPatterns)) {
    return {
      allowed: false,
      reason: `Access denied: ${targetPath} is blocked for ${identity.role} context`
    };
  }

  // Check if allowed
  if (matchesPattern(targetPath, identity.isolation.allowedPatterns)) {
    return {
      allowed: true,
      reason: 'Access granted'
    };
  }

  // Default deny (zero trust)
  return {
    allowed: false,
    reason: `Access denied: ${targetPath} is not in allowed patterns for ${identity.role} context`
  };
}

/**
 * Validate if agent invocation is allowed in current context
 */
export function validateAgent(
  identity: ContextIdentity,
  agentName: string
): { allowed: boolean; reason: string } {
  // Normalize agent name (remove case sensitivity)
  const normalizedAgent = agentName.toLowerCase().replace(/[-_]/g, '');

  // Check if blocked
  const isBlocked = identity.isolation.blockedAgents.some(blocked =>
    blocked.toLowerCase().replace(/[-_]/g, '').includes(normalizedAgent)
  );

  if (isBlocked) {
    return {
      allowed: false,
      reason: `Agent '${agentName}' is not available in ${identity.role} context`
    };
  }

  // Check if allowed
  const isAllowed = identity.isolation.allowedAgents.some(allowed =>
    allowed.toLowerCase().replace(/[-_]/g, '').includes(normalizedAgent)
  );

  if (isAllowed) {
    return {
      allowed: true,
      reason: 'Agent available'
    };
  }

  // Default deny
  return {
    allowed: false,
    reason: `Agent '${agentName}' is not in allowed list for ${identity.role} context`
  };
}
