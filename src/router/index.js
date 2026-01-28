import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SubmitWish from '../views/SubmitWish.vue'
import WishDetail from '../views/WishDetail.vue'
import AdminPanel from '../views/AdminPanel.vue'
import UserProfile from '../views/UserProfile.vue'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import { requireAuth, requireAdmin, redirectIfAuthenticated } from './guards'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/submit',
    name: 'SubmitWish',
    component: SubmitWish
  },
  {
    path: '/wish/:id',
    name: 'WishDetail',
    component: WishDetail
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    beforeEnter: requireAdmin // 需要管理员权限
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile,
    beforeEnter: requireAuth // 需要登录
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: requireAuth // 需要登录
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: redirectIfAuthenticated // 如果已登录则重定向
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    beforeEnter: redirectIfAuthenticated // 如果已登录则重定向
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
