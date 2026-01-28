import { Request, Response, NextFunction } from 'express'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * 日志接口
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  method?: string
  path?: string
  statusCode?: number
  duration?: number
  error?: string
  userId?: string
  ip?: string
}

/**
 * 日志工具类
 */
class Logger {
  /**
   * 格式化日志消息
   */
  private formatMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.message
    ]

    if (entry.method && entry.path) {
      parts.push(`${entry.method} ${entry.path}`)
    }

    if (entry.statusCode) {
      parts.push(`Status: ${entry.statusCode}`)
    }

    if (entry.duration) {
      parts.push(`Duration: ${entry.duration}ms`)
    }

    if (entry.userId) {
      parts.push(`User: ${entry.userId}`)
    }

    if (entry.ip) {
      parts.push(`IP: ${entry.ip}`)
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error}`)
    }

    return parts.join(' | ')
  }

  /**
   * 输出日志到控制台
   */
  private log(entry: LogEntry): void {
    const message = this.formatMessage(entry)
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message)
        break
      case LogLevel.INFO:
        console.info(message)
        break
      case LogLevel.WARN:
        console.warn(message)
        break
      case LogLevel.ERROR:
        console.error(message)
        break
    }
  }

  /**
   * 记录DEBUG级别日志
   */
  debug(message: string, meta?: Partial<LogEntry>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录INFO级别日志
   */
  info(message: string, meta?: Partial<LogEntry>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录WARN级别日志
   */
  warn(message: string, meta?: Partial<LogEntry>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录ERROR级别日志
   */
  error(message: string, error?: Error, meta?: Partial<LogEntry>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      error: error ? error.stack : undefined,
      ...meta
    })
  }
}

/**
 * 日志实例
 */
export const logger = new Logger()

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()
  const { method, path, ip } = req

  // 记录请求开始
  logger.info('收到请求', {
    method,
    path,
    ip
  })

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const { statusCode } = res

    // 根据状态码选择日志级别
    if (statusCode >= 500) {
      logger.error('请求处理失败', undefined, {
        method,
        path,
        statusCode,
        duration,
        ip
      })
    } else if (statusCode >= 400) {
      logger.warn('请求处理警告', {
        method,
        path,
        statusCode,
        duration,
        ip
      })
    } else {
      logger.info('请求处理成功', {
        method,
        path,
        statusCode,
        duration,
        ip
      })
    }
  })

  next()
}
