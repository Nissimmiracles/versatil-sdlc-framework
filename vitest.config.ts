import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Keep the CommonJS AST collector external to Vitest's config bundler.
const loadPartition = createRequire(import.meta.url);
const runnerPartition = loadPartition('./tests/ci/runner-partition.cjs');
const repoRoot = dirname(fileURLToPath(import.meta.url));
const partition = runnerPartition.collectRunnerPartition(repoRoot);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run tests in single thread to avoid resource exhaustion
      }
    },
    testTimeout: process.env.CI ? 30000 : 15000, // Longer timeout in CI (30s) vs local (15s)
    hookTimeout: process.env.CI ? 30000 : 15000, // Increased hook timeout to match test timeout
    teardownTimeout: 10000, // Cleanup timeout
    // The partition guard reports unknown/mixed suites; it never drops them silently.
    include: partition.byRunner.vitest,
    exclude: ['node_modules', 'dist', '.claude'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/.claude/**',
        '**/types/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(repoRoot, './src'),
    },
  },
});
