import js from '@eslint/js';
      import tseslint from '@typescript-eslint/eslint-plugin';
      import tsparser from '@typescript-eslint/parser';
      import react from 'eslint-plugin-react';
      import reactHooks from 'eslint-plugin-react-hooks';
      import reactRefresh from 'eslint-plugin-react-refresh';
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      const __dirname = dirname(fileURLToPath(import.meta.url));

      export default [
        {
          ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'src/api/generated/**',
            '**/*.gen.ts',
            'openapi-ts.config.ts',
          ],
        },
        js.configs.recommended,
        {
          files: ['**/*.ts', '**/*.tsx'],
          ignores: ['vite.config.ts', 'tailwind.config.js'],
          languageOptions: {
            globals: {
              // Browser globals
              window: 'readonly',
              document: 'readonly',
              navigator: 'readonly',
              fetch: 'readonly',
              btoa: 'readonly',
              atob: 'readonly',
              setTimeout: 'readonly',
              setInterval: 'readonly',
              clearTimeout: 'readonly',
              clearInterval: 'readonly',
              console: 'readonly',
              URL: 'readonly',
              URLSearchParams: 'readonly',
              // Node globals (for vite.config.ts, etc.)
              process: 'readonly',
            },
            parser: tsparser,
            parserOptions: {
              project: ['./tsconfig.json'],
              tsconfigRootDir: __dirname,
              ecmaVersion: 'latest',
              sourceType: 'module',
            },
          },
          plugins: {
            '@typescript-eslint': tseslint,
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
          },
          rules: {
            'react-refresh/only-export-components': [
              'warn',
              { allowConstantExport: true },
            ],
            '@typescript-eslint/no-unused-vars': [
              'error',
              { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            'react/prop-types': 'off',
          },
          settings: {
            react: {
              version: 'detect',
            },
          },
        },
        // Config files (vite and tailwind)
        {
          files: ['vite.config.ts'],
          languageOptions: {
            globals: {
              process: 'readonly',
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
        },
        {
          files: ['tailwind.config.js'],
          languageOptions: {
            globals: {
              module: 'readonly',
              require: 'readonly',
            },
          },
        },
      ];