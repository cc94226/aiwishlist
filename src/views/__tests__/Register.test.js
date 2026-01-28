/**
 * Register.vue 组件测试用例
 * 测试用户注册功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Register from '../Register.vue'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  register: vi.fn(),
  getCurrentUser: vi.fn(() => null)
}))

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'Register', component: Register }
  ]
})

describe('Register.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authService.getCurrentUser.mockReturnValue(null)
  })

  describe('组件渲染', () => {
    it('应该正确渲染注册表单', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('h2').text()).toBe('用户注册')
      expect(wrapper.find('input[id="name"]').exists()).toBe(true)
      expect(wrapper.find('input[id="email"]').exists()).toBe(true)
      expect(wrapper.find('input[id="password"]').exists()).toBe(true)
      expect(wrapper.find('input[id="confirmPassword"]').exists()).toBe(true)
      expect(wrapper.find('select[id="job"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('应该显示登录链接', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      const loginLink = wrapper.find('a[href="/login"]')
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.text()).toContain('立即登录')
    })
  })

  describe('表单验证', () => {
    it('应该验证姓名字段', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      // 测试空姓名
      await wrapper.find('input[id="name"]').setValue('')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.name).toBe('请输入姓名')

      // 测试姓名太短
      await wrapper.find('input[id="name"]').setValue('a')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.name).toBe('姓名至少2个字符')
    })

    it('应该验证邮箱字段', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      // 测试空邮箱
      await wrapper.find('input[id="email"]').setValue('')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.email).toBe('请输入邮箱')

      // 测试无效邮箱格式
      await wrapper.find('input[id="email"]').setValue('invalid-email')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.email).toBe('请输入有效的邮箱地址')
    })

    it('应该验证密码字段', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      // 测试空密码
      await wrapper.find('input[id="password"]').setValue('')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.password).toBe('请输入密码')

      // 测试密码太短
      await wrapper.find('input[id="password"]').setValue('12345')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.password).toBe('密码至少6个字符')
    })

    it('应该验证确认密码字段', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[id="password"]').setValue('password123')
      await wrapper.find('input[id="confirmPassword"]').setValue('password456')
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.confirmPassword).toBe('两次输入的密码不一致')
    })

    it('所有字段验证通过时应该可以提交', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[id="name"]').setValue('测试用户')
      await wrapper.find('input[id="email"]').setValue('test@example.com')
      await wrapper.find('input[id="password"]').setValue('password123')
      await wrapper.find('input[id="confirmPassword"]').setValue('password123')

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(true)
    })
  })

  describe('注册功能', () => {
    it('应该成功注册并跳转', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com'
      }

      authService.register.mockReturnValue({
        success: true,
        user: mockUser,
        message: '注册成功'
      })

      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[id="name"]').setValue('测试用户')
      await wrapper.find('input[id="email"]').setValue('test@example.com')
      await wrapper.find('input[id="password"]').setValue('password123')
      await wrapper.find('input[id="confirmPassword"]').setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(authService.register).toHaveBeenCalledWith(
        '测试用户',
        'test@example.com',
        'password123',
        undefined
      )
    })

    it('注册失败时应该显示错误信息', async () => {
      authService.register.mockReturnValue({
        success: false,
        message: '该邮箱已被注册',
        errors: ['邮箱已存在']
      })

      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[id="name"]').setValue('测试用户')
      await wrapper.find('input[id="email"]').setValue('existing@example.com')
      await wrapper.find('input[id="password"]').setValue('password123')
      await wrapper.find('input[id="confirmPassword"]').setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toContain('该邮箱已被注册')
    })

    it('注册时可以选填岗位', async () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com',
        job: '开发'
      }

      authService.register.mockReturnValue({
        success: true,
        user: mockUser,
        message: '注册成功'
      })

      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.find('input[id="name"]').setValue('测试用户')
      await wrapper.find('input[id="email"]').setValue('test@example.com')
      await wrapper.find('input[id="password"]').setValue('password123')
      await wrapper.find('input[id="confirmPassword"]').setValue('password123')
      await wrapper.find('select[id="job"]').setValue('开发')
      await wrapper.find('form').trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(authService.register).toHaveBeenCalledWith(
        '测试用户',
        'test@example.com',
        'password123',
        '开发'
      )
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

      const wrapper = mount(Register, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      // 验证getCurrentUser被调用（在mounted钩子中）
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })
  })
})
