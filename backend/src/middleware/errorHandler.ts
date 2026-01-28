import { Request, Response, NextFunction } from 'express'

/**
 * 自定义错误类
 */
export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  code?: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 错误处理中间件
 * 统一处理所有错误，返回标准格式的错误响应
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 如果是自定义错误（AppError），使用其状态码和消息
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        name: 'AppError',
        message: err.message,
        code: err.code || 'UNKNOWN_ERROR',
        statusCode: err.statusCode
      },
      timestamp: new Date().toISOString()
    })
    return
  }

  // 处理Express验证错误
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: err.message || '请求数据验证失败',
        code: 'VALIDATION_ERROR',
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    })
    return
  }

  // 处理数据库错误
  if (err.name === 'DatabaseError' || err.message.includes('database')) {
    res.status(500).json({
      success: false,
      error: {
        name: 'DatabaseError',
        message: '数据库操作失败',
        code: 'DATABASE_ERROR',
        statusCode: 500
      },
      timestamp: new Date().toISOString()
    })
    return
  }

  // 默认错误处理
  const statusCode = 500
  res.status(statusCode).json({
    success: false,
    error: {
      name: err.name || 'Error',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode
    },
    timestamp: new Date().toISOString()
  })
}

/**
 * 404错误处理中间件
 * 处理未找到的路由
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      name: 'NotFoundError',
      message: `路由 ${req.method} ${req.path} 未找到`,
      code: 'NOT_FOUND',
      statusCode: 404
    },
    timestamp: new Date().toISOString()
  })
}
