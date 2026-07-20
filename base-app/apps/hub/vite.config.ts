/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@pch/api-client': resolvePath('../../libs/api-client/src/index.ts'),
      '@pch/domain': resolvePath('../../libs/domain/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
  define: {
    'import.meta.vitest': false,
  },
});
