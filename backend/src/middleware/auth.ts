import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import { AuthService } from '../services/AuthService'

/**
 * 扩展Request接口，添加用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'admin' | 'user'
        name?: string
        job?: string
      }
    }
  }
}

/**
 * 认证中间件
 * 验证用户是否已登录（使用JWT token验证）
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // 从请求头获取token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('未提供认证令牌', 401, 'UNAUTHORIZED')
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // 验证token并解析用户信息
    const decoded = AuthService.verifyToken(token)
    
    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      job: decoded.job || undefined
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError('无效的认证令牌', 401, 'UNAUTHORIZED')
  }
}

/**
 * 授权中间件
 * 验证用户是否具有管理员权限
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // 先检查是否已认证
  if (!req.user) {
    throw new AppError('需要登录', 401, 'UNAUTHORIZED')
  }

  // 检查是否为管理员
  if (req.user.role !== 'admin') {
    throw new AppError('需要管理员权限', 403, 'FORBIDDEN')
  }

  next()
}

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续（不要求必须登录）
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有token，继续执行（不设置user）
    next()
    return
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // 验证token并解析用户信息
    const decoded = AuthService.verifyToken(token)
    
    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      job: decoded.job || undefined
    }
  } catch (error) {
    // token无效，但不抛出错误，继续执行（不设置user）
    // 这样可以让接口同时支持已登录和未登录的用户
  }

  next()
}
