<template>
  <div id="app">
    <nav class="navbar">
      <div class="container">
        <h1 class="logo">AI工具需求愿望收集平台</h1>
        <div class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/submit">提交愿望</router-link>
          <router-link v-if="currentUser" to="/admin">管理面板</router-link>
          <template v-if="currentUser">
            <router-link to="/dashboard">仪表板</router-link>
            <router-link to="/profile">用户信息</router-link>
            <span class="user-name">{{ currentUser.name }}</span>
            <button class="btn-logout-nav" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login">登录</router-link>
            <router-link to="/register">注册</router-link>
          </template>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { getCurrentUser, logout } from './services/authService'

export default {
  name: 'App',
  data() {
    return {
      currentUser: null
    }
  },
  mounted() {
    this.loadUser()
    // 监听路由变化，更新用户状态
    this.$watch(
      () => this.$route.path,
      () => {
        this.loadUser()
      }
    )
  },
  methods: {
    loadUser() {
      this.currentUser = getCurrentUser()
    },
    handleLogout() {
      logout()
      this.currentUser = null
      this.$router.push('/')
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  background-color: #34495e;
}

.user-name {
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-logout-nav {
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.btn-logout-nav:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}
</style>
