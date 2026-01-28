/**
 * 核心数据类型和接口定义
 * 使用JSDoc注释提供类型信息，便于代码提示和文档生成
 */

/**
 * 愿望状态枚举
 * @typedef {'draft' | 'published' | 'archived'} WishStatus
 */

/**
 * 用户角色枚举
 * @typedef {'admin' | 'user'} UserRole
 */

/**
 * 岗位类型枚举
 * @typedef {'开发' | '设计' | '产品' | '运营' | '行政' | '测试' | '人事' | '财务'} JobType
 */

/**
 * 评论数据模型
 * @typedef {Object} Comment
 * @property {number|string} id - 评论ID
 * @property {string} author - 评论作者
 * @property {string} content - 评论内容
 * @property {string} createdAt - 创建时间（ISO 8601格式）
 */

/**
 * 愿望数据模型
 * @typedef {Object} Wish
 * @property {number|string} id - 愿望ID
 * @property {string} title - 愿望名称
 * @property {string} description - 需求描述
 * @property {JobType} job - 提交者岗位
 * @property {string} submitter - 提交者姓名
 * @property {string} [submitterId] - 提交者ID（可选）
 * @property {number} likes - 点赞数
 * @property {Comment[]} comments - 评论列表
 * @property {string} createdAt - 创建时间（ISO 8601格式）
 * @property {WishStatus} status - 愿望状态（draft: 草稿, published: 已发布, archived: 已归档）
 */

/**
 * 用户数据模型
 * @typedef {Object} User
 * @property {string} id - 用户ID
 * @property {string} name - 用户姓名
 * @property {string} email - 用户邮箱
 * @property {UserRole} role - 用户角色（admin: 管理员, user: 普通用户）
 * @property {JobType} [job] - 用户岗位（可选）
 * @property {string} [token] - 认证令牌（可选，用于未来API认证）
 */

/**
 * 愿望表单数据模型（用于创建/编辑愿望）
 * @typedef {Object} WishFormData
 * @property {string} title - 愿望名称
 * @property {string} description - 需求描述
 * @property {JobType} job - 提交者岗位
 * @property {string} submitter - 提交者姓名
 * @property {WishStatus} [status] - 愿望状态（可选，默认为draft）
 */

/**
 * 岗位匹配信息
 * @typedef {Object} MatchInfo
 * @property {number} score - 匹配度分数（0-100）
 * @property {string} level - 匹配等级（高度匹配、中度匹配、低度匹配、不匹配）
 * @property {string} color - 匹配等级颜色
 * @property {string} icon - 匹配等级图标
 * @property {JobType} userJob - 用户岗位
 * @property {JobType} wishJob - 愿望岗位
 */

/**
 * API响应包装类
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 请求是否成功
 * @property {*} [data] - 响应数据
 * @property {ApiError} [error] - 错误信息（如果请求失败）
 * @property {string} timestamp - 响应时间戳（ISO 8601格式）
 */

/**
 * API错误类
 * @typedef {Object} ApiError
 * @property {string} name - 错误名称（固定为'ApiError'）
 * @property {string} message - 错误消息
 * @property {string} code - 错误代码
 * @property {number} statusCode - HTTP状态码
 * @property {*} [details] - 错误详情（可选）
 */

/**
 * 愿望列表查询参数
 * @typedef {Object} WishListQuery
 * @property {JobType|'全部'} [job] - 岗位筛选（可选，默认为'全部'）
 * @property {'newest' | 'oldest' | 'likes'} [sortBy] - 排序方式（可选，默认为'newest'）
 * @property {number} [page] - 页码（可选，用于未来分页）
 * @property {number} [pageSize] - 每页数量（可选，用于未来分页）
 */

/**
 * 愿望统计信息
 * @typedef {Object} WishStats
 * @property {number} total - 总愿望数
 * @property {number} published - 已发布愿望数
 * @property {number} draft - 草稿愿望数
 * @property {number} archived - 已归档愿望数
 * @property {Record<JobType, number>} byJob - 按岗位分类统计
 */

/**
 * 用户统计信息
 * @typedef {Object} UserStats
 * @property {number} totalWishes - 用户提交的愿望总数
 * @property {number} publishedWishes - 已发布的愿望数
 * @property {number} draftWishes - 草稿愿望数
 * @property {number} totalLikes - 用户获得的点赞总数
 * @property {number} totalComments - 用户获得的评论总数
 */

/**
 * 收藏数据模型
 * @typedef {Object} Favorite
 * @property {number|string} wishId - 愿望ID
 * @property {string} userId - 用户ID
 * @property {string} createdAt - 收藏时间（ISO 8601格式）
 */

/**
 * 点赞数据模型
 * @typedef {Object} Like
 * @property {number|string} wishId - 愿望ID
 * @property {string} userId - 用户ID
 * @property {string} createdAt - 点赞时间（ISO 8601格式）
 */

// 导出类型定义（用于JSDoc类型检查）
export const Types = {
  WishStatus: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  },
  UserRole: {
    ADMIN: 'admin',
    USER: 'user'
  },
  JobType: {
    DEVELOPER: '开发',
    DESIGNER: '设计',
    PRODUCT: '产品',
    OPERATION: '运营',
    ADMINISTRATION: '行政',
    TESTER: '测试',
    HR: '人事',
    FINANCE: '财务'
  },
  SortBy: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    LIKES: 'likes'
  }
}

/**
 * 验证愿望对象是否符合Wish类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合Wish类型
 */
export function isValidWish(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.id !== 'undefined' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.job === 'string' &&
    typeof obj.submitter === 'string' &&
    typeof obj.likes === 'number' &&
    Array.isArray(obj.comments) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.status === 'string'
  )
}

/**
 * 验证用户对象是否符合User类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合User类型
 */
export function isValidUser(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    (obj.role === 'admin' || obj.role === 'user')
  )
}

/**
 * 验证评论对象是否符合Comment类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合Comment类型
 */
export function isValidComment(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.id !== 'undefined' &&
    typeof obj.author === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.createdAt === 'string'
  )
}

// 默认导出
export default {
  Types,
  isValidWish,
  isValidUser,
  isValidComment
}
