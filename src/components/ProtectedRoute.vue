<template>
  <slot v-if="hasAccess" />
  <div v-else class="protected-route-error">
    <div class="error-content">
      <h2>🔒 访问受限</h2>
      <p>{{ displayErrorMessage }}</p>
      <div class="error-actions">
        <button v-if="!isAuthenticated" class="btn-login" @click="goToLogin">前往登录</button>
        <button class="btn-home" @click="goToHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, isAdmin } from '../services/authService'

export default {
  name: 'ProtectedRoute',
  props: {
    // 是否需要登录
    requireAuth: {
      type: Boolean,
      default: false
    },
    // 是否需要管理员权限
    requireAdmin: {
      type: Boolean,
      default: false
    },
    // 自定义错误消息
    errorMessage: {
      type: String,
      default: ''
    },
    // 重定向路径（未授权时）
    redirectTo: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const router = useRouter()

    // 检查用户是否已登录
    const isAuthenticated = computed(() => {
      return !!getCurrentUser()
    })

    // 检查用户是否为管理员
    const userIsAdmin = computed(() => {
      return isAdmin()
    })

    // 检查是否有访问权限
    const hasAccess = computed(() => {
      // 如果需要管理员权限
      if (props.requireAdmin) {
        return isAuthenticated.value && userIsAdmin.value
      }

      // 如果需要登录
      if (props.requireAuth) {
        return isAuthenticated.value
      }

      // 默认允许访问
      return true
    })

    // 生成错误消息
    const displayErrorMessage = computed(() => {
      if (props.errorMessage) {
        return props.errorMessage
      }

      if (props.requireAdmin && !userIsAdmin.value) {
        return '此页面需要管理员权限才能访问。'
      }

      if (props.requireAuth && !isAuthenticated.value) {
        return '此页面需要登录后才能访问。'
      }

      return '您没有权限访问此页面。'
    })

    // 跳转到登录页
    const goToLogin = () => {
      const redirect = router.currentRoute.value.fullPath
      router.push({
        name: 'Login',
        query: { redirect }
      })
    }

    // 跳转到首页
    const goToHome = () => {
      if (props.redirectTo) {
        router.push(props.redirectTo)
      } else {
        router.push({ name: 'Home' })
      }
    }

    return {
      isAuthenticated,
      userIsAdmin,
      hasAccess,
      displayErrorMessage,
      goToLogin,
      goToHome
    }
  }
}
</script>

<style scoped>
.protected-route-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
  background-color: #f5f5f5;
}

.error-content {
  max-width: 500px;
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-content h2 {
  color: #e74c3c;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-content p {
  color: #555;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-login,
.btn-home {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-login {
  background-color: #3498db;
  color: white;
}

.btn-login:hover {
  background-color: #2980b9;
}

.btn-home {
  background-color: #95a5a6;
  color: white;
}

.btn-home:hover {
  background-color: #7f8c8d;
}

@media (max-width: 768px) {
  .error-content {
    padding: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-login,
  .btn-home {
    width: 100%;
  }
}
</style>
