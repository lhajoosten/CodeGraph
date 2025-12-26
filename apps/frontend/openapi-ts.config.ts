import {defineConfig} from '@hey-api/openapi-ts';

const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';
const specUrl = process.env.VITE_API_SPEC_URL || `${apiUrl}/openapi.json`;

export default defineConfig({
    input: specUrl,
    output: {
        path: "src/openapi",
        format: "prettier",
        lint: "eslint",
    },
    plugins: [
        {
            name: '@hey-api/client-axios',
            baseUrl: apiUrl, // Base URL without /api/v1 - paths include it
        },
        '@hey-api/schemas',
        'zod',
        {
            enums: 'javascript',
            name: '@hey-api/typescript',
        },
        {
            name: "@hey-api/sdk",
            asClass: false,
            auth: false,
        },
        {
            name: "@tanstack/react-query",
            "~hooks": {
                operations: {
                    isMutation(op) {
                        if (op.path === "/tracker/message/stream") {
                            return false;
                        }
                    },
                },
            },
        },
    ],
    types: {
        enums: 'javascript',
    },
});
