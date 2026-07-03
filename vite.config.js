import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  base: './',  // 相对路径，适配 Chrome 扩展的嵌套目录
  server: {
    port: 5173,
    proxy: {
      // Analytics Worker 代理（开发环境）
      '/api/analytics': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
