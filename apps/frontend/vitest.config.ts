import path from "path"
import {fileURLToPath} from "url"
import {defineConfig} from "vitest/config"
import react from "@vitejs/plugin-react"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "dist/",
            ],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
