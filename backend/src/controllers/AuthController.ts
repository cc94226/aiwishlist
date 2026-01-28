import { Request, Response, NextFunction } from 'express'
import {
  AuthService,
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  ChangePasswordRequest
} from '../services/AuthService'
import { AppError } from '../middleware/errorHandler'

/**
 * 认证控制器类
 * 处理认证相关的HTTP请求
 */
export class AuthController {
  /**
   * 用户登录
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginRequest = {
        email: req.body.email,
        password: req.body.password,
        rememberMe: req.body.rememberMe
      }

      const result = await AuthService.login(loginData)

      res.status(200).json({
        success: true,
        data: result,
        message: result.message || '登录成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 用户注册
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registerData: RegisterRequest = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        job: req.body.job || null
      }

      const result = await AuthService.register(registerData)

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result,
          message: result.message || '注册成功'
        })
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors || [],
          message: result.message || '注册失败'
        })
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   * 需要认证
   */
  static async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('未登录', 401, 'UNAUTHORIZED')
      }

      const user = await AuthService.getUserInfo(req.user.id)

      res.status(200).json({
        success: true,
        data: user,
        message: '获取用户信息成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 更新用户信息
   * PUT /api/auth/profile
   * 需要认证
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('未登录', 401, 'UNAUTHORIZED')
      }

      const updateData: UpdateUserRequest = {
        name: req.body.name,
        email: req.body.email,
        job: req.body.job,
        password: req.body.password,
        oldPassword: req.body.oldPassword
      }

      const result = await AuthService.updateUser(req.user.id, updateData)

      res.status(200).json({
        success: true,
        data: result,
        message: result.message || '更新成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 修改密码
   * PUT /api/auth/password
   * 需要认证
   */
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('未登录', 401, 'UNAUTHORIZED')
      }

      const changePasswordData: ChangePasswordRequest = {
        oldPassword: req.body.oldPassword,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
      }

      const result = await AuthService.changePassword(
        req.user.id,
        changePasswordData
      )

      res.status(200).json({
        success: true,
        data: result,
        message: result.message || '密码修改成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   * 需要认证
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: 未来实现JWT token时，需要将token加入黑名单
      // 当前实现仅返回成功响应

      res.status(200).json({
        success: true,
        message: '登出成功'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default AuthController
