import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure the build is optimized for production
    minify: 'terser',
  },
  resolve: {
    dedupe: ['three']
  }
});
