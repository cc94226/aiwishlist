import { query } from '../config/database'

/**
 * 用户愿望统计信息接口
 */
export interface UserWishStats {
  /** 总愿望数 */
  total: number
  /** 草稿状态愿望数 */
  draft: number
  /** 已发布愿望数 */
  published: number
  /** 已归档愿望数 */
  archived: number
}

/**
 * 用户互动统计信息接口
 */
export interface UserInteractionStats {
  /** 用户获得的点赞总数（用户提交的愿望收到的点赞数） */
  receivedLikes: number
  /** 用户收藏的愿望数量 */
  favoritesCount: number
  /** 用户发表的评论数量 */
  commentsCount: number
  /** 用户点赞的愿望数量 */
  likesGiven: number
}

/**
 * 用户个人资料统计信息接口
 */
export interface UserProfileStats {
  /** 用户愿望统计 */
  wishes: UserWishStats
  /** 用户互动统计 */
  interactions: UserInteractionStats
}

/**
 * 用户个人资料详情接口（包含统计信息）
 */
export interface UserProfileDetail {
  /** 用户ID */
  userId: string
  /** 用户名 */
  name: string
  /** 用户邮箱 */
  email: string
  /** 用户角色 */
  role: 'admin' | 'user'
  /** 用户岗位 */
  job?: string | null
  /** 用户创建时间 */
  createdAt: Date | string
  /** 用户更新时间 */
  updatedAt: Date | string
  /** 用户统计信息 */
  stats: UserProfileStats
}

/**
 * 用户个人资料模型类
 * 提供用户个人资料和统计信息相关的数据库操作方法
 */
export class UserProfileModel {
  /**
   * 获取用户的愿望统计信息
   * @param userId 用户ID
   * @param includeAllStatuses 是否包含所有状态的统计（管理员可以查看所有状态，普通用户只能查看已发布的）
   * @returns Promise<UserWishStats> 用户愿望统计信息
   */
  static async getUserWishStats(
    userId: string,
    includeAllStatuses: boolean = false
  ): Promise<UserWishStats> {
    let sql: string
    let values: any[]

    if (includeAllStatuses) {
      // 管理员可以查看所有状态的统计
      sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
        FROM wishes
        WHERE submitter_id = ?
      `
      values = [userId]
    } else {
      // 普通用户只能查看已发布状态的统计
      sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
        FROM wishes
        WHERE submitter_id = ? AND status = 'published'
      `
      values = [userId]
    }

    const results = await query<
      Array<{
        total: number
        draft: number
        published: number
        archived: number
      }>
    >(sql, values)

    if (results.length === 0) {
      return {
        total: 0,
        draft: 0,
        published: 0,
        archived: 0
      }
    }

    const result = results[0]
    return {
      total: result.total || 0,
      draft: result.draft || 0,
      published: result.published || 0,
      archived: result.archived || 0
    }
  }

  /**
   * 获取用户的互动统计信息
   * @param userId 用户ID
   * @returns Promise<UserInteractionStats> 用户互动统计信息
   */
  static async getUserInteractionStats(userId: string): Promise<UserInteractionStats> {
    // 获取用户获得的点赞总数（用户提交的愿望收到的点赞数）
    const receivedLikesSql = `
      SELECT COALESCE(SUM(likes), 0) as received_likes
      FROM wishes
      WHERE submitter_id = ? AND status = 'published'
    `
    const receivedLikesResult = await query<Array<{ received_likes: number }>>(receivedLikesSql, [
      userId
    ])
    const receivedLikes = receivedLikesResult[0]?.received_likes || 0

    // 获取用户收藏的愿望数量
    const favoritesSql = `
      SELECT COUNT(*) as favorites_count
      FROM favorites
      WHERE user_id = ?
    `
    const favoritesResult = await query<Array<{ favorites_count: number }>>(favoritesSql, [userId])
    const favoritesCount = favoritesResult[0]?.favorites_count || 0

    // 获取用户发表的评论数量
    const commentsSql = `
      SELECT COUNT(*) as comments_count
      FROM comments
      WHERE author_id = ?
    `
    const commentsResult = await query<Array<{ comments_count: number }>>(commentsSql, [userId])
    const commentsCount = commentsResult[0]?.comments_count || 0

    // 获取用户点赞的愿望数量
    const likesGivenSql = `
      SELECT COUNT(*) as likes_given
      FROM likes
      WHERE user_id = ?
    `
    const likesGivenResult = await query<Array<{ likes_given: number }>>(likesGivenSql, [userId])
    const likesGiven = likesGivenResult[0]?.likes_given || 0

    return {
      receivedLikes,
      favoritesCount,
      commentsCount,
      likesGiven
    }
  }

  /**
   * 获取用户的完整个人资料统计信息
   * @param userId 用户ID
   * @param includeAllStatuses 是否包含所有状态的统计（管理员可以查看所有状态）
   * @returns Promise<UserProfileStats> 用户个人资料统计信息
   */
  static async getUserProfileStats(
    userId: string,
    includeAllStatuses: boolean = false
  ): Promise<UserProfileStats> {
    const [wishes, interactions] = await Promise.all([
      this.getUserWishStats(userId, includeAllStatuses),
      this.getUserInteractionStats(userId)
    ])

    return {
      wishes,
      interactions
    }
  }
}
