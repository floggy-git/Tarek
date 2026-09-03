import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/arabic-persian-reshaper') || id.includes('node_modules/canvg') || id.includes('node_modules/dompurify')) {
              return 'jspdf-vendor';
            }
            if (id.includes('node_modules/html2canvas') || id.includes('node_modules/html2canvas-pro') || id.includes('node_modules/html-to-image')) {
              return 'html2canvas-vendor';
            }
            if (id.includes('node_modules/leaflet')) {
              return 'leaflet-vendor';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@phosphor-icons')) {
              return 'icons-vendor';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
