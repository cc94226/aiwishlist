/**
 * 愿望相关 DTO 类型定义
 * 使用JSDoc注释提供类型信息，便于代码提示和文档生成
 */

/**
 * 创建愿望请求数据模型
 * @typedef {Object} CreateWishRequest
 * @property {string} title - 愿望名称
 * @property {string} description - 需求描述
 * @property {JobType} job - 提交者岗位
 * @property {string} submitter - 提交者姓名
 * @property {string} [submitterId] - 提交者ID（可选）
 * @property {WishStatus} [status] - 愿望状态（可选，默认为draft）
 */

/**
 * 创建愿望响应数据模型
 * @typedef {Object} CreateWishResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish} [wish] - 创建的愿望对象（可选）
 * @property {string} [message] - 响应消息（可选）
 * @property {string[]} [errors] - 错误列表（可选，用于表单验证）
 */

/**
 * 更新愿望请求数据模型
 * @typedef {Object} UpdateWishRequest
 * @property {number|string} id - 愿望ID
 * @property {string} [title] - 愿望名称（可选）
 * @property {string} [description] - 需求描述（可选）
 * @property {JobType} [job] - 提交者岗位（可选）
 * @property {string} [submitter] - 提交者姓名（可选）
 * @property {WishStatus} [status] - 愿望状态（可选）
 */

/**
 * 更新愿望响应数据模型
 * @typedef {Object} UpdateWishResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish} [wish] - 更新后的愿望对象（可选）
 * @property {string} [message] - 响应消息（可选）
 * @property {string[]} [errors] - 错误列表（可选，用于表单验证）
 */

/**
 * 删除愿望请求数据模型
 * @typedef {Object} DeleteWishRequest
 * @property {number|string} id - 愿望ID
 */

/**
 * 删除愿望响应数据模型
 * @typedef {Object} DeleteWishResponse
 * @property {boolean} success - 操作是否成功
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 获取愿望列表请求数据模型
 * @typedef {Object} GetWishListRequest
 * @property {JobType|'全部'} [job] - 岗位筛选（可选，默认为'全部'）
 * @property {'newest' | 'oldest' | 'likes'} [sortBy] - 排序方式（可选，默认为'newest'）
 * @property {number} [page] - 页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 * @property {WishStatus} [status] - 愿望状态筛选（可选）
 * @property {string} [keyword] - 关键词搜索（可选）
 */

/**
 * 获取愿望列表响应数据模型
 * @typedef {Object} GetWishListResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish[]} [wishes] - 愿望列表（可选）
 * @property {number} [total] - 总愿望数（可选，用于分页）
 * @property {number} [page] - 当前页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 获取愿望详情请求数据模型
 * @typedef {Object} GetWishDetailRequest
 * @property {number|string} id - 愿望ID
 */

/**
 * 获取愿望详情响应数据模型
 * @typedef {Object} GetWishDetailResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish} [wish] - 愿望对象（可选）
 * @property {MatchInfo} [matchInfo] - 岗位匹配信息（可选，如果提供了用户岗位）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 搜索愿望请求数据模型
 * @typedef {Object} SearchWishRequest
 * @property {string} keyword - 搜索关键词
 * @property {JobType|'全部'} [job] - 岗位筛选（可选）
 * @property {'newest' | 'oldest' | 'likes'} [sortBy] - 排序方式（可选，默认为'newest'）
 * @property {number} [page] - 页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 */

/**
 * 搜索愿望响应数据模型
 * @typedef {Object} SearchWishResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish[]} [wishes] - 搜索结果列表（可选）
 * @property {number} [total] - 总结果数（可选，用于分页）
 * @property {number} [page] - 当前页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 获取用户愿望列表请求数据模型
 * @typedef {Object} GetUserWishesRequest
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 * @property {WishStatus} [status] - 愿望状态筛选（可选）
 * @property {number} [page] - 页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 */

/**
 * 获取用户愿望列表响应数据模型
 * @typedef {Object} GetUserWishesResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish[]} [wishes] - 愿望列表（可选）
 * @property {number} [total] - 总愿望数（可选，用于分页）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 愿望状态更新请求数据模型
 * @typedef {Object} UpdateWishStatusRequest
 * @property {number|string} id - 愿望ID
 * @property {WishStatus} status - 新的愿望状态
 */

/**
 * 愿望状态更新响应数据模型
 * @typedef {Object} UpdateWishStatusResponse
 * @property {boolean} success - 操作是否成功
 * @property {Wish} [wish] - 更新后的愿望对象（可选）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 愿望错误类型枚举
 * @typedef {'WISH_NOT_FOUND' | 'INVALID_WISH_DATA' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION_ERROR'} WishErrorCode
 */

/**
 * 愿望错误数据模型
 * @typedef {Object} WishError
 * @property {WishErrorCode} code - 错误代码
 * @property {string} message - 错误消息
 * @property {string} [field] - 错误字段（可选，用于表单验证）
 * @property {string[]} [errors] - 详细错误列表（可选）
 */

/**
 * 愿望统计请求数据模型
 * @typedef {Object} GetWishStatsRequest
 * @property {JobType|'全部'} [job] - 岗位筛选（可选）
 * @property {WishStatus} [status] - 愿望状态筛选（可选）
 */

/**
 * 愿望统计响应数据模型
 * @typedef {Object} GetWishStatsResponse
 * @property {boolean} success - 操作是否成功
 * @property {WishStats} [stats] - 统计信息（可选）
 * @property {string} [message] - 响应消息（可选）
 */

// 导出类型定义（用于JSDoc类型检查）
export const WishTypes = {
  ErrorCode: {
    WISH_NOT_FOUND: 'WISH_NOT_FOUND',
    INVALID_WISH_DATA: 'INVALID_WISH_DATA',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  },
  SortBy: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    LIKES: 'likes'
  }
}

/**
 * 验证创建愿望请求对象是否符合CreateWishRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合CreateWishRequest类型
 */
export function isValidCreateWishRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.title === 'string' &&
    obj.title.trim().length > 0 &&
    typeof obj.description === 'string' &&
    obj.description.trim().length > 0 &&
    typeof obj.job === 'string' &&
    obj.job.length > 0 &&
    typeof obj.submitter === 'string' &&
    obj.submitter.trim().length > 0
  )
}

/**
 * 验证更新愿望请求对象是否符合UpdateWishRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合UpdateWishRequest类型
 */
export function isValidUpdateWishRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (typeof obj.id === 'number' || typeof obj.id === 'string') &&
    obj.id !== '' &&
    (obj.title === undefined || (typeof obj.title === 'string' && obj.title.trim().length > 0)) &&
    (obj.description === undefined ||
      (typeof obj.description === 'string' && obj.description.trim().length > 0)) &&
    (obj.job === undefined || (typeof obj.job === 'string' && obj.job.length > 0)) &&
    (obj.submitter === undefined ||
      (typeof obj.submitter === 'string' && obj.submitter.trim().length > 0))
  )
}

/**
 * 验证获取愿望列表请求对象是否符合GetWishListRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合GetWishListRequest类型
 */
export function isValidGetWishListRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (obj.job === undefined || typeof obj.job === 'string') &&
    (obj.sortBy === undefined ||
      obj.sortBy === 'newest' ||
      obj.sortBy === 'oldest' ||
      obj.sortBy === 'likes') &&
    (obj.page === undefined || (typeof obj.page === 'number' && obj.page > 0)) &&
    (obj.pageSize === undefined || (typeof obj.pageSize === 'number' && obj.pageSize > 0))
  )
}

/**
 * 验证搜索愿望请求对象是否符合SearchWishRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合SearchWishRequest类型
 */
export function isValidSearchWishRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    typeof obj.keyword === 'string' &&
    obj.keyword.trim().length > 0 &&
    (obj.job === undefined || typeof obj.job === 'string') &&
    (obj.sortBy === undefined ||
      obj.sortBy === 'newest' ||
      obj.sortBy === 'oldest' ||
      obj.sortBy === 'likes')
  )
}

// 默认导出
export default {
  WishTypes,
  isValidCreateWishRequest,
  isValidUpdateWishRequest,
  isValidGetWishListRequest,
  isValidSearchWishRequest
}
