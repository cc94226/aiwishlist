<template>
  <div class="login-page">
    <div class="login-container">
      <h2>用户登录</h2>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">邮箱：</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password">密码：</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="formData.rememberMe" type="checkbox" class="checkbox-input" />
            <span>记住我</span>
          </label>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="form-footer">
          <p>
            还没有账号？
            <router-link to="/register" class="link">立即注册</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { login } from '../services/authService'

export default {
  name: 'Login',
  data() {
    return {
      formData: {
        email: '',
        password: '',
        rememberMe: false
      },
      errorMessage: '',
      loading: false
    }
  },
  mounted() {
    // 如果已登录，跳转到首页
    const currentUser = this.getCurrentUser()
    if (currentUser) {
      this.$router.push('/')
    }
  },
  methods: {
    getCurrentUser() {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        return JSON.parse(userStr)
      }
      return null
    },
    async handleLogin() {
      this.errorMessage = ''
      this.loading = true

      try {
        const result = login(this.formData.email, this.formData.password)

        if (result.success) {
          // 登录成功，跳转到redirect参数指定的页面，如果没有则跳转到首页
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
        } else {
          this.errorMessage = result.message || '登录失败，请检查邮箱和密码'
        }
      } catch (error) {
        this.errorMessage = '登录时发生错误，请稍后重试'
        console.error('Login error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem 0;
}

.login-container {
  background: white;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-container h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #2c3e50;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  border: 1px solid #fcc;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #2c3e50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #34495e;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: 1rem;
}

.form-footer p {
  color: #666;
  font-size: 0.9rem;
}

.link {
  color: #2c3e50;
  text-decoration: underline;
  font-weight: 500;
}

.link:hover {
  color: #34495e;
}
</style>
