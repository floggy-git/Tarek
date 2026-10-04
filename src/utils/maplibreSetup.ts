import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Vite must bundle the v6 worker and its imports, including on GitHub Pages.
// Without this, markers appear but vector streets and route lines stay blank.
setWorkerUrl(workerUrl);
