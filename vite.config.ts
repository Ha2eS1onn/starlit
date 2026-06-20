import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 自定义域名部署在根路径，base 设为 '/'
  base: '/',
})