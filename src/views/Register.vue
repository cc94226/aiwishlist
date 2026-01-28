<template>
  <div class="register-page">
    <div class="register-container">
      <h2>用户注册</h2>
      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">姓名：</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="请输入姓名"
            required
            class="form-input"
            :class="{ 'input-error': errors.name }"
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>
        <div class="form-group">
          <label for="email">邮箱：</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            required
            class="form-input"
            :class="{ 'input-error': errors.email }"
          />
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>
        <div class="form-group">
          <label for="password">密码：</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            required
            minlength="6"
            class="form-input"
            :class="{ 'input-error': errors.password }"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认密码：</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
            class="form-input"
            :class="{ 'input-error': errors.confirmPassword }"
          />
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>
        <div class="form-group">
          <label for="job">岗位（可选）：</label>
          <select id="job" v-model="formData.job" class="form-input">
            <option value="">请选择岗位</option>
            <option value="开发">开发</option>
            <option value="设计">设计</option>
            <option value="产品">产品</option>
            <option value="运营">运营</option>
            <option value="行政">行政</option>
            <option value="测试">测试</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="form-footer">
          <p>
            已有账号？
            <router-link to="/login" class="link">立即登录</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { register } from '../services/authService'

export default {
  name: 'Register',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        job: ''
      },
      errors: {},
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
    validateForm() {
      this.errors = {}
      let isValid = true

      // 验证姓名
      if (!this.formData.name.trim()) {
        this.errors.name = '请输入姓名'
        isValid = false
      } else if (this.formData.name.trim().length < 2) {
        this.errors.name = '姓名至少2个字符'
        isValid = false
      }

      // 验证邮箱
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.formData.email.trim()) {
        this.errors.email = '请输入邮箱'
        isValid = false
      } else if (!emailRegex.test(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址'
        isValid = false
      }

      // 验证密码
      if (!this.formData.password) {
        this.errors.password = '请输入密码'
        isValid = false
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码至少6个字符'
        isValid = false
      }

      // 验证确认密码
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码'
        isValid = false
      } else if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }

      return isValid
    },
    async handleRegister() {
      this.errorMessage = ''
      this.errors = {}

      if (!this.validateForm()) {
        return
      }

      this.loading = true

      try {
        const result = register(
          this.formData.name.trim(),
          this.formData.email.trim(),
          this.formData.password,
          this.formData.job || undefined
        )

        if (result.success) {
          // 注册成功，跳转到首页
          this.$router.push('/')
        } else {
          this.errorMessage = result.message || '注册失败，请稍后重试'
          if (result.errors) {
            result.errors.forEach(error => {
              if (error.includes('邮箱')) {
                this.errors.email = error
              }
            })
          }
        }
      } catch (error) {
        this.errorMessage = '注册时发生错误，请稍后重试'
        console.error('Register error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem 0;
}

.register-container {
  background: white;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-container h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  text-align: center;
}

.register-form {
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

.form-input.input-error {
  border-color: #c33;
}

.error-text {
  color: #c33;
  font-size: 0.85rem;
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
