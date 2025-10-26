#!/usr/bin/env tsx
/**
 * Template Matcher Script
 *
 * Matches feature descriptions to proven templates.
 *
 * Usage:
 *   npx tsx execute-template-matcher.ts \
 *     --description "Add user authentication" \
 *     --template "auth-system"
 */

import { templateMatcher } from '../../../../src/templates/template-matcher.js';

interface CLIArgs {
  description: string;
  template?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    description: ''
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--description' && args[i + 1]) {
      parsed.description = args[i + 1];
      i++;
    } else if (arg === '--template' && args[i + 1]) {
      parsed.template = args[i + 1];
      i++;
    }
  }

  return parsed;
}

async function main() {
  try {
    const args = parseArgs();

    if (!args.description) {
      throw new Error('Missing required argument: --description');
    }

    const result = await templateMatcher.matchTemplate({
      description: args.description,
      explicit_template: args.template
    });

    const output = {
      best_match: result.best_match ? {
        name: result.best_match.template_name,
        score: result.best_match.match_score,
        base_effort_hours: result.best_match.estimated_effort?.hours || 0,
        categories: result.best_match.categories || []
      } : null,
      all_matches: result.all_matches?.map(m => ({
        name: m.template_name,
        score: m.match_score,
        base_effort_hours: m.estimated_effort?.hours || 0
      })) || [],
      use_template: result.use_template,
      explicit_override: !!args.template
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      best_match: null,
      all_matches: [],
      use_template: false,
      explicit_override: false
    }, null, 2));
    process.exit(1);
  }
}

main();
