import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // 🔴 REMOVED firebase-messaging-sw build entry - blocks OTP delivery
      // build: {
      //   rollupOptions: {
      //     input: {
      //       main: path.resolve(__dirname, 'index.html'),
      //       'firebase-messaging-sw': path.resolve(__dirname, 'src/firebase-messaging-sw.ts'),
      //     },
      //     output: {
      //       entryFileNames: (chunkInfo) =>
      //         chunkInfo.name === 'firebase-messaging-sw'
      //           ? 'firebase-messaging-sw.js'
      //           : 'assets/[name]-[hash].js',
      //     },
      //   },
      // },
    };
});
