/**
 * 全局错误处理工具
 * 提供统一的错误处理和报告机制
 */

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * 错误消息映射
 */
const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorTypes.VALIDATION_ERROR]: '数据验证失败，请检查输入',
  [ErrorTypes.AUTH_ERROR]: '未授权，请先登录',
  [ErrorTypes.PERMISSION_ERROR]: '权限不足，无法执行此操作',
  [ErrorTypes.NOT_FOUND_ERROR]: '请求的资源不存在',
  [ErrorTypes.SERVER_ERROR]: '服务器错误，请稍后重试',
  [ErrorTypes.UNKNOWN_ERROR]: '未知错误，请稍后重试'
}

/**
 * 错误处理类
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, originalError = null) {
    super(message || ErrorMessages[type])
    this.name = 'AppError'
    this.type = type
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }

  /**
   * 从其他错误创建AppError
   */
  static fromError(error) {
    if (error instanceof AppError) {
      return error
    }

    // 根据错误类型判断
    if (error instanceof TypeError) {
      return new AppError('类型错误', ErrorTypes.VALIDATION_ERROR, error)
    }
    if (error instanceof ReferenceError) {
      return new AppError('引用错误', ErrorTypes.UNKNOWN_ERROR, error)
    }
    if (error.message && error.message.includes('network')) {
      return new AppError('网络错误', ErrorTypes.NETWORK_ERROR, error)
    }

    return new AppError(error.message || '未知错误', ErrorTypes.UNKNOWN_ERROR, error)
  }
}

/**
 * 错误处理器
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = []
    this.errorQueue = []
    this.isReporting = false
  }

  /**
   * 添加错误监听器
   */
  addListener(listener) {
    this.errorListeners.push(listener)
  }

  /**
   * 移除错误监听器
   */
  removeListener(listener) {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * 处理错误
   */
  handleError(error, errorInfo = {}) {
    const appError = AppError.fromError(error)

    // 记录错误
    console.error('错误处理:', appError, errorInfo)

    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(appError, errorInfo)
      } catch (e) {
        console.error('错误监听器执行失败:', e)
      }
    })

    // 在生产环境中发送错误报告
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError, errorInfo)
    }

    return appError
  }

  /**
   * 发送错误报告到服务器
   */
  async reportError(error, errorInfo) {
    // 避免重复报告
    if (this.isReporting) {
      this.errorQueue.push({ error, errorInfo })
      return
    }

    this.isReporting = true

    try {
      // 这里可以集成错误监控服务
      // 例如：Sentry、LogRocket、Bugsnag等
      const reportData = {
        message: error.message,
        type: error.type,
        stack: error.stack,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...errorInfo
      }

      // 示例：发送到服务器
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(reportData)
      // })

      console.log('错误报告已发送:', reportData)
    } catch (e) {
      console.error('发送错误报告失败:', e)
    } finally {
      this.isReporting = false

      // 处理队列中的错误
      if (this.errorQueue.length > 0) {
        const next = this.errorQueue.shift()
        this.reportError(next.error, next.errorInfo)
      }
    }
  }

  /**
   * 获取友好的错误消息
   */
  getFriendlyMessage(error) {
    const appError = AppError.fromError(error)
    return appError.message || ErrorMessages[appError.type] || ErrorMessages[ErrorTypes.UNKNOWN_ERROR]
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler()

/**
 * 设置全局错误处理
 */
export function setupGlobalErrorHandling(app) {
  // Vue应用错误处理
  app.config.errorHandler = (err, instance, info) => {
    errorHandler.handleError(err, {
      type: 'vue',
      component: instance?.$options?.name || 'Unknown',
      info
    })
  }

  // 全局JavaScript错误处理
  window.addEventListener('error', event => {
    errorHandler.handleError(event.error || new Error(event.message), {
      type: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // 未处理的Promise拒绝
  window.addEventListener('unhandledrejection', event => {
    errorHandler.handleError(event.reason || new Error('未处理的Promise拒绝'), {
      type: 'unhandledrejection'
    })
    // 阻止默认行为
    event.preventDefault()
  })
}

/**
 * 创建错误处理组合式函数
 */
export function useErrorHandler() {
  const handleError = (error, errorInfo = {}) => {
    return errorHandler.handleError(error, errorInfo)
  }

  const getFriendlyMessage = error => {
    return errorHandler.getFriendlyMessage(error)
  }

  return {
    handleError,
    getFriendlyMessage,
    ErrorTypes
  }
}

export default errorHandler
