// API请求封装和错误处理
// 当前使用localStorage模拟API，未来可轻松迁移到真实API

/**
 * API响应包装类
 */
class ApiResponse {
  constructor(success, data, error = null) {
    this.success = success
    this.data = data
    this.error = error
    this.timestamp = new Date().toISOString()
  }

  static success(data) {
    return new ApiResponse(true, data)
  }

  static error(error, data = null) {
    return new ApiResponse(false, data, error)
  }
}

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  static fromError(error) {
    if (error instanceof ApiError) {
      return error
    }
    return new ApiError(error.message || '未知错误', 'UNKNOWN_ERROR', 500, error)
  }
}

/**
 * 错误代码定义
 */
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * 错误消息映射
 */
const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCodes.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  [ErrorCodes.VALIDATION_ERROR]: '数据验证失败，请检查输入',
  [ErrorCodes.NOT_FOUND]: '请求的资源不存在',
  [ErrorCodes.UNAUTHORIZED]: '未授权，请先登录',
  [ErrorCodes.FORBIDDEN]: '权限不足，无法执行此操作',
  [ErrorCodes.SERVER_ERROR]: '服务器错误，请稍后重试',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误，请稍后重试'
}

/**
 * 获取友好的错误消息
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message || ErrorMessages[error.code] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR]
  }
  if (typeof error === 'string') {
    return error
  }
  return ErrorMessages[ErrorCodes.UNKNOWN_ERROR]
}

/**
 * 延迟函数（模拟网络延迟）
 */
function delay(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟API请求（当前使用localStorage）
 * 未来可以替换为真实的fetch/axios调用
 */
async function mockRequest(operation, key, data = null) {
  try {
    // 模拟网络延迟
    await delay(50)

    switch (operation) {
      case 'GET': {
        const stored = localStorage.getItem(key)
        if (stored === null) {
          throw new ApiError('数据不存在', ErrorCodes.NOT_FOUND, 404)
        }
        return JSON.parse(stored)
      }

      case 'SET': {
        if (data === null || data === undefined) {
          throw new ApiError('数据不能为空', ErrorCodes.VALIDATION_ERROR, 400)
        }
        localStorage.setItem(key, JSON.stringify(data))
        return data
      }

      case 'DELETE':
        localStorage.removeItem(key)
        return null

      default:
        throw new ApiError('不支持的操作', ErrorCodes.SERVER_ERROR, 500)
    }
  } catch (error) {
    // 处理JSON解析错误
    if (error instanceof SyntaxError) {
      throw new ApiError('数据格式错误', ErrorCodes.SERVER_ERROR, 500, error)
    }
    throw ApiError.fromError(error)
  }
}

/**
 * API请求封装
 */
export class ApiClient {
  constructor(baseURL = '', timeout = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.interceptors = {
      request: [],
      response: []
    }
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor)
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor)
  }

  /**
   * GET请求
   */
  async get(key) {
    try {
      const data = await mockRequest('GET', key)
      return ApiResponse.success(data)
    } catch (error) {
      return ApiResponse.error(ApiError.fromError(error))
    }
  }

  /**
   * POST请求（创建）
   */
  async post(key, data) {
    try {
      const result = await mockRequest('SET', key, data)
      return ApiResponse.success(result)
    } catch (error) {
      return ApiResponse.error(ApiError.fromError(error))
    }
  }

  /**
   * PUT请求（更新）
   */
  async put(key, data) {
    try {
      const result = await mockRequest('SET', key, data)
      return ApiResponse.success(result)
    } catch (error) {
      return ApiResponse.error(ApiError.fromError(error))
    }
  }

  /**
   * DELETE请求
   */
  async delete(key) {
    try {
      await mockRequest('DELETE', key)
      return ApiResponse.success(null)
    } catch (error) {
      return ApiResponse.error(ApiError.fromError(error))
    }
  }

  /**
   * 通用请求方法（未来迁移到真实API时使用）
   */
  async request(config) {
    const { method = 'GET', url, data, params, headers = {} } = config

    try {
      // 应用请求拦截器
      let requestConfig = { method, url, data, params, headers }
      for (const interceptor of this.interceptors.request) {
        requestConfig = await interceptor(requestConfig)
      }

      // 执行请求（当前使用mockRequest，未来替换为fetch/axios）
      let response
      if (method === 'GET') {
        response = await this.get(url)
      } else if (method === 'POST') {
        response = await this.post(url, data)
      } else if (method === 'PUT') {
        response = await this.put(url, data)
      } else if (method === 'DELETE') {
        response = await this.delete(url)
      } else {
        throw new ApiError(`不支持的HTTP方法: ${method}`, ErrorCodes.SERVER_ERROR, 500)
      }

      // 应用响应拦截器
      for (const interceptor of this.interceptors.response) {
        response = await interceptor(response)
      }

      return response
    } catch (error) {
      return ApiResponse.error(ApiError.fromError(error))
    }
  }
}

/**
 * 创建默认API客户端实例
 */
export const apiClient = new ApiClient()

/**
 * 添加默认请求拦截器（例如：添加认证token）
 */
apiClient.addRequestInterceptor(async config => {
  // 未来可以在这里添加认证token等
  // const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
  // if (user && user.token) {
  //   config.headers['Authorization'] = `Bearer ${user.token}`
  // }
  return config
})

/**
 * 添加默认响应拦截器（统一错误处理）
 */
apiClient.addResponseInterceptor(async response => {
  if (!response.success && response.error) {
    // 可以在这里添加全局错误处理逻辑
    // 例如：显示错误提示、记录日志等
    console.error('API错误:', response.error)
  }
  return response
})

/**
 * 便捷方法：处理API响应
 * @param {ApiResponse} response - API响应对象
 * @param {Function} onSuccess - 成功回调
 * @param {Function} onError - 错误回调（可选）
 * @returns {Promise} 返回处理结果
 */
export async function handleResponse(response, onSuccess, onError = null) {
  if (response.success) {
    return await onSuccess(response.data)
  } else {
    const error = response.error
    if (onError) {
      return await onError(error)
    } else {
      // 默认错误处理：抛出错误
      throw error
    }
  }
}

/**
 * 便捷方法：安全执行API调用
 * @param {Function} apiCall - API调用函数
 * @param {Function} onError - 错误处理函数（可选）
 * @returns {Promise} 返回处理结果
 */
export async function safeApiCall(apiCall, onError = null) {
  try {
    return await apiCall()
  } catch (error) {
    const apiError = ApiError.fromError(error)
    if (onError) {
      return await onError(apiError)
    } else {
      console.error('API调用失败:', apiError)
      throw apiError
    }
  }
}

// 导出默认实例
export default apiClient
