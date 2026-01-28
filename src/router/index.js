import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SubmitWish from '../views/SubmitWish.vue'
import WishDetail from '../views/WishDetail.vue'
import AdminPanel from '../views/AdminPanel.vue'
import UserProfile from '../views/UserProfile.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

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
    component: AdminPanel
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: UserProfile
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
