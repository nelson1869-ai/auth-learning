import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'], // tumatakbo bago ang bawat test file
    fileParallelism: false, // iisang test database — isang file lang sa isang pagkakataon
  },
});
