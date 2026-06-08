import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    target: 'es2022'
  },
  server: {
    port: 8765,
    strictPort: false
  }
});
