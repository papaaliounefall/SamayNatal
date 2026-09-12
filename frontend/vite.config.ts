import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Docker Desktop's bind mount doesn't forward native filesystem events
      // into the container on Windows/macOS, so chokidar's default watcher
      // never fires and Vite keeps serving stale cached modules — fall back
      // to polling there (see IN_DOCKER in docker-compose.yml).
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : process.env.IN_DOCKER === 'true'
            ? { usePolling: true, interval: 300 }
            : {},
    },
  };
});
