import { createRouter, createWebHistory } from 'vue-router'
import { loadView } from '../utils/lazyLoad'
import { requireAuth, requireAdmin, redirectIfAuthenticated } from './guards'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: loadView('Home') // 懒加载：代码分割
  },
  {
    path: '/submit',
    name: 'SubmitWish',
    component: loadView('SubmitWish') // 懒加载：代码分割
  },
  {
    path: '/wish/:id',
    name: 'WishDetail',
    component: loadView('WishDetail') // 懒加载：代码分割
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: loadView('AdminPanel'), // 懒加载：代码分割
    beforeEnter: requireAdmin // 需要管理员权限
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: loadView('UserProfile'), // 懒加载：代码分割
    beforeEnter: requireAuth // 需要登录
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: loadView('Dashboard'), // 懒加载：代码分割
    beforeEnter: requireAuth // 需要登录
  },
  {
    path: '/login',
    name: 'Login',
    component: loadView('Login'), // 懒加载：代码分割
    beforeEnter: redirectIfAuthenticated // 如果已登录则重定向
  },
  {
    path: '/register',
    name: 'Register',
    component: loadView('Register'), // 懒加载：代码分割
    beforeEnter: redirectIfAuthenticated // 如果已登录则重定向
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
