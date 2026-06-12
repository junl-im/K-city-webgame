import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    modulePreload: false,
    outDir: 'dist',
    assetsInlineLimit: 4096,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pixi.js') || id.includes('node_modules/@pixi')) return 'pixi-engine';
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase-sdk';
          if (id.includes('/src/game/SolGame') || id.includes('/src/game/SpriteSheetAnimator') || id.includes('/src/game/iso')) return 'field-engine';
          if (id.includes('/src/data/gameData') || id.includes('/src/data/assetManifest')) return 'game-data';
        }
      }
    },
    chunkSizeWarningLimit: 900
  },
  server: {
    port: 8765,
    strictPort: false
  }
});
