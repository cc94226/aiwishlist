import * as fs from 'fs'
import * as path from 'path'
import { Request, Response } from 'express'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR'
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel
  levelName: string
  message: string
  timestamp: string
  service?: string
  method?: string
  path?: string
  statusCode?: number
  duration?: number
  error?: string | Error
  userId?: string
  ip?: string
  metadata?: Record<string, any>
}

/**
 * 性能监控指标接口
 */
export interface PerformanceMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  slowestRequests: Array<{
    method: string
    path: string
    duration: number
    timestamp: string
  }>
  errorRate: number
}

/**
 * 日志配置接口
 */
interface LoggerConfig {
  level: LogLevel
  enableFileLogging: boolean
  enableConsoleLogging: boolean
  logDir: string
  maxFileSize: number // 字节
  maxFiles: number
  enableJsonFormat: boolean
  enablePerformanceMonitoring: boolean
}

/**
 * 日志记录和监控工具类
 */
class LoggerService {
  private config: LoggerConfig
  private logStream: fs.WriteStream | null = null
  private currentLogFile: string = ''
  private performanceMetrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    slowestRequests: [],
    errorRate: 0
  }
  private responseTimes: number[] = []

  constructor() {
    // 从环境变量读取配置
    const logLevel = process.env.LOG_LEVEL || 'INFO'
    this.config = {
      level: this.parseLogLevel(logLevel),
      enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
      enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
      logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
      maxFileSize: parseInt(process.env.MAX_LOG_FILE_SIZE || '10485760', 10), // 默认10MB
      maxFiles: parseInt(process.env.MAX_LOG_FILES || '10', 10),
      enableJsonFormat: process.env.LOG_JSON_FORMAT === 'true',
      enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false'
    }

    // 确保日志目录存在
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory()
      this.initializeLogFile()
    }
  }

  /**
   * 解析日志级别字符串
   */
  private parseLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase()
    switch (upperLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      default:
        return LogLevel.INFO
    }
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true })
    }
  }

  /**
   * 初始化日志文件
   */
  private initializeLogFile(): void {
    const date = new Date().toISOString().split('T')[0]
    this.currentLogFile = path.join(this.config.logDir, `app-${date}.log`)

    // 如果文件存在且超过最大大小，进行轮转
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile)
      if (stats.size >= this.config.maxFileSize) {
        this.rotateLogFile()
      }
    }

    // 创建写入流
    this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' })
  }

  /**
   * 轮转日志文件
   */
  private rotateLogFile(): void {
    if (!fs.existsSync(this.currentLogFile)) {
      return
    }

    // 查找已存在的轮转文件
    let rotationIndex = 1
    let rotatedFile = `${this.currentLogFile}.${rotationIndex}`

    while (fs.existsSync(rotatedFile) && rotationIndex < this.config.maxFiles) {
      rotationIndex++
      rotatedFile = `${this.currentLogFile}.${rotationIndex}`
    }

    // 如果达到最大文件数，删除最旧的文件
    if (rotationIndex >= this.config.maxFiles) {
      const oldestFile = `${this.currentLogFile}.1`
      if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile)
      }
      // 重命名所有文件
      for (let i = this.config.maxFiles - 1; i >= 1; i--) {
        const oldFile = `${this.currentLogFile}.${i}`
        const newFile = `${this.currentLogFile}.${i + 1}`
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile)
        }
      }
      rotationIndex = 1
    }

    // 重命名当前文件
    fs.renameSync(this.currentLogFile, `${this.currentLogFile}.${rotationIndex}`)
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.enableJsonFormat) {
      return JSON.stringify({
        ...entry,
        error: entry.error instanceof Error ? entry.error.stack : entry.error
      })
    }

    const parts = [`[${entry.timestamp}]`, `[${entry.levelName}]`, entry.message]

    if (entry.service) {
      parts.push(`[${entry.service}]`)
    }

    if (entry.method && entry.path) {
      parts.push(`${entry.method} ${entry.path}`)
    }

    if (entry.statusCode) {
      parts.push(`Status: ${entry.statusCode}`)
    }

    if (entry.duration !== undefined) {
      parts.push(`Duration: ${entry.duration}ms`)
    }

    if (entry.userId) {
      parts.push(`User: ${entry.userId}`)
    }

    if (entry.ip) {
      parts.push(`IP: ${entry.ip}`)
    }

    if (entry.error) {
      const errorStr = entry.error instanceof Error ? entry.error.stack : String(entry.error)
      parts.push(`Error: ${errorStr}`)
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`Metadata: ${JSON.stringify(entry.metadata)}`)
    }

    return parts.join(' | ')
  }

  /**
   * 写入日志
   */
  private writeLog(entry: LogEntry): void {
    // 检查日志级别
    if (entry.level < this.config.level) {
      return
    }

    const formattedMessage = this.formatLogEntry(entry)

    // 控制台输出
    if (this.config.enableConsoleLogging) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage)
          break
        case LogLevel.INFO:
          console.info(formattedMessage)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage)
          break
        case LogLevel.ERROR:
          console.error(formattedMessage)
          break
      }
    }

    // 文件输出
    if (this.config.enableFileLogging && this.logStream) {
      // 检查文件大小，必要时轮转
      const stats = fs.statSync(this.currentLogFile)
      if (stats.size >= this.config.maxFileSize) {
        this.rotateLogFile()
        this.initializeLogFile()
      }

      this.logStream.write(formattedMessage + '\n')
    }

    // 性能监控
    if (this.config.enablePerformanceMonitoring && entry.duration !== undefined) {
      this.updatePerformanceMetrics(entry)
    }
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(entry: LogEntry): void {
    this.performanceMetrics.requestCount++

    if (entry.statusCode && entry.statusCode >= 400) {
      this.performanceMetrics.errorCount++
    }

    if (entry.duration !== undefined) {
      this.responseTimes.push(entry.duration)

      // 保持最近1000个响应时间
      if (this.responseTimes.length > 1000) {
        this.responseTimes.shift()
      }

      // 计算平均响应时间
      const sum = this.responseTimes.reduce((a, b) => a + b, 0)
      this.performanceMetrics.averageResponseTime = Math.round(sum / this.responseTimes.length)

      // 更新最慢请求列表（保留前10个）
      if (entry.method && entry.path) {
        this.performanceMetrics.slowestRequests.push({
          method: entry.method,
          path: entry.path,
          duration: entry.duration,
          timestamp: entry.timestamp
        })

        // 按响应时间降序排序，保留前10个
        this.performanceMetrics.slowestRequests.sort((a, b) => b.duration - a.duration)
        if (this.performanceMetrics.slowestRequests.length > 10) {
          this.performanceMetrics.slowestRequests = this.performanceMetrics.slowestRequests.slice(
            0,
            10
          )
        }
      }
    }

    // 计算错误率
    if (this.performanceMetrics.requestCount > 0) {
      this.performanceMetrics.errorRate =
        (this.performanceMetrics.errorCount / this.performanceMetrics.requestCount) * 100
    }
  }

  /**
   * 记录DEBUG级别日志
   */
  debug(message: string, meta?: Partial<LogEntry>): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      levelName: LOG_LEVEL_NAMES[LogLevel.DEBUG],
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录INFO级别日志
   */
  info(message: string, meta?: Partial<LogEntry>): void {
    this.writeLog({
      level: LogLevel.INFO,
      levelName: LOG_LEVEL_NAMES[LogLevel.INFO],
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录WARN级别日志
   */
  warn(message: string, meta?: Partial<LogEntry>): void {
    this.writeLog({
      level: LogLevel.WARN,
      levelName: LOG_LEVEL_NAMES[LogLevel.WARN],
      message,
      timestamp: new Date().toISOString(),
      ...meta
    })
  }

  /**
   * 记录ERROR级别日志
   */
  error(message: string, error?: Error | string, meta?: Partial<LogEntry>): void {
    this.writeLog({
      level: LogLevel.ERROR,
      levelName: LOG_LEVEL_NAMES[LogLevel.ERROR],
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error : error,
      ...meta
    })
  }

  /**
   * 记录HTTP请求日志
   */
  logRequest(req: Request, res: Response, duration: number): void {
    const entry: Partial<LogEntry> = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.id,
      service: 'http'
    }

    if (res.statusCode >= 500) {
      this.error('请求处理失败', undefined, entry)
    } else if (res.statusCode >= 400) {
      this.warn('请求处理警告', entry)
    } else {
      this.info('请求处理成功', entry)
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 重置性能指标
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      errorRate: 0
    }
    this.responseTimes = []
  }

  /**
   * 关闭日志流
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }
  }
}

/**
 * 日志服务单例
 */
export const logger = new LoggerService()

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
export const requestLogger = (req: Request, res: Response, next: () => void): void => {
  const startTime = Date.now()

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.logRequest(req, res, duration)
  })

  next()
}

/**
 * 错误监控中间件
 * 捕获并记录未处理的错误
 */
export const errorMonitor = (error: Error, req?: Request): void => {
  logger.error('未处理的错误', error, {
    service: 'error-monitor',
    method: req?.method,
    path: req?.path,
    ip: req?.ip || req?.socket.remoteAddress,
    userId: (req as any)?.user?.id
  })
}

/**
 * 性能监控中间件
 * 记录慢请求和性能问题
 */
export const performanceMonitor = (req: Request, res: Response, next: () => void): void => {
  const startTime = Date.now()
  const slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000', 10) // 默认1秒

  res.on('finish', () => {
    const duration = Date.now() - startTime

    if (duration > slowRequestThreshold) {
      logger.warn('检测到慢请求', {
        method: req.method,
        path: req.path,
        duration,
        metadata: { threshold: slowRequestThreshold },
        service: 'performance-monitor'
      })
    }
  })

  next()
}
