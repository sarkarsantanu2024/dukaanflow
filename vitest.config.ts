import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests only: pure functions, no database. Nothing here may import a
// module that queries Prisma at load time.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
