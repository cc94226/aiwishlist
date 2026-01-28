/**
 * 路由守卫配置
 * 提供路由保护功能，用于控制哪些路由需要登录才能访问
 */

import { getCurrentUser, isAdmin } from '../services/authService'

/**
 * 路由守卫：检查用户是否已登录
 * @param {Object} to - 目标路由
 * @param {Object} from - 来源路由
 * @param {Function} next - 路由跳转函数
 */
export function requireAuth(to, from, next) {
  const currentUser = getCurrentUser()

  if (currentUser) {
    // 用户已登录，允许访问
    next()
  } else {
    // 用户未登录，跳转到登录页
    next({
      name: 'Login',
      query: { redirect: to.fullPath } // 保存原始路径，登录后可以跳转回来
    })
  }
}

/**
 * 路由守卫：检查用户是否为管理员
 * @param {Object} to - 目标路由
 * @param {Object} from - 来源路由
 * @param {Function} next - 路由跳转函数
 */
export function requireAdmin(to, from, next) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    // 用户未登录，跳转到登录页
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (isAdmin()) {
    // 用户是管理员，允许访问
    next()
  } else {
    // 用户不是管理员，跳转到首页并显示错误提示
    next({
      name: 'Home',
      query: { error: 'unauthorized' }
    })
  }
}

/**
 * 路由守卫：如果已登录则重定向到首页（用于登录/注册页）
 * @param {Object} to - 目标路由
 * @param {Object} from - 来源路由
 * @param {Function} next - 路由跳转函数
 */
export function redirectIfAuthenticated(to, from, next) {
  const currentUser = getCurrentUser()

  if (currentUser) {
    // 用户已登录，跳转到首页
    next({ name: 'Home' })
  } else {
    // 用户未登录，允许访问登录/注册页
    next()
  }
}
