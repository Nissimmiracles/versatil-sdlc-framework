#!/usr/bin/env node
'use strict';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: versatil-graph-recovery --project PROJECT_ID --database DATABASE_ID');
    console.log('Local operator console using Application Default Credentials. No automatic purge.');
    return;
  }
  if (args.length !== 4 || args[0] !== '--project' || args[2] !== '--database' || !args[1] || !args[3]) {
    throw new Error('Explicit --project PROJECT_ID --database DATABASE_ID required');
  }
  const target = { projectId: args[1], databaseId: args[3] };
  const { GraphRAGStore } = await import('../dist/lib/graphrag-store.js');
  const { startLocalRecoveryConsole } = await import('../dist/dashboard/graph-recovery-console.js');
  const store = new GraphRAGStore({ storage: target, softDeletion: {} });
  await store.initialize();
  const consoleSession = await startLocalRecoveryConsole({ store, target });
  console.log(`Recovery console for ${target.projectId}/${target.databaseId}: ${consoleSession.url}`);
  console.log(`Open the private launcher in your browser: ${consoleSession.launchPath}`);
  const stop = async () => { await consoleSession.close(); process.exit(0); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}

main().catch(() => {
  console.error('Recovery console could not start. Check explicit target, build, credentials and owner-only file permissions.');
  process.exitCode = 1;
});
