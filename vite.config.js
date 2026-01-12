import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Use local spark build from lib directory
      '@sparkjsdev/spark': path.resolve(__dirname, './lib/spark.module.js'),
    },
  },
  server: {
    port: 3001,
    host: true,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
