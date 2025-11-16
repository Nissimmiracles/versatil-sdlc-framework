import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Temporarily disabled - 1,486 warnings (gradual migration)
      '@typescript-eslint/no-non-null-assertion': 'off', // Temporarily disabled - 199 warnings (gradual migration)
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-console': 'off', // Allow console for CLI tools
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
      'eslint.config.js'
    ],
  }
];