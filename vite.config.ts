/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { writeFileSync } from 'fs';
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    react(),
    {
      name: 'export-config',
      configureServer(server) {
        server.ssrLoadModule('./src/config/index.tsx').then(({ config }) => {
          writeFileSync('tests/configGenerated.json', JSON.stringify(config, null, 2));
        });
      }
    },
    {
      name: 'robots-txt',
      apply: 'build',
      writeBundle() {
        // public/robots.txt ships as a safe default that blocks all crawling;
        // only real production builds get the permissive version.
        if (process.env.VITE_ENV === 'prd') {
          writeFileSync('dist/robots.txt', 'User-agent: *\nDisallow:\n');
        }
      }
    }
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
