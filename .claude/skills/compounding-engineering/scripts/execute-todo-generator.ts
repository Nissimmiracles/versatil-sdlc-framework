#!/usr/bin/env tsx
/**
 * Todo Generator Script
 *
 * Generates dual todo system (TodoWrite + markdown files).
 *
 * Usage:
 *   npx tsx execute-todo-generator.ts \
 *     --specs-json '[{"title":"Setup auth","priority":"p1","assignee":"Marcus-Backend"}]'
 *
 *   npx tsx execute-todo-generator.ts \
 *     --specs-file "todo-specs.json"
 */

import { todoFileGenerator } from '../../../../src/planning/todo-file-generator.js';
import * as fs from 'fs';

interface CLIArgs {
  specsJson?: string;
  specsFile?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--specs-json' && args[i + 1]) {
      parsed.specsJson = args[i + 1];
      i++;
    } else if (arg === '--specs-file' && args[i + 1]) {
      parsed.specsFile = args[i + 1];
      i++;
    }
  }

  return parsed;
}

async function main() {
  try {
    const args = parseArgs();

    let specs;
    if (args.specsJson) {
      specs = JSON.parse(args.specsJson);
    } else if (args.specsFile) {
      const fileContent = fs.readFileSync(args.specsFile, 'utf-8');
      specs = JSON.parse(fileContent);
    } else {
      throw new Error('Missing required argument: --specs-json or --specs-file');
    }

    if (!Array.isArray(specs)) {
      throw new Error('Specs must be an array of TodoFileSpec objects');
    }

    const result = await todoFileGenerator.generateTodos(specs);

    const output = {
      files_created: result.files_created || [],
      todowrite_items: result.todowrite_items || [],
      dependency_graph: result.dependency_graph || '',
      total_estimated_hours: result.total_estimated_hours || 0,
      execution_waves: result.execution_waves || []
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      files_created: [],
      todowrite_items: [],
      dependency_graph: '',
      total_estimated_hours: 0,
      execution_waves: []
    }, null, 2));
    process.exit(1);
  }
}

main();
