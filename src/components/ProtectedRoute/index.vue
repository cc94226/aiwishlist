<template>
  <div v-if="isAuthorized">
    <slot />
  </div>
  <div v-else class="unauthorized-container">
    <div class="unauthorized-content">
      <div class="unauthorized-icon">🔒</div>
      <h2 class="unauthorized-title">访问受限</h2>
      <p class="unauthorized-message">{{ unauthorizedMessage }}</p>
      <div class="unauthorized-actions">
        <button v-if="!isAuthenticated" class="btn-login" @click="handleLogin">前往登录</button>
        <button class="btn-home" @click="handleGoHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, isAdmin } from '../../services/authService'

/**
 * 受保护的路由组件
 * 提供细粒度的权限控制，支持角色权限、功能权限等
 */
export default {
  name: 'ProtectedRoute',
  props: {
    /** 是否需要登录 */
    requireAuth: {
      type: Boolean,
      default: false
    },
    /** 是否需要管理员权限 */
    requireAdmin: {
      type: Boolean,
      default: false
    },
    /** 允许的角色列表 */
    allowedRoles: {
      type: Array,
      default: () => []
    },
    /** 允许的岗位列表 */
    allowedJobs: {
      type: Array,
      default: () => []
    },
    /** 未授权时的提示消息 */
    unauthorizedMessage: {
      type: String,
      default: ''
    }
  },
  computed: {
    /** 当前用户 */
    currentUser() {
      return getCurrentUser()
    },
    /** 是否已登录 */
    isAuthenticated() {
      return !!this.currentUser
    },
    /** 是否已授权 */
    isAuthorized() {
      // 如果不需要任何权限，直接允许访问
      if (
        !this.requireAuth &&
        !this.requireAdmin &&
        this.allowedRoles.length === 0 &&
        this.allowedJobs.length === 0
      ) {
        return true
      }

      // 如果需要登录但用户未登录，拒绝访问
      if (this.requireAuth && !this.isAuthenticated) {
        return false
      }

      // 如果需要管理员权限但用户不是管理员，拒绝访问
      if (this.requireAdmin && !isAdmin()) {
        return false
      }

      // 如果指定了允许的角色列表，检查用户角色
      if (this.allowedRoles.length > 0) {
        const userRole = this.currentUser?.role || 'user'
        if (!this.allowedRoles.includes(userRole)) {
          return false
        }
      }

      // 如果指定了允许的岗位列表，检查用户岗位
      if (this.allowedJobs.length > 0) {
        const userJob = this.currentUser?.job
        if (!userJob || !this.allowedJobs.includes(userJob)) {
          return false
        }
      }

      return true
    },
    /** 未授权提示消息 */
    unauthorizedMessageComputed() {
      if (this.unauthorizedMessage) {
        return this.unauthorizedMessage
      }

      if (!this.isAuthenticated) {
        return '此页面需要登录后才能访问，请先登录。'
      }

      if (this.requireAdmin && !isAdmin()) {
        return '此页面需要管理员权限才能访问。'
      }

      if (this.allowedRoles.length > 0) {
        return `此页面仅限以下角色访问：${this.allowedRoles.join('、')}`
      }

      if (this.allowedJobs.length > 0) {
        return `此页面仅限以下岗位访问：${this.allowedJobs.join('、')}`
      }

      return '您没有权限访问此页面。'
    }
  },
  methods: {
    /** 处理登录 */
    handleLogin() {
      this.$router.push({
        name: 'Login',
        query: { redirect: this.$route.fullPath }
      })
    },
    /** 返回首页 */
    handleGoHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.unauthorized-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.unauthorized-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.unauthorized-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.unauthorized-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.unauthorized-message {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.unauthorized-actions {
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
  background-color: #2c3e50;
  color: white;
}

.btn-login:hover {
  background-color: #34495e;
}

.btn-home {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-home:hover {
  background-color: #bdc3c7;
}

@media (max-width: 768px) {
  .unauthorized-content {
    padding: 1.5rem;
  }

  .unauthorized-icon {
    font-size: 3rem;
  }

  .unauthorized-title {
    font-size: 1.25rem;
  }

  .unauthorized-actions {
    flex-direction: column;
  }

  .btn-login,
  .btn-home {
    width: 100%;
  }
}
</style>
