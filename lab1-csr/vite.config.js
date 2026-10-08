import { defineConfig } from 'vite';

// base 处理：
// - 本地开发 / 根路径部署时为 '/'
// - GitHub Pages 子路径部署时由 CI 注入 GH_PAGES_BASE，例如 '/se3306-exp1/csr/'
export default defineConfig({
  base: process.env.GH_PAGES_BASE || '/',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
