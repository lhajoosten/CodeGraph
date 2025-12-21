import {defineConfig} from '@hey-api/openapi-ts';

const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const specUrl = process.env.VITE_API_SPEC_URL || `${apiUrl.replace('/api/v1', '')}/openapi.json`;

export default defineConfig({
    input: specUrl,
    output: {
        path: "src/openapi",
        format: "prettier",
        lint: "eslint",
    },
    plugins: [
        '@hey-api/client-axios',
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
