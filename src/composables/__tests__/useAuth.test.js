/**
 * useAuth composable 测试用例
 * 测试用户认证状态管理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuth } from '../useAuth'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(() => null),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  isAdmin: vi.fn(() => false)
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // 重置mock返回值
    authService.getCurrentUser.mockReturnValue(null)
    authService.isAdmin.mockReturnValue(false)
  })

  describe('isAuthenticated 计算属性', () => {
    it('未登录时应该返回false', () => {
      authService.getCurrentUser.mockReturnValue(null)
      const { isAuthenticated, refreshUser } = useAuth()
      refreshUser() // 刷新状态
      expect(isAuthenticated.value).toBe(false)
    })

    it('已登录时应该返回true', () => {
      const mockUser = { id: 'user-1', name: '测试用户' }
      authService.getCurrentUser.mockReturnValue(mockUser)
      const { isAuthenticated, refreshUser } = useAuth()
      refreshUser() // 刷新状态
      expect(isAuthenticated.value).toBe(true)
    })
  })

  describe('isUserAdmin 计算属性', () => {
    it('非管理员用户应该返回false', () => {
      authService.isAdmin.mockReturnValue(false)
      const { isUserAdmin } = useAuth()
      expect(isUserAdmin.value).toBe(false)
    })

    it('管理员用户应该返回true', () => {
      authService.isAdmin.mockReturnValue(true)
      const { isUserAdmin } = useAuth()
      expect(isUserAdmin.value).toBe(true)
    })
  })

  describe('login 方法', () => {
    it('应该成功登录并更新用户状态', async () => {
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

      const { login } = useAuth()
      const result = await login('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('登录成功')
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('登录失败时应该返回错误信息', async () => {
      authService.login.mockReturnValue({
        success: false,
        message: '邮箱或密码错误'
      })

      const { login } = useAuth()
      const result = await login('wrong@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.message).toBe('邮箱或密码错误')
    })
  })

  describe('register 方法', () => {
    it('应该成功注册并自动登录', async () => {
      const mockUser = {
        id: 'user-2',
        name: '新用户',
        email: 'new@example.com'
      }
      authService.register.mockReturnValue({
        success: true,
        user: mockUser,
        message: '注册成功'
      })

      const { register } = useAuth()
      const result = await register('新用户', 'new@example.com', 'password123', '开发')

      expect(result.success).toBe(true)
      expect(result.message).toBe('注册成功')
      expect(authService.register).toHaveBeenCalledWith(
        '新用户',
        'new@example.com',
        'password123',
        '开发'
      )
    })

    it('注册失败时应该返回错误信息', async () => {
      authService.register.mockReturnValue({
        success: false,
        message: '该邮箱已被注册',
        errors: ['邮箱已存在']
      })

      const { register } = useAuth()
      const result = await register('用户', 'existing@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.message).toBe('该邮箱已被注册')
      expect(result.errors).toEqual(['邮箱已存在'])
    })
  })

  describe('logout 方法', () => {
    it('应该调用logout服务', () => {
      const { logout } = useAuth()
      logout()
      expect(authService.logout).toHaveBeenCalled()
    })
  })

  describe('refreshUser 方法', () => {
    it('应该调用getCurrentUser刷新状态', () => {
      const mockUser = { id: 'user-1', name: '用户1' }
      authService.getCurrentUser.mockReturnValue(mockUser)

      const { refreshUser } = useAuth()
      refreshUser()

      expect(authService.getCurrentUser).toHaveBeenCalled()
    })
  })
})
