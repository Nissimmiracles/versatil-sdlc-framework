#!/usr/bin/env tsx
/**
 * Context Injection - Bash Executable Wrapper
 *
 * Loads and merges context from the three-layer context system:
 * User Preferences > Team Conventions > Project Vision > Framework Defaults
 *
 * Usage:
 *   npx tsx execute-context-loader.ts \
 *     --layer user \
 *     --userId "user-123"
 *
 *   npx tsx execute-context-loader.ts \
 *     --layer all \
 *     --merge true
 */

import * as fs from 'fs';
import * as path from 'path';

interface CLIArgs {
  layer: 'user' | 'team' | 'project' | 'all';
  userId?: string;
  merge?: boolean;
}

interface ContextLayer {
  layer: string;
  priority: number;
  data: any;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    layer: 'all',
    merge: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--layer' && args[i + 1]) {
      parsed.layer = args[i + 1] as any;
      i++;
    } else if (arg === '--userId' && args[i + 1]) {
      parsed.userId = args[i + 1];
      i++;
    } else if (arg === '--merge' && args[i + 1]) {
      parsed.merge = args[i + 1] === 'true';
      i++;
    }
  }

  return parsed;
}

function loadUserContext(userId?: string): ContextLayer | null {
  try {
    const versatilDir = path.join(process.env.HOME || '', '.versatil');
    const userProfile = userId
      ? path.join(versatilDir, 'users', userId, 'profile.json')
      : path.join(versatilDir, 'users', 'default', 'profile.json');

    if (!fs.existsSync(userProfile)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(userProfile, 'utf-8'));

    return {
      layer: 'user',
      priority: 1, // Highest priority
      data
    };
  } catch (error) {
    return null;
  }
}

function loadTeamContext(): ContextLayer | null {
  try {
    const teamConventions = path.join(process.cwd(), '.versatil', 'team-conventions.json');

    if (!fs.existsSync(teamConventions)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(teamConventions, 'utf-8'));

    return {
      layer: 'team',
      priority: 2,
      data
    };
  } catch (error) {
    return null;
  }
}

function loadProjectContext(): ContextLayer | null {
  try {
    const projectVision = path.join(process.cwd(), '.versatil', 'project-vision.json');

    if (!fs.existsSync(projectVision)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(projectVision, 'utf-8'));

    return {
      layer: 'project',
      priority: 3,
      data
    };
  } catch (error) {
    return null;
  }
}

function mergeContexts(layers: ContextLayer[]): any {
  // Sort by priority (lower number = higher priority)
  const sorted = layers.sort((a, b) => a.priority - b.priority);

  // Merge from lowest to highest priority (user wins)
  const merged = {};

  for (const layer of sorted.reverse()) {
    Object.assign(merged, layer.data);
  }

  // Reverse back and apply proper priority (user overrides all)
  const final = {};
  for (const layer of sorted) {
    Object.assign(final, layer.data);
  }

  return final;
}

async function main() {
  try {
    const args = parseArgs();
    const layers: ContextLayer[] = [];

    if (args.layer === 'user' || args.layer === 'all') {
      const userContext = loadUserContext(args.userId);
      if (userContext) layers.push(userContext);
    }

    if (args.layer === 'team' || args.layer === 'all') {
      const teamContext = loadTeamContext();
      if (teamContext) layers.push(teamContext);
    }

    if (args.layer === 'project' || args.layer === 'all') {
      const projectContext = loadProjectContext();
      if (projectContext) layers.push(projectContext);
    }

    const result = args.merge
      ? {
          merged_context: mergeContexts(layers),
          layers_loaded: layers.map(l => l.layer),
          total_layers: layers.length,
          priority_order: ['user', 'team', 'project']
        }
      : {
          contexts: layers,
          total_layers: layers.length
        };

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contexts: [],
      total_layers: 0
    }, null, 2));
    process.exit(1);
  }
}

main();
