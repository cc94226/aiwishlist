/**
 * 路由守卫 guards.js 测试用例
 * 测试路由保护功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { requireAuth, requireAdmin, redirectIfAuthenticated } from '../guards'
import * as authService from '../../services/authService'

// Mock authService
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(() => null),
  isAdmin: vi.fn(() => false)
}))

describe('路由守卫', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('requireAuth 守卫', () => {
    it('用户已登录时应该允许访问', () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com'
      }

      authService.getCurrentUser.mockReturnValue(mockUser)

      const to = { fullPath: '/dashboard' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAuth(to, from, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('用户未登录时应该跳转到登录页', () => {
      authService.getCurrentUser.mockReturnValue(null)

      const to = { fullPath: '/dashboard' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAuth(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/dashboard' }
      })
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('应该保存原始路径到redirect参数', () => {
      authService.getCurrentUser.mockReturnValue(null)

      const to = { fullPath: '/wish/123' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAuth(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/wish/123' }
      })
    })
  })

  describe('requireAdmin 守卫', () => {
    it('管理员用户应该允许访问', () => {
      const mockUser = {
        id: 'admin-1',
        name: '管理员',
        email: 'admin@example.com',
        role: 'admin'
      }

      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.isAdmin.mockReturnValue(true)

      const to = { fullPath: '/admin' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAdmin(to, from, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('普通用户应该跳转到首页并显示错误', () => {
      const mockUser = {
        id: 'user-1',
        name: '普通用户',
        email: 'user@example.com',
        role: 'user'
      }

      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.isAdmin.mockReturnValue(false)

      const to = { fullPath: '/admin' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAdmin(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Home',
        query: { error: 'unauthorized' }
      })
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('未登录用户应该跳转到登录页', () => {
      authService.getCurrentUser.mockReturnValue(null)
      authService.isAdmin.mockReturnValue(false)

      const to = { fullPath: '/admin' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      requireAdmin(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/admin' }
      })
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  describe('redirectIfAuthenticated 守卫', () => {
    it('已登录用户应该跳转到首页', () => {
      const mockUser = {
        id: 'user-1',
        name: '测试用户',
        email: 'test@example.com'
      }

      authService.getCurrentUser.mockReturnValue(mockUser)

      const to = { fullPath: '/login' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      redirectIfAuthenticated(to, from, next)

      expect(next).toHaveBeenCalledWith({ name: 'Home' })
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('未登录用户应该允许访问登录/注册页', () => {
      authService.getCurrentUser.mockReturnValue(null)

      const to = { fullPath: '/login' }
      const from = { fullPath: '/' }
      const next = vi.fn()

      redirectIfAuthenticated(to, from, next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })
})
