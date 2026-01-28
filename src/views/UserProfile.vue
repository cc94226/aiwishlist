<template>
  <div class="user-profile">
    <h2>用户信息</h2>
    <div v-if="currentUser" class="profile-card">
      <div class="profile-info">
        <div class="info-row">
          <label>用户名：</label>
          <span>{{ currentUser.name }}</span>
        </div>
        <div class="info-row">
          <label>角色：</label>
          <span>{{ currentUser.role === 'admin' ? '管理员' : '普通用户' }}</span>
        </div>
        <div class="info-row">
          <label>邮箱：</label>
          <span>{{ currentUser.email || '未设置' }}</span>
        </div>
        <div class="info-row">
          <label>岗位：</label>
          <select v-model="userJob" class="job-select" @change="updateJob">
            <option value="">请选择岗位</option>
            <option value="开发">开发</option>
            <option value="设计">设计</option>
            <option value="行政">行政</option>
            <option value="产品">产品</option>
            <option value="运营">运营</option>
            <option value="测试">测试</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-logout" @click="logout">退出登录</button>
      </div>
    </div>
    <div v-else class="no-user">
      <p>未登录</p>
      <router-link to="/" class="link">返回首页</router-link>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, setCurrentUser, logout as logoutService } from '../services/authService'

export default {
  name: 'UserProfile',
  data() {
    return {
      currentUser: null,
      userJob: ''
    }
  },
  mounted() {
    this.loadUser()
  },
  methods: {
    loadUser() {
      this.currentUser = getCurrentUser()
      if (this.currentUser) {
        this.userJob = this.currentUser.job || ''
      }
    },
    updateJob() {
      if (this.currentUser) {
        this.currentUser.job = this.userJob
        setCurrentUser(this.currentUser)
        alert('岗位信息已更新！现在可以在愿望详情页查看匹配度分析了。')
      }
    },
    logout() {
      logoutService()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.user-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 0;
}

.user-profile h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.profile-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-row label {
  font-weight: 500;
  color: #555;
  min-width: 80px;
}

.info-row span {
  color: #2c3e50;
}

.job-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.job-select:focus {
  outline: none;
  border-color: #2c3e50;
}

.profile-actions {
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.btn-logout {
  padding: 0.75rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-logout:hover {
  background-color: #c0392b;
}

.no-user {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-user p {
  font-size: 1.25rem;
  color: #999;
  margin-bottom: 1rem;
}

.link {
  color: #2c3e50;
  text-decoration: underline;
}
</style>
