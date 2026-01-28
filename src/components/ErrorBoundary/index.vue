<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">出错了</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button class="btn-retry" @click="handleRetry">重试</button>
        <button class="btn-home" @click="handleGoHome">返回首页</button>
      </div>
      <details v-if="showDetails || process.env.NODE_ENV === 'development'" class="error-details">
        <summary @click="toggleDetails">错误详情</summary>
        <pre class="error-stack">{{ errorStack }}</pre>
      </details>
      <button
        v-if="!showDetails && process.env.NODE_ENV === 'development'"
        class="btn-details"
        @click="toggleDetails"
      >
        显示错误详情
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script>
export default {
  name: 'ErrorBoundary',
  data() {
    return {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  },
  computed: {
    errorMessage() {
      if (!this.error) return '发生未知错误'

      // 根据错误类型返回友好的错误消息
      const errorName = this.error.name || ''
      const errorMessage = this.error.message || ''

      // 处理常见的错误类型
      if (errorName === 'ChunkLoadError' || errorMessage.includes('chunk')) {
        return '组件加载失败，请刷新页面重试'
      }

      if (
        errorName === 'NetworkError' ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch')
      ) {
        return '网络连接失败，请检查网络设置'
      }

      if (errorName === 'TypeError' && errorMessage.includes('undefined')) {
        return '数据加载异常，请刷新页面重试'
      }

      if (errorName === 'SyntaxError') {
        return '代码解析错误，请联系管理员'
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
        return '请求超时，请稍后重试'
      }

      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return '请求的资源不存在'
      }

      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return '未授权，请先登录'
      }

      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return '权限不足，无法执行此操作'
      }

      if (errorMessage.includes('500') || errorMessage.includes('server error')) {
        return '服务器错误，请稍后重试'
      }

      // 如果有错误消息，返回错误消息（限制长度）
      if (errorMessage && errorMessage.length > 0) {
        return errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage
      }

      return '发生错误，请稍后重试'
    },
    errorStack() {
      if (!this.error) return ''

      let stack = this.error.stack || ''

      if (this.errorInfo && this.errorInfo.componentStack) {
        stack += '\n\n组件堆栈:\n' + this.errorInfo.componentStack
      }

      return stack
    }
  },
  errorCaptured(err, instance, info) {
    // 捕获子组件的错误
    this.hasError = true
    this.error = err
    this.errorInfo = {
      componentStack: info,
      instance,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }

    // 记录错误到控制台
    console.error('ErrorBoundary捕获到错误:', {
      error: err,
      info: info,
      instance: instance,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // 发送错误报告到服务器
    this.reportError(err, info)

    // 返回false阻止错误继续传播
    return false
  },
  mounted() {
    // 监听全局未捕获的错误
    window.addEventListener('error', this.handleGlobalError)
    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  },
  methods: {
    handleRetry() {
      // 重置错误状态
      this.hasError = false
      this.error = null
      this.errorInfo = null
      this.showDetails = false

      // 触发重新渲染
      this.$forceUpdate()
    },
    handleGoHome() {
      // 跳转到首页
      this.$router.push('/').catch(() => {
        // 如果路由跳转失败，使用window.location
        window.location.href = '/'
      })
    },
    reportError(err, errorInfo) {
      // 在生产环境中，可以将错误发送到错误监控服务
      // eslint-disable-next-line no-unused-vars
      const _unused = { err, errorInfo } // 保留参数以便将来使用
      if (process.env.NODE_ENV === 'production') {
        // 示例：发送错误到监控服务
        // const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        // fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     message: err.message,
        //     stack: err.stack,
        //     componentStack: errorInfo,
        //     url: window.location.href,
        //     userAgent: userAgent,
        //     timestamp: new Date().toISOString()
        //   })
        // }).catch(console.error)
      }
    },
    toggleDetails() {
      this.showDetails = !this.showDetails
    },
    handleGlobalError(event) {
      // 处理全局JavaScript错误
      if (!this.hasError) {
        this.hasError = true
        this.error = event.error || new Error(event.message || '未知错误')
        this.errorInfo = {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
        this.reportError(this.error, this.errorInfo)
      }
    },
    handleUnhandledRejection(event) {
      // 处理未捕获的Promise拒绝
      if (!this.hasError) {
        this.hasError = true
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason || 'Promise被拒绝'))
        this.error = error
        this.errorInfo = {
          type: 'unhandledrejection',
          reason: event.reason,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
        this.reportError(error, this.errorInfo)
      }
    }
  }
}
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.error-message {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.btn-retry,
.btn-home {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-retry {
  background-color: #2c3e50;
  color: white;
}

.btn-retry:hover {
  background-color: #34495e;
}

.btn-home {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-home:hover {
  background-color: #bdc3c7;
}

.btn-details {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s;
}

.btn-details:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

.error-details {
  margin-top: 1.5rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #666;
  margin-bottom: 0.5rem;
  user-select: none;
}

.error-details summary:hover {
  color: #2c3e50;
}

.error-stack {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .error-container {
    padding: 1.5rem;
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-retry,
  .btn-home {
    width: 100%;
  }
}
</style>
