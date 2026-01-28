import { query } from '../config/database'
import { AppError } from '../middleware/errorHandler'

/**
 * 点赞数据模型接口
 */
export interface Like {
  id: string
  wish_id: string
  user_id: string
  created_at: Date | string
}

/**
 * 收藏数据模型接口
 */
export interface Favorite {
  id: string
  wish_id: string
  user_id: string
  created_at: Date | string
}

/**
 * 评论数据模型接口
 */
export interface Comment {
  id: string
  wish_id: string
  author: string
  author_id: string | null
  content: string
  created_at: Date | string
  updated_at: Date | string
}

/**
 * 创建评论数据模型接口
 */
export interface CreateCommentData {
  wish_id: string
  author: string
  author_id?: string | null
  content: string
}

/**
 * 更新评论数据模型接口
 */
export interface UpdateCommentData {
  content: string
}

/**
 * 评论查询选项
 */
export interface CommentQueryOptions {
  wish_id: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 评论查询结果（包含分页信息）
 */
export interface CommentQueryResult {
  comments: Comment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 互动模型类
 * 提供点赞、收藏、评论相关的数据库操作方法
 */
export class InteractionModel {
  /**
   * 生成UUID
   * @returns string UUID字符串
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // ==================== 点赞相关方法 ====================

  /**
   * 检查用户是否已点赞某个愿望
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已点赞
   */
  static async hasLiked(wishId: string, userId: string): Promise<boolean> {
    const sql = 'SELECT id FROM likes WHERE wish_id = ? AND user_id = ?'
    const results = await query<Like[]>(sql, [wishId, userId])
    return results.length > 0
  }

  /**
   * 添加点赞
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<Like> 点赞记录
   */
  static async addLike(wishId: string, userId: string): Promise<Like> {
    // 检查是否已点赞
    const hasLiked = await this.hasLiked(wishId, userId)
    if (hasLiked) {
      throw new AppError('您已经点赞过这个愿望了', 400, 'ALREADY_LIKED')
    }

    const id = this.generateUUID()
    const sql = 'INSERT INTO likes (id, wish_id, user_id) VALUES (?, ?, ?)'
    await query(sql, [id, wishId, userId])

    // 返回点赞记录
    const like = await this.getLikeById(id)
    if (!like) {
      throw new AppError('创建点赞记录失败', 500, 'CREATE_LIKE_FAILED')
    }

    return like
  }

  /**
   * 取消点赞
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否成功取消
   */
  static async removeLike(wishId: string, userId: string): Promise<boolean> {
    const sql = 'DELETE FROM likes WHERE wish_id = ? AND user_id = ?'
    const result = await query(sql, [wishId, userId])
    return (result as any).affectedRows > 0
  }

  /**
   * 根据ID获取点赞记录
   * @param id 点赞记录ID
   * @returns Promise<Like | null> 点赞记录
   */
  static async getLikeById(id: string): Promise<Like | null> {
    const sql = 'SELECT * FROM likes WHERE id = ?'
    const results = await query<Like[]>(sql, [id])
    return results.length > 0 ? results[0] : null
  }

  /**
   * 获取愿望的点赞列表
   * @param wishId 愿望ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<{ likes: Like[]; total: number }> 点赞列表和总数
   */
  static async getLikesByWishId(
    wishId: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<{ likes: Like[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM likes WHERE wish_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [wishId])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql = 'SELECT * FROM likes WHERE wish_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const likes = await query<Like[]>(sql, [wishId, pageSize, offset])

    return { likes, total }
  }

  /**
   * 获取用户的点赞列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<{ likes: Like[]; total: number }> 点赞列表和总数
   */
  static async getLikesByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<{ likes: Like[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM likes WHERE user_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [userId])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql = 'SELECT * FROM likes WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const likes = await query<Like[]>(sql, [userId, pageSize, offset])

    return { likes, total }
  }

  // ==================== 收藏相关方法 ====================

  /**
   * 检查用户是否已收藏某个愿望
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已收藏
   */
  static async hasFavorited(wishId: string, userId: string): Promise<boolean> {
    const sql = 'SELECT id FROM favorites WHERE wish_id = ? AND user_id = ?'
    const results = await query<Favorite[]>(sql, [wishId, userId])
    return results.length > 0
  }

  /**
   * 添加收藏
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<Favorite> 收藏记录
   */
  static async addFavorite(wishId: string, userId: string): Promise<Favorite> {
    // 检查是否已收藏
    const hasFavorited = await this.hasFavorited(wishId, userId)
    if (hasFavorited) {
      throw new AppError('您已经收藏过这个愿望了', 400, 'ALREADY_FAVORITED')
    }

    const id = this.generateUUID()
    const sql = 'INSERT INTO favorites (id, wish_id, user_id) VALUES (?, ?, ?)'
    await query(sql, [id, wishId, userId])

    // 返回收藏记录
    const favorite = await this.getFavoriteById(id)
    if (!favorite) {
      throw new AppError('创建收藏记录失败', 500, 'CREATE_FAVORITE_FAILED')
    }

    return favorite
  }

  /**
   * 取消收藏
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否成功取消
   */
  static async removeFavorite(wishId: string, userId: string): Promise<boolean> {
    const sql = 'DELETE FROM favorites WHERE wish_id = ? AND user_id = ?'
    const result = await query(sql, [wishId, userId])
    return (result as any).affectedRows > 0
  }

  /**
   * 根据ID获取收藏记录
   * @param id 收藏记录ID
   * @returns Promise<Favorite | null> 收藏记录
   */
  static async getFavoriteById(id: string): Promise<Favorite | null> {
    const sql = 'SELECT * FROM favorites WHERE id = ?'
    const results = await query<Favorite[]>(sql, [id])
    return results.length > 0 ? results[0] : null
  }

  /**
   * 获取愿望的收藏列表
   * @param wishId 愿望ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<{ favorites: Favorite[]; total: number }> 收藏列表和总数
   */
  static async getFavoritesByWishId(
    wishId: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<{ favorites: Favorite[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM favorites WHERE wish_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [wishId])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql =
      'SELECT * FROM favorites WHERE wish_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const favorites = await query<Favorite[]>(sql, [wishId, pageSize, offset])

    return { favorites, total }
  }

  /**
   * 获取用户的收藏列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<{ favorites: Favorite[]; total: number }> 收藏列表和总数
   */
  static async getFavoritesByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<{ favorites: Favorite[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [userId])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql =
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const favorites = await query<Favorite[]>(sql, [userId, pageSize, offset])

    return { favorites, total }
  }

  // ==================== 评论相关方法 ====================

  /**
   * 根据ID获取评论
   * @param id 评论ID
   * @returns Promise<Comment | null> 评论信息
   */
  static async getCommentById(id: string): Promise<Comment | null> {
    const sql = 'SELECT * FROM comments WHERE id = ?'
    const results = await query<Comment[]>(sql, [id])
    return results.length > 0 ? results[0] : null
  }

  /**
   * 创建评论
   * @param commentData 评论数据
   * @returns Promise<Comment> 创建的评论信息
   */
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    // 验证内容不能为空
    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new AppError('评论内容不能为空', 400, 'INVALID_COMMENT_CONTENT')
    }

    // 验证内容长度（最多5000字符）
    if (commentData.content.length > 5000) {
      throw new AppError('评论内容不能超过5000字符', 400, 'COMMENT_TOO_LONG')
    }

    const id = this.generateUUID()
    const sql = `
      INSERT INTO comments (id, wish_id, author, author_id, content)
      VALUES (?, ?, ?, ?, ?)
    `
    await query(sql, [
      id,
      commentData.wish_id,
      commentData.author,
      commentData.author_id || null,
      commentData.content.trim()
    ])

    // 返回创建的评论
    const comment = await this.getCommentById(id)
    if (!comment) {
      throw new AppError('创建评论失败', 500, 'CREATE_COMMENT_FAILED')
    }

    return comment
  }

  /**
   * 更新评论
   * @param id 评论ID
   * @param commentData 评论数据
   * @param userId 用户ID（用于权限验证）
   * @param isAdmin 是否为管理员
   * @returns Promise<Comment> 更新后的评论信息
   */
  static async updateComment(
    id: string,
    commentData: UpdateCommentData,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<Comment> {
    // 获取评论
    const comment = await this.getCommentById(id)
    if (!comment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    // 权限验证：只有管理员或评论作者可以更新
    if (!isAdmin && (!userId || comment.author_id !== userId)) {
      throw new AppError('您没有权限修改此评论', 403, 'FORBIDDEN')
    }

    // 验证内容不能为空
    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new AppError('评论内容不能为空', 400, 'INVALID_COMMENT_CONTENT')
    }

    // 验证内容长度（最多5000字符）
    if (commentData.content.length > 5000) {
      throw new AppError('评论内容不能超过5000字符', 400, 'COMMENT_TOO_LONG')
    }

    const sql = 'UPDATE comments SET content = ? WHERE id = ?'
    await query(sql, [commentData.content.trim(), id])

    // 返回更新后的评论
    const updatedComment = await this.getCommentById(id)
    if (!updatedComment) {
      throw new AppError('更新评论失败', 500, 'UPDATE_COMMENT_FAILED')
    }

    return updatedComment
  }

  /**
   * 删除评论
   * @param id 评论ID
   * @param userId 用户ID（用于权限验证）
   * @param isAdmin 是否为管理员
   * @returns Promise<boolean> 是否成功删除
   */
  static async deleteComment(
    id: string,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<boolean> {
    // 获取评论
    const comment = await this.getCommentById(id)
    if (!comment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    // 权限验证：只有管理员或评论作者可以删除
    if (!isAdmin && (!userId || comment.author_id !== userId)) {
      throw new AppError('您没有权限删除此评论', 403, 'FORBIDDEN')
    }

    const sql = 'DELETE FROM comments WHERE id = ?'
    const result = await query(sql, [id])
    return (result as any).affectedRows > 0
  }

  /**
   * 获取愿望的评论列表
   * @param options 查询选项
   * @returns Promise<CommentQueryResult> 评论列表和分页信息
   */
  static async getCommentsByWishId(options: CommentQueryOptions): Promise<CommentQueryResult> {
    const { wish_id, page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options

    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM comments WHERE wish_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [wish_id])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql = `
      SELECT * FROM comments
      WHERE wish_id = ?
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `
    const comments = await query<Comment[]>(sql, [wish_id, pageSize, offset])

    const totalPages = Math.ceil(total / pageSize)

    return {
      comments,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * 获取用户的评论列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<{ comments: Comment[]; total: number }> 评论列表和总数
   */
  static async getCommentsByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ comments: Comment[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM comments WHERE author_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [userId])
    const total = countResults[0]?.total || 0

    // 获取列表
    const sql =
      'SELECT * FROM comments WHERE author_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const comments = await query<Comment[]>(sql, [userId, pageSize, offset])

    return { comments, total }
  }
}

export default InteractionModel
