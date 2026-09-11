import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, './'),
      '@contratos': path.resolve(__dirname, './contratos'),
      '@configuracion': path.resolve(__dirname, './configuracion'),
      '@src': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'window',
  },
});
