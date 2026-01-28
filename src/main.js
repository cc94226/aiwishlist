import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initDefaultAdmin } from './services/authService'
import { setupGlobalErrorHandling } from './utils/errorHandler'
import './styles/responsive.css'

// 初始化默认管理员（仅用于演示）
initDefaultAdmin()

const app = createApp(App)

// 设置全局错误处理（传入router以支持路由错误处理）
setupGlobalErrorHandling(app, router)

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  // 在开发环境中显示警告
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue警告:', msg, trace)
  }
}

app.use(router)
app.mount('#app')
