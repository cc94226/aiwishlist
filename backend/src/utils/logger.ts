/**
 * 日志记录和监控工具
 * 提供完整的日志记录、监控和告警功能
 */

import fs from 'fs'
import path from 'path'
import { Request, Response } from 'express'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * 日志级别名称映射
 */
const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别（低于此级别的日志不会被记录） */
  level?: LogLevel
  /** 是否输出到控制台 */
  console?: boolean
  /** 是否输出到文件 */
  file?: boolean
  /** 日志文件目录 */
  logDir?: string
  /** 日志文件名格式 */
  filename?: string
  /** 最大文件大小（字节） */
  maxFileSize?: number
  /** 保留的日志文件数量 */
  maxFiles?: number
  /** 是否启用监控 */
  monitoring?: boolean
  /** 监控告警阈值 */
  alertThresholds?: {
    errorRate?: number // 错误率阈值（百分比）
    responseTime?: number // 响应时间阈值（毫秒）
  }
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  request?: {
    method?: string
    path?: string
    ip?: string
    userAgent?: string
    userId?: string
  }
  response?: {
    statusCode?: number
    duration?: number
  }
}

/**
 * 监控指标接口
 */
export interface MonitoringMetrics {
  /** 总请求数 */
  totalRequests: number
  /** 错误请求数 */
  errorRequests: number
  /** 平均响应时间（毫秒） */
  avgResponseTime: number
  /** 最大响应时间（毫秒） */
  maxResponseTime: number
  /** 最小响应时间（毫秒） */
  minResponseTime: number
  /** 错误率（百分比） */
  errorRate: number
  /** 时间窗口开始时间 */
  windowStart: Date
  /** 时间窗口结束时间 */
  windowEnd: Date
}

/**
 * 日志记录器类
 */
export class Logger {
  private config: Required<LoggerConfig>
  private logStream: fs.WriteStream | null = null
  private metrics: MonitoringMetrics
  private alertCallbacks: Array<(metrics: MonitoringMetrics) => void> = []

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level:
        config.level ?? (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG),
      console: config.console ?? true,
      file: config.file ?? process.env.NODE_ENV === 'production',
      logDir: config.logDir ?? path.join(process.cwd(), 'logs'),
      filename: config.filename ?? 'app.log',
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 10,
      monitoring: config.monitoring ?? true,
      alertThresholds: {
        errorRate: config.alertThresholds?.errorRate ?? 10, // 10%
        responseTime: config.alertThresholds?.responseTime ?? 5000 // 5秒
      }
    }

    // 初始化监控指标
    this.metrics = {
      totalRequests: 0,
      errorRequests: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorRate: 0,
      windowStart: new Date(),
      windowEnd: new Date()
    }

    // 初始化日志目录
    if (this.config.file) {
      this.initLogDirectory()
      this.initLogFile()
    }

    // 启动监控任务
    if (this.config.monitoring) {
      this.startMonitoringTask()
    }
  }

  /**
   * 初始化日志目录
   */
  private initLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true })
    }
  }

  /**
   * 初始化日志文件
   */
  private initLogFile(): void {
    const logPath = path.join(this.config.logDir, this.config.filename)

    // 检查文件大小，如果超过限制则轮转
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath)
      if (stats.size >= this.config.maxFileSize) {
        this.rotateLogFile()
      }
    }

    // 创建写入流
    this.logStream = fs.createWriteStream(logPath, { flags: 'a' })
  }

  /**
   * 轮转日志文件
   */
  private rotateLogFile(): void {
    const logPath = path.join(this.config.logDir, this.config.filename)

    // 关闭当前流
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }

    // 重命名现有文件
    for (let i = this.config.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(this.config.logDir, `${this.config.filename}.${i}`)
      const newFile = path.join(this.config.logDir, `${this.config.filename}.${i + 1}`)

      if (fs.existsSync(oldFile)) {
        if (i === this.config.maxFiles - 1) {
          // 删除最旧的文件
          fs.unlinkSync(oldFile)
        } else {
          fs.renameSync(oldFile, newFile)
        }
      }
    }

    // 重命名当前文件为.1
    if (fs.existsSync(logPath)) {
      fs.renameSync(logPath, path.join(this.config.logDir, `${this.config.filename}.1`))
    }

    // 重新初始化日志文件
    this.initLogFile()
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [
      `[${entry.timestamp}]`,
      `[${LogLevelNames[entry.level]}]`,
      entry.message
    ]

    if (entry.request) {
      const req = entry.request
      if (req.method && req.path) {
        parts.push(`${req.method} ${req.path}`)
      }
      if (req.ip) {
        parts.push(`IP: ${req.ip}`)
      }
      if (req.userId) {
        parts.push(`User: ${req.userId}`)
      }
    }

    if (entry.response) {
      const res = entry.response
      if (res.statusCode) {
        parts.push(`Status: ${res.statusCode}`)
      }
      if (res.duration !== undefined) {
        parts.push(`Duration: ${res.duration}ms`)
      }
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.stack || entry.error.message}`)
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`Context: ${JSON.stringify(entry.context)}`)
    }

    return parts.join(' | ')
  }

  /**
   * 记录日志
   */
  private log(entry: LogEntry): void {
    // 检查日志级别
    if (entry.level < this.config.level) {
      return
    }

    const formattedMessage = this.formatLogEntry(entry)

    // 输出到控制台
    if (this.config.console) {
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
        case LogLevel.FATAL:
          console.error(formattedMessage)
          break
      }
    }

    // 输出到文件
    if (this.config.file && this.logStream) {
      this.logStream.write(formattedMessage + '\n')
    }
  }

  /**
   * 记录DEBUG级别日志
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      context
    })
  }

  /**
   * 记录INFO级别日志
   */
  info(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context
    })
  }

  /**
   * 记录WARN级别日志
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context
    })
  }

  /**
   * 记录ERROR级别日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      error,
      context
    })
  }

  /**
   * 记录FATAL级别日志
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.FATAL,
      message,
      timestamp: new Date().toISOString(),
      error,
      context
    })
  }

  /**
   * 记录HTTP请求日志
   */
  logRequest(req: Request, res: Response, duration: number): void {
    const entry: LogEntry = {
      level:
        res.statusCode >= 500
          ? LogLevel.ERROR
          : res.statusCode >= 400
            ? LogLevel.WARN
            : LogLevel.INFO,
      message: 'HTTP请求',
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id
      },
      response: {
        statusCode: res.statusCode,
        duration
      }
    }

    this.log(entry)

    // 更新监控指标
    if (this.config.monitoring) {
      this.updateMetrics(res.statusCode, duration)
    }
  }

  /**
   * 更新监控指标
   */
  private updateMetrics(statusCode: number, duration: number): void {
    this.metrics.totalRequests++

    if (statusCode >= 400) {
      this.metrics.errorRequests++
    }

    // 更新响应时间统计
    const totalDuration = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + duration
    this.metrics.avgResponseTime = totalDuration / this.metrics.totalRequests
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, duration)
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, duration)

    // 计算错误率
    this.metrics.errorRate = (this.metrics.errorRequests / this.metrics.totalRequests) * 100

    this.metrics.windowEnd = new Date()
  }

  /**
   * 获取监控指标
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics }
  }

  /**
   * 重置监控指标
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      errorRequests: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorRate: 0,
      windowStart: new Date(),
      windowEnd: new Date()
    }
  }

  /**
   * 添加告警回调
   */
  onAlert(callback: (metrics: MonitoringMetrics) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(): void {
    const { errorRate, avgResponseTime } = this.metrics
    const { errorRate: errorThreshold, responseTime: responseThreshold } =
      this.config.alertThresholds

    if (errorRate > errorThreshold || avgResponseTime > responseThreshold) {
      // 触发告警
      this.alertCallbacks.forEach(callback => {
        try {
          callback(this.metrics)
        } catch (error) {
          console.error('告警回调执行失败:', error)
        }
      })

      // 记录告警日志
      this.warn('监控告警触发', {
        errorRate,
        avgResponseTime,
        errorThreshold,
        responseThreshold
      })
    }
  }

  /**
   * 启动监控任务
   */
  private startMonitoringTask(): void {
    // 每5分钟检查一次告警条件
    setInterval(
      () => {
        this.checkAlerts()
      },
      5 * 60 * 1000
    )
  }

  /**
   * 关闭日志记录器
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }
  }
}

/**
 * 创建默认日志记录器实例
 */
let defaultLogger: Logger | null = null

/**
 * 获取默认日志记录器实例
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    const config: LoggerConfig = {
      level:
        (process.env.LOG_LEVEL as any) ||
        (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG),
      console: process.env.LOG_CONSOLE !== 'false',
      file: process.env.LOG_FILE === 'true' || process.env.NODE_ENV === 'production',
      logDir: process.env.LOG_DIR,
      filename: process.env.LOG_FILENAME,
      maxFileSize: process.env.LOG_MAX_FILE_SIZE
        ? parseInt(process.env.LOG_MAX_FILE_SIZE, 10)
        : undefined,
      maxFiles: process.env.LOG_MAX_FILES ? parseInt(process.env.LOG_MAX_FILES, 10) : undefined,
      monitoring: process.env.LOG_MONITORING !== 'false',
      alertThresholds: {
        errorRate: process.env.LOG_ALERT_ERROR_RATE
          ? parseFloat(process.env.LOG_ALERT_ERROR_RATE)
          : undefined,
        responseTime: process.env.LOG_ALERT_RESPONSE_TIME
          ? parseInt(process.env.LOG_ALERT_RESPONSE_TIME, 10)
          : undefined
      }
    }
    defaultLogger = new Logger(config)
  }
  return defaultLogger
}

/**
 * HTTP请求日志中间件
 */
export function requestLogger(req: Request, res: Response, next: () => void): void {
  const startTime = Date.now()
  const logger = getLogger()

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.logRequest(req, res, duration)
  })

  next()
}

export default Logger
