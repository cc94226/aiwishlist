import {
  LikeModel,
  FavoriteModel,
  CommentModel,
  Favorite,
  Comment,
  CreateCommentData,
  UpdateCommentData,
  CommentQueryResult
} from '../models/Interaction'
import { WishModel } from '../models/Wish'
import { AppError } from '../middleware/errorHandler'
import { getCacheService, CacheKeys } from './CacheService'

/**
 * 点赞请求参数
 */
export interface LikeRequest {
  wishId: string
  userId: string
}

/**
 * 取消点赞请求参数
 */
export interface UnlikeRequest {
  wishId: string
  userId: string
}

/**
 * 收藏请求参数
 */
export interface FavoriteRequest {
  wishId: string
  userId: string
}

/**
 * 取消收藏请求参数
 */
export interface UnfavoriteRequest {
  wishId: string
  userId: string
}

/**
 * 创建评论请求参数
 */
export interface CreateCommentRequest {
  wishId: string
  content: string
  author: string
  authorId?: string | null
}

/**
 * 更新评论请求参数
 */
export interface UpdateCommentRequest {
  commentId: string
  content: string
  userId: string
  isAdmin?: boolean
}

/**
 * 删除评论请求参数
 */
export interface DeleteCommentRequest {
  commentId: string
  userId: string
  isAdmin?: boolean
}

/**
 * 获取评论列表请求参数
 */
export interface GetCommentsRequest {
  wishId: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 获取用户收藏列表请求参数
 */
export interface GetFavoritesRequest {
  userId: string
  page?: number
  pageSize?: number
}

/**
 * 互动统计信息
 */
export interface InteractionStats {
  wishId: string
  totalLikes: number
  totalFavorites: number
  totalComments: number
  userLiked?: boolean
  userFavorited?: boolean
}

/**
 * 互动服务类
 * 提供点赞、收藏、评论相关的业务逻辑
 */
export class InteractionService {
  /**
   * 点赞愿望
   * @param request 点赞请求参数
   * @returns Promise<{ liked: boolean; totalLikes: number }> 点赞结果和总点赞数
   */
  static async likeWish(request: LikeRequest): Promise<{ liked: boolean; totalLikes: number }> {
    const { wishId, userId } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 添加点赞
    await LikeModel.create({ wish_id: wishId, user_id: userId })

    // 获取更新后的点赞数（数据库触发器会自动更新wishes表的likes字段）
    const updatedWish = await WishModel.findById(wishId)
    if (!updatedWish) {
      throw new AppError('获取愿望信息失败', 500, 'GET_WISH_FAILED')
    }

    // 清除相关缓存（点赞会影响愿望的点赞数）
    const cacheService = getCacheService()
    cacheService.delete(CacheKeys.wishDetail(wishId)) // 清除愿望详情缓存
    cacheService.deletePattern('wish:list:*') // 清除愿望列表缓存（可能按点赞数排序）
    cacheService.deletePattern('wish:popular:*') // 清除热门愿望缓存（按点赞数排序）

    return {
      liked: true,
      totalLikes: updatedWish.likes
    }
  }

  /**
   * 取消点赞
   * @param request 取消点赞请求参数
   * @returns Promise<{ liked: boolean; totalLikes: number }> 取消点赞结果和总点赞数
   */
  static async unlikeWish(request: UnlikeRequest): Promise<{ liked: boolean; totalLikes: number }> {
    const { wishId, userId } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 检查是否已点赞
    const hasLiked = await LikeModel.isLiked(wishId, userId)
    if (!hasLiked) {
      throw new AppError('您还没有点赞过这个愿望', 400, 'NOT_LIKED')
    }

    // 取消点赞
    await LikeModel.delete(wishId, userId)

    // 获取更新后的点赞数（数据库触发器会自动更新wishes表的likes字段）
    const updatedWish = await WishModel.findById(wishId)
    if (!updatedWish) {
      throw new AppError('获取愿望信息失败', 500, 'GET_WISH_FAILED')
    }

    // 清除相关缓存（取消点赞会影响愿望的点赞数）
    const cacheService = getCacheService()
    await cacheService.delete(CacheKeys.wishDetail(wishId)) // 清除愿望详情缓存
    await cacheService.deletePattern('wish:list:*') // 清除愿望列表缓存（可能按点赞数排序）
    await cacheService.deletePattern('wish:popular:*') // 清除热门愿望缓存（按点赞数排序）

    return {
      liked: false,
      totalLikes: updatedWish.likes
    }
  }

  /**
   * 检查点赞状态
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已点赞
   */
  static async checkLikeStatus(wishId: string, userId: string): Promise<boolean> {
    return await LikeModel.isLiked(wishId, userId)
  }

  /**
   * 收藏愿望
   * @param request 收藏请求参数
   * @returns Promise<{ favorited: boolean }> 收藏结果
   */
  static async favoriteWish(request: FavoriteRequest): Promise<{ favorited: boolean }> {
    const { wishId, userId } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 添加收藏
    await FavoriteModel.create({ wish_id: wishId, user_id: userId })

    return {
      favorited: true
    }
  }

  /**
   * 取消收藏
   * @param request 取消收藏请求参数
   * @returns Promise<{ favorited: boolean }> 取消收藏结果
   */
  static async unfavoriteWish(request: UnfavoriteRequest): Promise<{ favorited: boolean }> {
    const { wishId, userId } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 检查是否已收藏
    const hasFavorited = await FavoriteModel.isFavorited(wishId, userId)
    if (!hasFavorited) {
      throw new AppError('您还没有收藏过这个愿望', 400, 'NOT_FAVORITED')
    }

    // 取消收藏
    await FavoriteModel.delete(wishId, userId)

    return {
      favorited: false
    }
  }

  /**
   * 检查收藏状态
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已收藏
   */
  static async checkFavoriteStatus(wishId: string, userId: string): Promise<boolean> {
    return await FavoriteModel.isFavorited(wishId, userId)
  }

  /**
   * 创建评论
   * @param request 创建评论请求参数
   * @returns Promise<Comment> 创建的评论信息
   */
  static async createComment(request: CreateCommentRequest): Promise<Comment> {
    const { wishId, content, author, authorId } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 验证愿望状态：只有已发布的愿望可以评论
    if (wish.status !== 'published') {
      throw new AppError('只有已发布的愿望才能评论', 400, 'WISH_NOT_PUBLISHED')
    }

    // 创建评论
    const commentData: CreateCommentData = {
      wish_id: wishId,
      content,
      author,
      author_id: authorId || null
    }

    const comment = await CommentModel.create(commentData)

    // 清除相关缓存（创建评论会影响愿望的评论数）
    const cacheService = getCacheService()
    await cacheService.delete(CacheKeys.wishDetail(wishId)) // 清除愿望详情缓存

    return comment
  }

  /**
   * 更新评论
   * @param request 更新评论请求参数
   * @returns Promise<Comment> 更新后的评论信息
   */
  static async updateComment(request: UpdateCommentRequest): Promise<Comment> {
    const { commentId, content, userId, isAdmin = false } = request

    // 检查评论是否存在
    const existingComment = await CommentModel.findById(commentId)
    if (!existingComment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    // 权限控制：只有评论作者或管理员可以更新评论
    if (!isAdmin && existingComment.author_id !== userId) {
      throw new AppError('无权更新该评论', 403, 'FORBIDDEN')
    }

    const commentData: UpdateCommentData = {
      content
    }

    const comment = await CommentModel.update(commentId, commentData)

    // 清除相关缓存（更新评论会影响愿望详情）
    const cacheService = getCacheService()
    await cacheService.delete(CacheKeys.wishDetail(existingComment.wish_id)) // 清除愿望详情缓存

    return comment
  }

  /**
   * 删除评论
   * @param request 删除评论请求参数
   * @returns Promise<boolean> 是否成功删除
   */
  static async deleteComment(request: DeleteCommentRequest): Promise<boolean> {
    const { commentId, userId, isAdmin = false } = request

    // 检查评论是否存在
    const existingComment = await CommentModel.findById(commentId)
    if (!existingComment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    // 权限控制：只有评论作者或管理员可以删除评论
    if (!isAdmin && existingComment.author_id !== userId) {
      throw new AppError('无权删除该评论', 403, 'FORBIDDEN')
    }

    const wishId = existingComment.wish_id // 保存愿望ID用于清除缓存
    await CommentModel.delete(commentId)

    // 清除相关缓存（删除评论会影响愿望的评论数）
    const cacheService = getCacheService()
    await cacheService.delete(CacheKeys.wishDetail(wishId)) // 清除愿望详情缓存

    return true
  }

  /**
   * 获取评论列表
   * @param request 获取评论列表请求参数
   * @returns Promise<CommentQueryResult> 评论列表和分页信息
   */
  static async getComments(request: GetCommentsRequest): Promise<CommentQueryResult> {
    const { wishId, page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'DESC' } = request

    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    const result = await CommentModel.findByWishId(wishId, {
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy,
      sortOrder
    })
    return result
  }

  /**
   * 获取用户收藏列表
   * @param request 获取用户收藏列表请求参数
   * @returns Promise<{ favorites: Favorite[]; total: number; page: number; pageSize: number }> 收藏列表和分页信息
   */
  static async getFavorites(request: GetFavoritesRequest): Promise<{
    favorites: Favorite[]
    total: number
    page: number
    pageSize: number
  }> {
    const { userId, page = 1, pageSize = 20 } = request

    const result = await FavoriteModel.findByUserId(userId, {
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100) // 限制每页最多100条
    })

    return {
      favorites: result.favorites,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /**
   * 获取互动统计信息
   * @param wishId 愿望ID
   * @param userId 用户ID（可选，用于获取用户是否点赞/收藏）
   * @returns Promise<InteractionStats> 互动统计信息
   */
  static async getInteractionStats(wishId: string, userId?: string): Promise<InteractionStats> {
    // 验证愿望是否存在
    const wish = await WishModel.findById(wishId)
    if (!wish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 获取点赞数（从wishes表）
    const totalLikes = wish.likes

    // 获取收藏数
    const totalFavorites = await FavoriteModel.countByWishId(wishId)

    // 获取评论数
    const commentsResult = await CommentModel.findByWishId(wishId, {
      page: 1,
      pageSize: 1
    })
    const totalComments = commentsResult.total

    // 获取用户是否点赞/收藏（如果提供了用户ID）
    let userLiked: boolean | undefined
    let userFavorited: boolean | undefined
    if (userId) {
      userLiked = await LikeModel.isLiked(wishId, userId)
      userFavorited = await FavoriteModel.isFavorited(wishId, userId)
    }

    return {
      wishId,
      totalLikes,
      totalFavorites,
      totalComments,
      userLiked,
      userFavorited
    }
  }
}

export default InteractionService
