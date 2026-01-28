/**
 * 日志记录和监控工具
 * 提供统一的日志记录功能，支持多种日志级别和输出方式
 */

import { Request } from 'express'
import * as fs from 'fs'
import * as path from 'path'

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
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别，低于此级别的日志不会被记录 */
  level?: LogLevel
  /** 是否输出到控制台 */
  console?: boolean
  /** 是否输出到文件 */
  file?: boolean
  /** 日志文件目录 */
  logDir?: string
  /** 日志文件最大大小（字节），默认10MB */
  maxFileSize?: number
  /** 保留的日志文件数量，默认10个 */
  maxFiles?: number
  /** 是否启用性能监控 */
  enablePerformance?: boolean
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  error?: Error
  context?: Record<string, any>
  performance?: {
    duration: number
    operation: string
  }
}

/**
 * 日志工具类
 */
class Logger {
  private config: Required<LoggerConfig>
  private logStream: fs.WriteStream | null = null
  private currentLogFile: string | null = null

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level ?? (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG),
      console: config.console ?? true,
      file: config.file ?? true,
      logDir: config.logDir ?? path.join(process.cwd(), 'logs'),
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 10,
      enablePerformance: config.enablePerformance ?? true
    }

    // 确保日志目录存在
    if (this.config.file && !fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true })
    }

    // 初始化日志文件流
    if (this.config.file) {
      this.initLogFile()
    }
  }

  /**
   * 初始化日志文件
   */
  private initLogFile(): void {
    const date = new Date().toISOString().split('T')[0]
    this.currentLogFile = path.join(this.config.logDir, `app-${date}.log`)

    try {
      this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' })
    } catch (error) {
      console.error('无法创建日志文件:', error)
      this.logStream = null
    }
  }

  /**
   * 检查日志文件大小，如果超过限制则轮转
   */
  private rotateLogFile(): void {
    if (!this.logStream || !this.currentLogFile) {
      return
    }

    try {
      const stats = fs.statSync(this.currentLogFile)
      if (stats.size >= this.config.maxFileSize) {
        // 关闭当前文件流
        this.logStream.end()

        // 重命名当前文件
        const timestamp = Date.now()
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`)
        fs.renameSync(this.currentLogFile, rotatedFile)

        // 清理旧日志文件
        this.cleanupOldLogs()

        // 创建新的日志文件
        this.initLogFile()
      }
    } catch (error) {
      console.error('日志文件轮转失败:', error)
    }
  }

  /**
   * 清理旧的日志文件
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDir, file),
          mtime: fs.statSync(path.join(this.config.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      // 删除超出数量限制的文件
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles)
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path)
          } catch (error) {
            console.error(`删除日志文件失败: ${file.name}`, error)
          }
        })
      }
    } catch (error) {
      console.error('清理旧日志文件失败:', error)
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${LogLevel[entry.level]}]`,
      entry.message
    ]

    if (entry.context) {
      parts.push(`Context: ${JSON.stringify(entry.context)}`)
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`)
      if (entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`)
      }
    }

    if (entry.performance) {
      parts.push(`Performance: ${entry.performance.operation} took ${entry.performance.duration}ms`)
    }

    if (entry.data) {
      parts.push(`Data: ${JSON.stringify(entry.data)}`)
    }

    return parts.join(' ')
  }

  /**
   * 获取日志级别对应的颜色（用于控制台输出）
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m' // 青色
      case LogLevel.INFO:
        return '\x1b[32m' // 绿色
      case LogLevel.WARN:
        return '\x1b[33m' // 黄色
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return '\x1b[31m' // 红色
      default:
        return '\x1b[0m' // 默认
    }
  }

  /**
   * 重置颜色
   */
  private resetColor(): string {
    return '\x1b[0m'
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error, context?: Record<string, any>): void {
    // 检查日志级别
    if (level < this.config.level) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
      context
    }

    const formattedMessage = this.formatMessage(entry)

    // 输出到控制台
    if (this.config.console) {
      const color = this.getLevelColor(level)
      const reset = this.resetColor()
      console.log(`${color}${formattedMessage}${reset}`)
    }

    // 输出到文件
    if (this.config.file && this.logStream) {
      this.logStream.write(formattedMessage + '\n')
      this.rotateLogFile()
    }
  }

  /**
   * Debug级别日志
   */
  debug(message: string, data?: any, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data, undefined, context)
  }

  /**
   * Info级别日志
   */
  info(message: string, data?: any, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data, undefined, context)
  }

  /**
   * Warn级别日志
   */
  warn(message: string, data?: any, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data, undefined, context)
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: Error, data?: any, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, data, error, context)
  }

  /**
   * Fatal级别日志
   */
  fatal(message: string, error?: Error, data?: any, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, data, error, context)
  }

  /**
   * 性能监控：记录操作耗时
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    if (!this.config.enablePerformance) {
      return
    }

    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: `Performance: ${operation}`,
      timestamp: new Date().toISOString(),
      performance: {
        duration,
        operation
      },
      context
    }

    const formattedMessage = this.formatMessage(entry)

    if (this.config.console) {
      console.log(`\x1b[35m${formattedMessage}\x1b[0m`) // 紫色
    }

    if (this.config.file && this.logStream) {
      this.logStream.write(formattedMessage + '\n')
      this.rotateLogFile()
    }
  }

  /**
   * HTTP请求日志
   */
  httpRequest(req: Request, statusCode: number, duration: number): void {
    const context = {
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    }

    if (statusCode >= 500) {
      this.error(`HTTP ${req.method} ${req.path}`, undefined, { statusCode, duration }, context)
    } else if (statusCode >= 400) {
      this.warn(`HTTP ${req.method} ${req.path}`, { statusCode, duration }, context)
    } else {
      this.info(`HTTP ${req.method} ${req.path}`, { statusCode, duration }, context)
    }
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

// 创建默认logger实例
const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  console: true,
  file: process.env.NODE_ENV === 'production',
  logDir: path.join(process.cwd(), 'logs'),
  enablePerformance: true
})

export default logger
export { Logger, LogLevel, LoggerConfig, LogEntry }
