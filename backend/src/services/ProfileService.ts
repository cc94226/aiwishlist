import { UserModel, UserWithoutPassword } from '../models/User'
import {
  UserProfileModel,
  UserProfileStats,
  UserWishStats,
  UserInteractionStats
} from '../models/UserProfile'
import { WishModel } from '../models/Wish'
import { FavoriteModel } from '../models/Interaction'
import { AppError } from '../middleware/errorHandler'

/**
 * 获取用户个人资料响应接口
 */
export interface GetUserProfileResponse {
  success: boolean
  profile?: {
    user: UserWithoutPassword
    stats: UserProfileStats
  }
  message?: string
}

/**
 * 获取用户愿望列表响应接口
 */
export interface GetUserWishesResponse {
  success: boolean
  wishes?: any[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  message?: string
}

/**
 * 获取用户收藏列表响应接口
 */
export interface GetUserFavoritesResponse {
  success: boolean
  favorites?: any[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  message?: string
}

/**
 * 个人资料服务类
 * 提供用户个人资料、统计信息、愿望列表、收藏列表等业务逻辑
 */
export class ProfileService {
  /**
   * 获取用户个人资料（包含统计信息）
   * @param userId 用户ID
   * @param isAdmin 是否为管理员（决定是否包含所有状态的统计）
   * @returns Promise<GetUserProfileResponse> 用户个人资料响应
   */
  static async getUserProfile(
    userId: string,
    isAdmin: boolean = false
  ): Promise<GetUserProfileResponse> {
    try {
      // 获取用户基本信息
      const user = await UserModel.findById(userId)
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        }
      }

      // 获取用户统计信息（管理员可以查看所有状态，普通用户只能查看已发布的）
      const stats = await UserProfileModel.getUserProfileStats(userId, isAdmin)

      return {
        success: true,
        profile: {
          user,
          stats
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取用户个人资料失败', 500, 'GET_PROFILE_FAILED')
    }
  }

  /**
   * 获取用户的愿望列表
   * @param userId 用户ID
   * @param currentUserId 当前登录用户ID（用于权限控制）
   * @param isAdmin 是否为管理员
   * @param options 查询选项（分页、排序等）
   * @returns Promise<GetUserWishesResponse> 用户愿望列表响应
   */
  static async getUserWishes(
    userId: string,
    currentUserId: string,
    isAdmin: boolean = false,
    options: {
      page?: number
      pageSize?: number
      status?: 'draft' | 'published' | 'archived'
      sortBy?: string
      sortOrder?: 'ASC' | 'DESC'
    } = {}
  ): Promise<GetUserWishesResponse> {
    try {
      // 权限控制：用户只能查看自己的愿望列表（除非是管理员）
      if (userId !== currentUserId && !isAdmin) {
        throw new AppError('无权查看其他用户的愿望列表', 403, 'FORBIDDEN')
      }

      const { page = 1, pageSize = 10, status, sortBy = 'created_at', sortOrder = 'DESC' } = options

      // 构建查询选项
      const queryOptions: any = {
        submitter_id: userId,
        page,
        pageSize,
        sortBy,
        sortOrder
      }

      // 如果不是管理员，只能查看已发布的愿望
      if (!isAdmin) {
        queryOptions.status = status || 'published'
      } else if (status) {
        queryOptions.status = status
      }

      // 查询愿望列表
      const result = await WishModel.findAll(queryOptions)

      return {
        success: true,
        wishes: result.wishes,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取用户愿望列表失败', 500, 'GET_USER_WISHES_FAILED')
    }
  }

  /**
   * 获取用户的收藏列表
   * @param userId 用户ID
   * @param currentUserId 当前登录用户ID（用于权限控制）
   * @param options 查询选项（分页等）
   * @returns Promise<GetUserFavoritesResponse> 用户收藏列表响应
   */
  static async getUserFavorites(
    userId: string,
    currentUserId: string,
    options: {
      page?: number
      pageSize?: number
    } = {}
  ): Promise<GetUserFavoritesResponse> {
    try {
      // 权限控制：用户只能查看自己的收藏列表
      if (userId !== currentUserId) {
        throw new AppError('无权查看其他用户的收藏列表', 403, 'FORBIDDEN')
      }

      const { page = 1, pageSize = 10 } = options

      // 查询收藏列表
      const result = await FavoriteModel.findByUserId(userId, {
        page,
        pageSize
      })

      // 获取收藏的愿望详情
      const wishes = await Promise.all(
        result.favorites.map(async favorite => {
          const wish = await WishModel.findById(favorite.wish_id)
          return {
            ...wish,
            favoritedAt: favorite.created_at
          }
        })
      )

      return {
        success: true,
        favorites: wishes.filter(wish => wish !== null),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取用户收藏列表失败', 500, 'GET_USER_FAVORITES_FAILED')
    }
  }

  /**
   * 获取用户的愿望统计信息
   * @param userId 用户ID
   * @param isAdmin 是否为管理员（决定是否包含所有状态的统计）
   * @returns Promise<UserWishStats> 用户愿望统计信息
   */
  static async getUserWishStats(userId: string, isAdmin: boolean = false): Promise<UserWishStats> {
    return await UserProfileModel.getUserWishStats(userId, isAdmin)
  }

  /**
   * 获取用户的互动统计信息
   * @param userId 用户ID
   * @returns Promise<UserInteractionStats> 用户互动统计信息
   */
  static async getUserInteractionStats(userId: string): Promise<UserInteractionStats> {
    return await UserProfileModel.getUserInteractionStats(userId)
  }
}
