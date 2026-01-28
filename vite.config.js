import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动配置代码分割策略
        manualChunks: {
          // 将Vue相关库单独打包
          'vue-vendor': ['vue', 'vue-router'],
          // 将工具函数单独打包
          'utils': ['./src/utils/api.js', './src/utils/validation.js', './src/utils/lazyLoad.js']
        },
        // 配置chunk文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 启用代码压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true // 生产环境移除debugger
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成source map（生产环境可关闭以减小文件大小）
    sourcemap: false
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router']
  }
})
