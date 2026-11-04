import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발할 때는 npm run dev:server로 서버를 함께 켠다. 수업에서는 npm start만 쓴다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/ws': { target: 'ws://localhost:3000', ws: true } },
  },
});
