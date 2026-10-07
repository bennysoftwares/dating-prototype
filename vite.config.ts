import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` emits relative asset URLs, so the build works from any
// GitHub Pages repository path (e.g. /<repo>/) without hard-coding the name.
// Routing uses HashRouter, so no server-side rewrites are needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
});
