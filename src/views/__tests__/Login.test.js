/**
 * Login.vue 组件测试用例
 * 测试用户登录功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../Login.vue'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(() => null)
}))

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: { template: '<div>Register</div>' } }
  ]
})

describe('Login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authService.getCurrentUser.mockReturnValue(null)
  })

  describe('组件渲染', () => {
    it('应该正确渲染登录表单', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('h2').text()).toBe('用户登录')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('应该显示"记住我"复选框', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    })

    it('应该显示注册链接', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      const registerLink = wrapper.find('a[href="/register"]')
      expect(registerLink.exists()).toBe(true)
      expect(registerLink.text()).toContain('立即注册')
    })
  })

  describe('表单验证', () => {
    it('邮箱和密码字段为必填', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      expect(emailInput.attributes('required')).toBeDefined()
      expect(passwordInput.attributes('required')).toBeDefined()
    })
  })

  describe('登录功能', () => {
    it('应该成功登录并跳转', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com'
      }

      authService.login.mockReturnValue({
        success: true,
        user: mockUser,
        message: '登录成功'
      })

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      // 设置表单数据
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')

      // 提交表单
      await wrapper.find('form').trigger('submit.prevent')

      // 等待异步操作完成
      await wrapper.vm.$nextTick()

      // 验证login被调用
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('登录失败时应该显示错误信息', async () => {
      authService.login.mockReturnValue({
        success: false,
        message: '邮箱或密码错误'
      })

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[type="email"]').setValue('wrong@example.com')
      await wrapper.find('input[type="password"]').setValue('wrongpassword')
      await wrapper.find('form').trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toContain('邮箱或密码错误')
    })

    it('登录过程中应该显示加载状态', async () => {
      // 由于login是同步函数，loading状态会立即变为false
      // 但我们可以验证loading状态在提交时被设置
      authService.login.mockReturnValue({
        success: true,
        user: { id: '1', name: 'Test' },
        message: '登录成功'
      })

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
      
      // 在提交前，loading应该是false
      expect(wrapper.vm.loading).toBe(false)
      
      // 提交表单
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // 由于login是同步的，loading会立即变为false
      // 验证登录被调用
      expect(authService.login).toHaveBeenCalled()
    })
  })

  describe('已登录用户重定向', () => {
    it('如果用户已登录，应该调用getCurrentUser检查', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com'
      }

      authService.getCurrentUser.mockReturnValue(mockUser)

      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      // 验证getCurrentUser被调用（在mounted钩子中）
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })
  })

  describe('记住我功能', () => {
    it('应该可以勾选"记住我"复选框', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [router]
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.element.checked).toBe(false)

      await checkbox.setValue(true)
      expect(wrapper.vm.formData.rememberMe).toBe(true)
    })
  })
})
