import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import scraper from './scripts/scraper.mjs';
import cve from './scripts/cve.mjs';

export default defineConfig({
  plugins: [react(), scraper(), cve()],
});
