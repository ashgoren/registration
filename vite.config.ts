/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    react()
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      src: "/src",
      config: "/src/config",
      components: "/src/components",
      shared: "/src/components/shared",
      hooks: "/src/hooks",
      contexts: "/src/contexts",
      lib: "/src/lib",
      services: "/src/services",
      utils: "/src/utils",
      themes: "/src/themes",
      templates: "/src/templates",
      types: "/src/types",
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom', // default: jsdom
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [],
    }
  }  
})
