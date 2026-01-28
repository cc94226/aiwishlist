import { Request, Response } from 'express'
import { AuthService } from '../services/AuthService'
import { AppError } from '../middleware/errorHandler'

/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */
export class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData = req.body

      // 验证请求数据
      if (!registerData || typeof registerData !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            message: '请求数据格式错误',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await AuthService.register(registerData)

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message || '注册成功',
          data: {
            user: result.user
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: result.message || '注册失败',
          errors: result.errors || []
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'REGISTER_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '注册失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body

      // 验证请求数据
      if (!loginData || typeof loginData !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            message: '请求数据格式错误',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await AuthService.login(loginData)

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || '登录成功',
          data: {
            token: result.token,
            user: result.user
          }
        })
      } else {
        res.status(401).json({
          success: false,
          error: {
            message: result.message || '登录失败',
            code: 'LOGIN_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = error.statusCode === 401 ? 401 : 400
        res.status(statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'LOGIN_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '登录失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   * 需要认证
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const user = await AuthService.getUserInfo(req.user.id)

      res.status(200).json({
        success: true,
        data: {
          user
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_USER_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取用户信息失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 更新用户信息
   * PUT /api/auth/profile
   * 需要认证
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const updateData = req.body
      const result = await AuthService.updateUser(req.user.id, updateData)

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || '更新成功',
          data: {
            user: result.user
          }
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.message || '更新失败',
            code: 'UPDATE_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'UPDATE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '更新用户信息失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 修改密码
   * PUT /api/auth/password
   * 需要认证
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const changePasswordData = req.body
      const result = await AuthService.changePassword(
        req.user.id,
        changePasswordData
      )

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || '密码修改成功'
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.message || '密码修改失败',
            code: 'CHANGE_PASSWORD_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        const statusCode = error.statusCode === 401 ? 401 : 400
        res.status(statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'CHANGE_PASSWORD_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '密码修改失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }
}

export default AuthController
