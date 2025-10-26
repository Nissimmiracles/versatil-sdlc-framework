#!/usr/bin/env tsx
/**
 * {{HOOK_NAME}} - {{HOOK_DESCRIPTION}}
 *
 * Performance: <{{MAX_TIME}}ms execution time
 * Trigger: {{TRIGGER_CONDITION}}
 */

import fs from 'fs';
import path from 'path';

interface HookInput {
  {{INPUT_FIELD_1}}: {{INPUT_TYPE_1}};
  {{INPUT_FIELD_2}}: {{INPUT_TYPE_2}};
  {{INPUT_FIELD_3}}?: {{INPUT_TYPE_3}};
}

/**
 * {{HELPER_1_DESC}}
 */
function {{HELPER_1_NAME}}({{HELPER_1_PARAMS}}): {{HELPER_1_RETURN}} {
  try {
    {{HELPER_1_IMPLEMENTATION}}
    return {{HELPER_1_RESULT}};
  } catch (error) {
    // Fail gracefully - log and continue
    console.error(`{{HELPER_1_NAME}} failed:`, error);
    return {{HELPER_1_FALLBACK}};
  }
}

/**
 * {{HELPER_2_DESC}}
 */
function {{HELPER_2_NAME}}({{HELPER_2_PARAMS}}): {{HELPER_2_RETURN}} {
  {{HELPER_2_IMPLEMENTATION}}
}

async function main() {
  try {
    // Read input from stdin
    const input: HookInput = JSON.parse(
      fs.readFileSync(process.stdin.fd, 'utf-8')
    );

    // Validate input
    if (!input.{{INPUT_FIELD_1}}) {
      process.exit(0); // Exit silently if no input
    }

    // {{MAIN_LOGIC_STEP_1}}
    const {{RESULT_1}} = await {{HELPER_1_NAME}}({{CALL_PARAMS_1}});

    // {{MAIN_LOGIC_STEP_2}}
    const {{RESULT_2}} = {{HELPER_2_NAME}}({{CALL_PARAMS_2}});

    // Exit if nothing to inject
    if (!{{RESULT_1}} && !{{RESULT_2}}) {
      process.exit(0);
    }

    // Log to stderr for user visibility
    if ({{RESULT_1}}) {
      console.error(`\n{{LOG_PREFIX_1}} ${{{LOG_VAR_1}}}`);
      console.error(`  {{LOG_MESSAGE_1}}`);
    }

    if ({{RESULT_2}}) {
      console.error(`\n{{LOG_PREFIX_2}} ${{{LOG_VAR_2}}}`);
      console.error(`  {{LOG_MESSAGE_2}}`);
    }

    console.error('');

    // Output result to stdout (JSON)
    const output = {
      role: 'system',
      content: `{{OUTPUT_CONTENT_TEMPLATE}}`
    };

    console.log(JSON.stringify(output));

  } catch (error) {
    // Fail gracefully - never throw errors in hooks
    console.error('{{HOOK_NAME}} error:', error);
  }

  process.exit(0);
}

main();
