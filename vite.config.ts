import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/VectorStudio/',           // <-- IMPORTANT for GitHub Pages project sites
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
