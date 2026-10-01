
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react()
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
