import { defineConfig } from '@hey-api/openapi-ts';

const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const specUrl = process.env.VITE_API_SPEC_URL || `${apiUrl.replace('/api/v1', '')}/openapi.json`;

export default defineConfig({
  input: specUrl,
  output: {
    path: './src/api/generated',
    format: 'prettier',
      lint: 'eslint',
  },
     plugins: [
    '@hey-api/client-fetch',
    '@hey-api/schemas',
    {
      instance: true,
      name: '@hey-api/sdk',
    },
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    '@tanstack/react-query',
  ],
  types: {
    enums: 'javascript',
  },
});
