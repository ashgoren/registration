/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    react(),
    eslint({
      include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
      emitWarning: true,
      emitError: true
    })
  ],
  resolve: {
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
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom', // default: jsdom
    setupFiles: './src/setupTests.js',
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
