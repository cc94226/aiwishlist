/**
 * 用户认证状态管理 composable
 * 提供用户登录、注册、登出等功能的状态管理
 */

import { ref, computed } from 'vue'
import {
  getCurrentUser,
  login,
  register,
  logout as logoutService,
  isAdmin
} from '../services/authService'

// 全局用户状态
const currentUser = ref(getCurrentUser())

/**
 * 用户认证 composable
 * @returns {Object} 认证相关的状态和方法
 */
export function useAuth() {
  // 计算属性：是否已登录
  const isAuthenticated = computed(() => {
    return currentUser.value !== null
  })

  // 计算属性：是否为管理员
  const isUserAdmin = computed(() => {
    return isAdmin()
  })

  // 登录方法
  const handleLogin = async (email, password) => {
    const result = login(email, password)
    if (result.success) {
      currentUser.value = result.user
      return { success: true, message: result.message }
    }
    return { success: false, message: result.message }
  }

  // 注册方法
  const handleRegister = async (name, email, password, job) => {
    const result = register(name, email, password, job)
    if (result.success) {
      currentUser.value = result.user
      return { success: true, message: result.message, errors: result.errors }
    }
    return { success: false, message: result.message, errors: result.errors }
  }

  // 登出方法
  const handleLogout = () => {
    logoutService()
    currentUser.value = null
  }

  // 刷新用户状态
  const refreshUser = () => {
    currentUser.value = getCurrentUser()
  }

  return {
    // 状态
    currentUser: computed(() => currentUser.value),
    isAuthenticated,
    isUserAdmin,
    // 方法
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser
  }
}
