import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

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
 * 验证用户是否已登录（占位符实现，未来将集成JWT）
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // TODO: 实现JWT token验证
  // 当前为占位符实现，从请求头获取token
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    throw new AppError('未提供认证令牌', 401, 'UNAUTHORIZED')
  }

  // TODO: 验证token并解析用户信息
  // 临时实现：如果token存在，设置默认用户（仅用于开发测试）
  // 生产环境必须实现完整的JWT验证逻辑
  if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'user',
      name: '开发用户'
    }
    next()
    return
  }

  // 生产环境：验证token失败
  throw new AppError('无效的认证令牌', 401, 'UNAUTHORIZED')
}

/**
 * 授权中间件
 * 验证用户是否具有管理员权限
 */
export const requireAdmin = (
  req: Request,
  res: Response,
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
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    // 没有token，继续执行（不设置user）
    next()
    return
  }

  // TODO: 验证token并解析用户信息
  // 临时实现：如果token存在，设置默认用户（仅用于开发测试）
  if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      role: 'user',
      name: '开发用户'
    }
  }

  next()
}
