import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const trainerScheduleVisualFix = {
  name: 'trainer-schedule-visual-fix',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.endsWith('/src/components/TrainerDashboard.tsx')) return null;

    const timeInputClass = 'w-full h-11 px-3.5 text-xs font-extrabold text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono';
    const repairedClass = `box-border min-w-0 max-w-full ${timeInputClass}`;

    let next = code.replace(timeInputClass, repairedClass);
    next = next.replace(timeInputClass, repairedClass);

    return next === code ? null : { code: next, map: null };
  },
};

export default defineConfig(() => {
  return {
    base: process.env.GITHUB_ACTIONS === 'true' ? '/Al-Andalos-Rijschool-V2/' : '/',
    plugins: [trainerScheduleVisualFix, react(), tailwindcss()],
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
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
