import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initDefaultAdmin } from './services/authService'

// 初始化默认管理员（仅用于演示）
initDefaultAdmin()

const app = createApp(App)
app.use(router)
app.mount('#app')
