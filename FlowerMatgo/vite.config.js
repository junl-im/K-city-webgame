import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Managed Sites preview is hosted through this named development host.
    allowedHosts: ['terminal.local']
  }
});
