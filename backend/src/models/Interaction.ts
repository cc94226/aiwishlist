import { query } from '../config/database'
import { AppError } from '../middleware/errorHandler'

/**
 * 评论数据模型接口
 */
export interface Comment {
  id: string
  wish_id: string
  author: string
  author_id?: string | null
  content: string
  created_at: Date | string
  updated_at: Date | string
}

/**
 * 创建评论数据模型接口（不包含id和时间戳）
 */
export interface CreateCommentData {
  wish_id: string
  author: string
  author_id?: string | null
  content: string
}

/**
 * 更新评论数据模型接口（所有字段可选）
 */
export interface UpdateCommentData {
  content?: string
}

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
 * 创建点赞数据模型接口（不包含id和时间戳）
 */
export interface CreateLikeData {
  wish_id: string
  user_id: string
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
 * 创建收藏数据模型接口（不包含id和时间戳）
 */
export interface CreateFavoriteData {
  wish_id: string
  user_id: string
}

/**
 * 评论查询选项
 */
export interface CommentQueryOptions {
  wish_id?: string
  author_id?: string
  page?: number // 页码（从1开始）
  pageSize?: number // 每页数量
  sortBy?: 'created_at' | 'updated_at' // 排序字段
  sortOrder?: 'ASC' | 'DESC' // 排序顺序
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
 * 评论模型类
 * 提供评论相关的数据库操作方法
 */
export class CommentModel {
  /**
   * 根据ID查询评论
   * @param id 评论ID
   * @returns Promise<Comment | null> 评论信息
   */
  static async findById(id: string): Promise<Comment | null> {
    const sql = `
      SELECT id, wish_id, author, author_id, content, created_at, updated_at
      FROM comments
      WHERE id = ?
    `
    const results = await query<Comment[]>(sql, [id])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 创建新评论
   * @param commentData 评论数据
   * @returns Promise<Comment> 创建的评论信息
   */
  static async create(commentData: CreateCommentData): Promise<Comment> {
    // 验证必填字段
    if (!commentData.wish_id || commentData.wish_id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }
    if (!commentData.content || commentData.content.trim().length === 0) {
      throw new AppError('评论内容不能为空', 400, 'INVALID_INPUT')
    }
    if (!commentData.author || commentData.author.trim().length === 0) {
      throw new AppError('评论作者不能为空', 400, 'INVALID_INPUT')
    }

    // 生成UUID
    const id = this.generateUUID()

    const sql = `
      INSERT INTO comments (id, wish_id, author, author_id, content)
      VALUES (?, ?, ?, ?, ?)
    `
    await query(sql, [
      id,
      commentData.wish_id.trim(),
      commentData.author.trim(),
      commentData.author_id || null,
      commentData.content.trim()
    ])

    // 返回创建的评论
    const createdComment = await this.findById(id)
    if (!createdComment) {
      throw new AppError('创建评论失败', 500, 'CREATE_COMMENT_FAILED')
    }

    return createdComment
  }

  /**
   * 更新评论信息
   * @param id 评论ID
   * @param commentData 更新的评论数据
   * @returns Promise<Comment> 更新后的评论信息
   */
  static async update(id: string, commentData: UpdateCommentData): Promise<Comment> {
    // 检查评论是否存在
    const existingComment = await this.findById(id)
    if (!existingComment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    // 验证更新数据
    if (commentData.content !== undefined) {
      if (!commentData.content || commentData.content.trim().length === 0) {
        throw new AppError('评论内容不能为空', 400, 'INVALID_INPUT')
      }
    }

    // 构建更新SQL
    const updates: string[] = []
    const values: any[] = []

    if (commentData.content !== undefined) {
      updates.push('content = ?')
      values.push(commentData.content.trim())
    }

    if (updates.length === 0) {
      return existingComment
    }

    values.push(id)

    const sql = `
      UPDATE comments
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    await query(sql, values)

    // 返回更新后的评论
    const updatedComment = await this.findById(id)
    if (!updatedComment) {
      throw new AppError('更新评论失败', 500, 'UPDATE_COMMENT_FAILED')
    }

    return updatedComment
  }

  /**
   * 删除评论
   * @param id 评论ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    // 检查评论是否存在
    const existingComment = await this.findById(id)
    if (!existingComment) {
      throw new AppError('评论不存在', 404, 'COMMENT_NOT_FOUND')
    }

    const sql = 'DELETE FROM comments WHERE id = ?'
    await query(sql, [id])
  }

  /**
   * 查询评论列表
   * @param options 查询选项
   * @returns Promise<CommentQueryResult> 评论列表和分页信息
   */
  static async findAll(options: CommentQueryOptions = {}): Promise<CommentQueryResult> {
    const page = options.page || 1
    const pageSize = options.pageSize || 20
    const sortBy = options.sortBy || 'created_at'
    const sortOrder = options.sortOrder || 'DESC'
    const offset = (page - 1) * pageSize

    // 构建WHERE条件
    const conditions: string[] = []
    const values: any[] = []

    if (options.wish_id) {
      conditions.push('wish_id = ?')
      values.push(options.wish_id)
    }

    if (options.author_id) {
      conditions.push('author_id = ?')
      values.push(options.author_id)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM comments ${whereClause}`
    const countResults = await query<{ total: number }[]>(countSql, values)
    const total = countResults[0]?.total || 0

    // 查询评论列表
    const sql = `
      SELECT id, wish_id, author, author_id, content, created_at, updated_at
      FROM comments
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `
    const comments = await query<Comment[]>(sql, [...values, pageSize, offset])

    return {
      comments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 根据愿望ID查询评论列表
   * @param wishId 愿望ID
   * @param options 查询选项
   * @returns Promise<CommentQueryResult> 评论列表和分页信息
   */
  static async findByWishId(
    wishId: string,
    options: Omit<CommentQueryOptions, 'wish_id'> = {}
  ): Promise<CommentQueryResult> {
    return this.findAll({ ...options, wish_id: wishId })
  }

  /**
   * 根据用户ID查询评论列表
   * @param authorId 用户ID
   * @param options 查询选项
   * @returns Promise<CommentQueryResult> 评论列表和分页信息
   */
  static async findByAuthorId(
    authorId: string,
    options: Omit<CommentQueryOptions, 'author_id'> = {}
  ): Promise<CommentQueryResult> {
    return this.findAll({ ...options, author_id: authorId })
  }

  /**
   * 生成UUID（简化版本）
   * @returns string UUID字符串
   */
  private static generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 点赞模型类
 * 提供点赞相关的数据库操作方法
 */
export class LikeModel {
  /**
   * 根据ID查询点赞记录
   * @param id 点赞ID
   * @returns Promise<Like | null> 点赞信息
   */
  static async findById(id: string): Promise<Like | null> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM likes
      WHERE id = ?
    `
    const results = await query<Like[]>(sql, [id])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 根据愿望ID和用户ID查询点赞记录
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<Like | null> 点赞信息
   */
  static async findByWishAndUser(wishId: string, userId: string): Promise<Like | null> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM likes
      WHERE wish_id = ? AND user_id = ?
    `
    const results = await query<Like[]>(sql, [wishId, userId])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 创建点赞记录
   * @param likeData 点赞数据
   * @returns Promise<Like> 创建的点赞信息
   */
  static async create(likeData: CreateLikeData): Promise<Like> {
    // 验证必填字段
    if (!likeData.wish_id || likeData.wish_id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }
    if (!likeData.user_id || likeData.user_id.trim().length === 0) {
      throw new AppError('用户ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查是否已经点赞
    const existingLike = await this.findByWishAndUser(likeData.wish_id, likeData.user_id)
    if (existingLike) {
      throw new AppError('已经点赞过该愿望', 400, 'ALREADY_LIKED')
    }

    // 生成UUID
    const id = this.generateUUID()

    const sql = `
      INSERT INTO likes (id, wish_id, user_id)
      VALUES (?, ?, ?)
    `
    await query(sql, [id, likeData.wish_id.trim(), likeData.user_id.trim()])

    // 返回创建的点赞记录
    const createdLike = await this.findById(id)
    if (!createdLike) {
      throw new AppError('创建点赞记录失败', 500, 'CREATE_LIKE_FAILED')
    }

    return createdLike
  }

  /**
   * 删除点赞记录（取消点赞）
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<void>
   */
  static async delete(wishId: string, userId: string): Promise<void> {
    // 检查点赞记录是否存在
    const existingLike = await this.findByWishAndUser(wishId, userId)
    if (!existingLike) {
      throw new AppError('未找到点赞记录', 404, 'NOT_LIKED')
    }

    const sql = 'DELETE FROM likes WHERE wish_id = ? AND user_id = ?'
    await query(sql, [wishId, userId])
  }

  /**
   * 根据愿望ID查询点赞列表
   * @param wishId 愿望ID
   * @returns Promise<Like[]> 点赞列表
   */
  static async findByWishId(wishId: string): Promise<Like[]> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM likes
      WHERE wish_id = ?
      ORDER BY created_at DESC
    `
    return await query<Like[]>(sql, [wishId])
  }

  /**
   * 根据用户ID查询点赞列表
   * @param userId 用户ID
   * @returns Promise<Like[]> 点赞列表
   */
  static async findByUserId(userId: string): Promise<Like[]> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM likes
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    return await query<Like[]>(sql, [userId])
  }

  /**
   * 统计愿望的点赞数
   * @param wishId 愿望ID
   * @returns Promise<number> 点赞数
   */
  static async countByWishId(wishId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM likes WHERE wish_id = ?'
    const results = await query<{ count: number }[]>(sql, [wishId])
    return results[0]?.count || 0
  }

  /**
   * 检查用户是否已点赞
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已点赞
   */
  static async isLiked(wishId: string, userId: string): Promise<boolean> {
    const like = await this.findByWishAndUser(wishId, userId)
    return like !== null
  }

  /**
   * 生成UUID（简化版本）
   * @returns string UUID字符串
   */
  private static generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 收藏模型类
 * 提供收藏相关的数据库操作方法
 */
export class FavoriteModel {
  /**
   * 根据ID查询收藏记录
   * @param id 收藏ID
   * @returns Promise<Favorite | null> 收藏信息
   */
  static async findById(id: string): Promise<Favorite | null> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM favorites
      WHERE id = ?
    `
    const results = await query<Favorite[]>(sql, [id])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 根据愿望ID和用户ID查询收藏记录
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<Favorite | null> 收藏信息
   */
  static async findByWishAndUser(wishId: string, userId: string): Promise<Favorite | null> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM favorites
      WHERE wish_id = ? AND user_id = ?
    `
    const results = await query<Favorite[]>(sql, [wishId, userId])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 创建收藏记录
   * @param favoriteData 收藏数据
   * @returns Promise<Favorite> 创建的收藏信息
   */
  static async create(favoriteData: CreateFavoriteData): Promise<Favorite> {
    // 验证必填字段
    if (!favoriteData.wish_id || favoriteData.wish_id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }
    if (!favoriteData.user_id || favoriteData.user_id.trim().length === 0) {
      throw new AppError('用户ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查是否已经收藏
    const existingFavorite = await this.findByWishAndUser(
      favoriteData.wish_id,
      favoriteData.user_id
    )
    if (existingFavorite) {
      throw new AppError('已经收藏过该愿望', 400, 'ALREADY_FAVORITED')
    }

    // 生成UUID
    const id = this.generateUUID()

    const sql = `
      INSERT INTO favorites (id, wish_id, user_id)
      VALUES (?, ?, ?)
    `
    await query(sql, [id, favoriteData.wish_id.trim(), favoriteData.user_id.trim()])

    // 返回创建的收藏记录
    const createdFavorite = await this.findById(id)
    if (!createdFavorite) {
      throw new AppError('创建收藏记录失败', 500, 'CREATE_FAVORITE_FAILED')
    }

    return createdFavorite
  }

  /**
   * 删除收藏记录（取消收藏）
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<void>
   */
  static async delete(wishId: string, userId: string): Promise<void> {
    // 检查收藏记录是否存在
    const existingFavorite = await this.findByWishAndUser(wishId, userId)
    if (!existingFavorite) {
      throw new AppError('未找到收藏记录', 404, 'NOT_FAVORITED')
    }

    const sql = 'DELETE FROM favorites WHERE wish_id = ? AND user_id = ?'
    await query(sql, [wishId, userId])
  }

  /**
   * 根据愿望ID查询收藏列表
   * @param wishId 愿望ID
   * @returns Promise<Favorite[]> 收藏列表
   */
  static async findByWishId(wishId: string): Promise<Favorite[]> {
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM favorites
      WHERE wish_id = ?
      ORDER BY created_at DESC
    `
    return await query<Favorite[]>(sql, [wishId])
  }

  /**
   * 根据用户ID查询收藏列表（分页）
   * @param userId 用户ID
   * @param options 查询选项
   * @returns Promise<{ favorites: Favorite[], total: number, page: number, pageSize: number, totalPages: number }> 收藏列表和分页信息
   */
  static async findByUserId(
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{
    favorites: Favorite[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const page = options.page || 1
    const pageSize = options.pageSize || 20
    const offset = (page - 1) * pageSize

    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?'
    const countResults = await query<{ total: number }[]>(countSql, [userId])
    const total = countResults[0]?.total || 0

    // 查询收藏列表
    const sql = `
      SELECT id, wish_id, user_id, created_at
      FROM favorites
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const favorites = await query<Favorite[]>(sql, [userId, pageSize, offset])

    return {
      favorites,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 统计愿望的收藏数
   * @param wishId 愿望ID
   * @returns Promise<number> 收藏数
   */
  static async countByWishId(wishId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM favorites WHERE wish_id = ?'
    const results = await query<{ count: number }[]>(sql, [wishId])
    return results[0]?.count || 0
  }

  /**
   * 检查用户是否已收藏
   * @param wishId 愿望ID
   * @param userId 用户ID
   * @returns Promise<boolean> 是否已收藏
   */
  static async isFavorited(wishId: string, userId: string): Promise<boolean> {
    const favorite = await this.findByWishAndUser(wishId, userId)
    return favorite !== null
  }

  /**
   * 生成UUID（简化版本）
   * @returns string UUID字符串
   */
  private static generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
  }
}
