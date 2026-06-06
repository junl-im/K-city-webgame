import { defineConfig } from 'vite';

export default defineConfig({
  base: '/K-city-webgame/',   // ← 이 부분이 중요합니다!
  server: {
    port: 5173
  }
});
