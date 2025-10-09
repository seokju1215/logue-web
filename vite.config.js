import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프런트에서 /aladin/* 로 부르면 Vite가 대신 Aladin으로 요청을 중계함
      '/aladin': {
        target: 'https://www.aladin.co.kr',
        changeOrigin: true,
        secure: true,
        // /aladin/ItemSearch.aspx -> /ttb/api/ItemSearch.aspx 로 바꿔 전달
        rewrite: (path) => path.replace(/^\/aladin/, '/ttb/api'),
      },
    },
  },
})
