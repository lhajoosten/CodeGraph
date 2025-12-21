import path from "path"
import {fileURLToPath} from "url"
import react from "@vitejs/plugin-react"
import {defineConfig} from "vite"
import {tanstackRouter} from "@tanstack/router-vite-plugin";
import {visualizer} from "rollup-plugin-visualizer";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        tanstackRouter({
            disableLogging: true,
        }),
        visualizer({
            open: process.env.ANALYZE === "true",
            filename: "bundle-visualization.html",
            gzipSize: true,
            brotliSize: true,
            template: "sunburst",
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    }, build: {
        sourcemap: true,
        rollupOptions: {
            treeshake: true,
        },
        target: "es2020",
        minify: "terser",
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ["react", "react-dom"],
        exclude: ["@fontsource/roboto"],
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/api": {
                target: "http://backend:8000",
                changeOrigin: true,
            },
        },
    },
})
