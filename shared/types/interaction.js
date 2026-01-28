/**
 * 互动相关 DTO 类型定义
 * 使用JSDoc注释提供类型信息，便于代码提示和文档生成
 */

/**
 * 点赞请求数据模型
 * @typedef {Object} LikeRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 点赞响应数据模型
 * @typedef {Object} LikeResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} liked - 当前是否已点赞
 * @property {number} totalLikes - 总点赞数
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 取消点赞请求数据模型
 * @typedef {Object} UnlikeRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 取消点赞响应数据模型
 * @typedef {Object} UnlikeResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} liked - 当前是否已点赞（应为false）
 * @property {number} totalLikes - 总点赞数
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 收藏请求数据模型
 * @typedef {Object} FavoriteRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 收藏响应数据模型
 * @typedef {Object} FavoriteResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} favorited - 当前是否已收藏
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 取消收藏请求数据模型
 * @typedef {Object} UnfavoriteRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 取消收藏响应数据模型
 * @typedef {Object} UnfavoriteResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} favorited - 当前是否已收藏（应为false）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 评论创建请求数据模型
 * @typedef {Object} CreateCommentRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} content - 评论内容
 * @property {string} [author] - 评论作者（可选，后端自动获取）
 * @property {string} [authorId] - 评论作者ID（可选，后端自动获取）
 */

/**
 * 评论创建响应数据模型
 * @typedef {Object} CreateCommentResponse
 * @property {boolean} success - 操作是否成功
 * @property {Comment} [comment] - 创建的评论对象（可选）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 评论更新请求数据模型
 * @typedef {Object} UpdateCommentRequest
 * @property {number|string} commentId - 评论ID
 * @property {string} content - 更新后的评论内容
 */

/**
 * 评论更新响应数据模型
 * @typedef {Object} UpdateCommentResponse
 * @property {boolean} success - 操作是否成功
 * @property {Comment} [comment] - 更新后的评论对象（可选）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 评论删除请求数据模型
 * @typedef {Object} DeleteCommentRequest
 * @property {number|string} commentId - 评论ID
 * @property {number|string} wishId - 愿望ID（可选，用于验证）
 */

/**
 * 评论删除响应数据模型
 * @typedef {Object} DeleteCommentResponse
 * @property {boolean} success - 操作是否成功
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 获取评论列表请求数据模型
 * @typedef {Object} GetCommentsRequest
 * @property {number|string} wishId - 愿望ID
 * @property {number} [page] - 页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 * @property {'newest' | 'oldest'} [sortBy] - 排序方式（可选，默认为'newest'）
 */

/**
 * 获取评论列表响应数据模型
 * @typedef {Object} GetCommentsResponse
 * @property {boolean} success - 操作是否成功
 * @property {Comment[]} [comments] - 评论列表（可选）
 * @property {number} [total] - 总评论数（可选，用于分页）
 * @property {number} [page] - 当前页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 检查点赞状态请求数据模型
 * @typedef {Object} CheckLikeStatusRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 检查点赞状态响应数据模型
 * @typedef {Object} CheckLikeStatusResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} liked - 是否已点赞
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 检查收藏状态请求数据模型
 * @typedef {Object} CheckFavoriteStatusRequest
 * @property {number|string} wishId - 愿望ID
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 */

/**
 * 检查收藏状态响应数据模型
 * @typedef {Object} CheckFavoriteStatusResponse
 * @property {boolean} success - 操作是否成功
 * @property {boolean} favorited - 是否已收藏
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 获取用户收藏列表请求数据模型
 * @typedef {Object} GetFavoritesRequest
 * @property {string} [userId] - 用户ID（可选，后端自动获取）
 * @property {number} [page] - 页码（可选，用于分页）
 * @property {number} [pageSize] - 每页数量（可选，用于分页）
 */

/**
 * 获取用户收藏列表响应数据模型
 * @typedef {Object} GetFavoritesResponse
 * @property {boolean} success - 操作是否成功
 * @property {Favorite[]} [favorites] - 收藏列表（可选）
 * @property {Wish[]} [wishes] - 收藏的愿望列表（可选）
 * @property {number} [total] - 总收藏数（可选，用于分页）
 * @property {string} [message] - 响应消息（可选）
 */

/**
 * 互动错误类型枚举
 * @typedef {'WISH_NOT_FOUND' | 'COMMENT_NOT_FOUND' | 'ALREADY_LIKED' | 'ALREADY_FAVORITED' | 'NOT_LIKED' | 'NOT_FAVORITED' | 'UNAUTHORIZED' | 'FORBIDDEN'} InteractionErrorCode
 */

/**
 * 互动错误数据模型
 * @typedef {Object} InteractionError
 * @property {InteractionErrorCode} code - 错误代码
 * @property {string} message - 错误消息
 * @property {string} [field] - 错误字段（可选，用于表单验证）
 */

/**
 * 互动统计信息
 * @typedef {Object} InteractionStats
 * @property {number|string} wishId - 愿望ID
 * @property {number} totalLikes - 总点赞数
 * @property {number} totalFavorites - 总收藏数
 * @property {number} totalComments - 总评论数
 * @property {boolean} [userLiked] - 当前用户是否已点赞（可选）
 * @property {boolean} [userFavorited] - 当前用户是否已收藏（可选）
 */

// 导出类型定义（用于JSDoc类型检查）
export const InteractionTypes = {
  ErrorCode: {
    WISH_NOT_FOUND: 'WISH_NOT_FOUND',
    COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
    ALREADY_LIKED: 'ALREADY_LIKED',
    ALREADY_FAVORITED: 'ALREADY_FAVORITED',
    NOT_LIKED: 'NOT_LIKED',
    NOT_FAVORITED: 'NOT_FAVORITED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN'
  },
  SortBy: {
    NEWEST: 'newest',
    OLDEST: 'oldest'
  }
}

/**
 * 验证点赞请求对象是否符合LikeRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合LikeRequest类型
 */
export function isValidLikeRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (typeof obj.wishId === 'number' || typeof obj.wishId === 'string') &&
    obj.wishId !== '' &&
    (obj.userId === undefined || typeof obj.userId === 'string')
  )
}

/**
 * 验证收藏请求对象是否符合FavoriteRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合FavoriteRequest类型
 */
export function isValidFavoriteRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (typeof obj.wishId === 'number' || typeof obj.wishId === 'string') &&
    obj.wishId !== '' &&
    (obj.userId === undefined || typeof obj.userId === 'string')
  )
}

/**
 * 验证评论创建请求对象是否符合CreateCommentRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合CreateCommentRequest类型
 */
export function isValidCreateCommentRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (typeof obj.wishId === 'number' || typeof obj.wishId === 'string') &&
    obj.wishId !== '' &&
    typeof obj.content === 'string' &&
    obj.content.trim().length > 0
  )
}

/**
 * 验证评论更新请求对象是否符合UpdateCommentRequest类型定义
 * @param {*} obj - 待验证的对象
 * @returns {boolean} 是否符合UpdateCommentRequest类型
 */
export function isValidUpdateCommentRequest(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  return (
    (typeof obj.commentId === 'number' || typeof obj.commentId === 'string') &&
    obj.commentId !== '' &&
    typeof obj.content === 'string' &&
    obj.content.trim().length > 0
  )
}

// 默认导出
export default {
  InteractionTypes,
  isValidLikeRequest,
  isValidFavoriteRequest,
  isValidCreateCommentRequest,
  isValidUpdateCommentRequest
}
