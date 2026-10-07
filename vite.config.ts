import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves this app from https://<user>.github.io/<repository>/.
 * The deploy workflow sets BASE_PATH=/<repository>/ (e.g. /dating-prototype/) so asset URLs are
 * absolute to that path. Without it, assets use relative paths (`./`), which also work from any
 * folder, so local `npm run build && npm run preview` keeps working.
 *
 * Routing uses HashRouter (`/#/discover`), so refreshing or deep-linking any screen always loads
 * index.html: no server rewrites or 404.html tricks are needed.
 */
export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [react()],
  server: { host: true },
});
