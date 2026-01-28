/**
 * 认证相关 DTO 类型定义
 * 使用JSDoc注释提供类型信息，便于代码提示和文档生成
 */

/**
 * 登录请求数据模型
 * @typedef {Object} LoginRequest
 * @property {string} email - 用户邮箱
 * @property {string} password - 用户密码
 * @property {boolean} [rememberMe] - 是否记住我（可选）
 */

/**
 * 登录响应数据模型
 * @typedef {Object} LoginResponse
 * @property {boolean} success - 登录是否成功
 * @property {string} [token] - 认证令牌（可选，用于未来API认证）
 * @property {User} [user] - 用户信息（可选）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 注册请求数据模型
 * @typedef {Object} RegisterRequest
 * @property {string} name - 用户姓名
 * @property {string} email - 用户邮箱
 * @property {string} password - 用户密码
 * @property {string} [confirmPassword] - 确认密码（可选，前端验证用）
 * @property {JobType} [job] - 用户岗位（可选）
 */

/**
 * 注册响应数据模型
 * @typedef {Object} RegisterResponse
 * @property {boolean} success - 注册是否成功
 * @property {User} [user] - 用户信息（可选）
 * @property {string} [message] - 响应消息（可选）
 * @property {string[]} [errors] - 错误列表（可选，用于表单验证）
 */

/**
 * 用户信息更新请求数据模型
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - 用户姓名（可选）
 * @property {string} [email] - 用户邮箱（可选）
 * @property {JobType} [job] - 用户岗位（可选）
 * @property {string} [password] - 新密码（可选）
 * @property {string} [oldPassword] - 旧密码（可选，修改密码时需要）
 */

/**
 * 用户信息更新响应数据模型
 * @typedef {Object} UpdateUserResponse
 * @property {boolean} success - 更新是否成功
 * @property {User} [user] - 更新后的用户信息（可选）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 密码重置请求数据模型
 * @typedef {Object} ResetPasswordRequest
 * @property {string} email - 用户邮箱
 */

/**
 * 密码重置响应数据模型
 * @typedef {Object} ResetPasswordResponse
 * @property {boolean} success - 请求是否成功
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 密码修改请求数据模型
 * @typedef {Object} ChangePasswordRequest
 * @property {string} oldPassword - 旧密码
 * @property {string} newPassword - 新密码
 * @property {string} [confirmPassword] - 确认新密码（可选，前端验证用）
 */

/**
 * 密码修改响应数据模型
 * @typedef {Object} ChangePasswordResponse
 * @property {boolean} success - 修改是否成功
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 认证令牌验证请求数据模型
 * @typedef {Object} VerifyTokenRequest
 * @property {string} token - 认证令牌
 */

/**
 * 认证令牌验证响应数据模型
 * @typedef {Object} VerifyTokenResponse
 * @property {boolean} valid - 令牌是否有效
 * @property {User} [user] - 用户信息（可选，令牌有效时返回）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 登出请求数据模型
 * @typedef {Object} LogoutRequest
 * @property {string} [token] - 认证令牌（可选，用于未来API认证）
 */

/**
 * 登出响应数据模型
 * @typedef {Object} LogoutResponse
 * @property {boolean} success - 登出是否成功
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 认证错误类型枚举
 * @typedef {'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'EMAIL_EXISTS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'UNAUTHORIZED' | 'FORBIDDEN'} AuthErrorCode
 */

/**
 * 认证错误数据模型
 * @typedef {Object} AuthError
 * @property {AuthErrorCode} code - 错误代码
 * @property {string} message - 错误消息
 * @property {string} [field] - 错误字段（可选，用于表单验证）
 */

/**
 * 用户会话数据模型
 * @typedef {Object} UserSession
 * @property {string} userId - 用户ID
 * @property {string} token - 认证令牌
 * @property {string} expiresAt - 过期时间（ISO 8601格式）
 * @property {string} createdAt - 创建时间（ISO 8601格式）
 * @property {string} [ipAddress] - IP地址（可选）
 * @property {string} [userAgent] - 用户代理（可选）
 */

// 导出类型定义（用于JSDoc类型检查）
export const AuthTypes = {
  ErrorCode: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN'
  }
}

/**
 * 验证登录请求对象是否符合LoginRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合LoginRequest类型
 */
export function isValidLoginRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.email === 'string' &&
    obj.email.length > 0 &&
    typeof obj.password === 'string' &&
    obj.password.length > 0 &&
    (obj.rememberMe === undefined || typeof obj.rememberMe === 'boolean')
  )
}

/**
 * 验证注册请求对象是否符合RegisterRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合RegisterRequest类型
 */
export function isValidRegisterRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.email === 'string' &&
    obj.email.length > 0 &&
    typeof obj.password === 'string' &&
    obj.password.length > 0
  )
}

/**
 * 验证密码修改请求对象是否符合ChangePasswordRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合ChangePasswordRequest类型
 */
export function isValidChangePasswordRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.oldPassword === 'string' &&
    obj.oldPassword.length > 0 &&
    typeof obj.newPassword === 'string' &&
    obj.newPassword.length > 0
  )
}

// 默认导出
export default {
  AuthTypes,
  isValidLoginRequest,
  isValidRegisterRequest,
  isValidChangePasswordRequest
}
