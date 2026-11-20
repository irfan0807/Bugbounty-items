import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import scraper from './scripts/scraper.mjs';

export default defineConfig({
  plugins: [react(), scraper()],
});
