import path from "path"
import {fileURLToPath} from "url"
import react from "@vitejs/plugin-react"
import {defineConfig} from "vite"
import {tanstackRouter} from "@tanstack/router-vite-plugin";
import {visualizer} from "rollup-plugin-visualizer";
import tailwindcss from "@tailwindcss/vite";
import yaml from "@rollup/plugin-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    yaml(),
    tailwindcss(),
    react(),
    tanstackRouter({
      disableLogging: true,
    }),
    visualizer({
      open: process.env.ANALYZE === 'true',
      filename: 'bundle-visualization.html',
      gzipSize: true,
      brotliSize: true,
      template: 'sunburst',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      treeshake: true,
    },
    target: 'es2020',
    minify: 'terser',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      // i18n dependencies
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      // Radix UI components
      '@radix-ui/react-avatar',
      '@radix-ui/react-separator',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      // Radix UI internal dependencies
      '@radix-ui/react-primitive',
      '@radix-ui/react-context',
      '@radix-ui/react-use-callback-ref',
      '@radix-ui/react-use-is-hydrated',
      '@radix-ui/react-use-layout-effect',
      '@radix-ui/react-compose-refs',
      '@radix-ui/react-dismissable-layer',
      '@radix-ui/react-id',
      '@radix-ui/react-popper',
      '@radix-ui/react-portal',
      '@radix-ui/react-presence',
      '@radix-ui/primitive',
      // Icon system
      '@heroicons/react',
      '@iconify/react',
      // Other dependencies
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zod',
      'axios',
      '@tanstack/react-query',
      '@hookform/resolvers',
      'react-hook-form',
      'sonner',
      'zustand',
      'xstate',
      '@xstate/store',
    ],
    exclude: ['@fontsource/roboto'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
});
