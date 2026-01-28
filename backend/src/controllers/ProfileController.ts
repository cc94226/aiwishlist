import { Request, Response } from 'express'
import { ProfileService } from '../services/ProfileService'
import { AppError } from '../middleware/errorHandler'

/**
 * 个人中心控制器类
 * 处理用户个人资料相关的HTTP请求
 */
export class ProfileController {
  /**
   * 获取用户个人资料（包含统计信息）
   * GET /api/profile/:userId
   * 需要认证
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const { userId } = req.params
      const currentUserId = req.user.id
      const isAdmin = req.user.role === 'admin'

      // 权限控制：用户只能查看自己的个人资料（除非是管理员）
      if (userId !== currentUserId && !isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            message: '无权查看其他用户的个人资料',
            code: 'FORBIDDEN'
          }
        })
        return
      }

      const result = await ProfileService.getUserProfile(userId, isAdmin)

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.profile
        })
      } else {
        res.status(404).json({
          success: false,
          error: {
            message: result.message || '获取个人资料失败',
            code: 'PROFILE_NOT_FOUND'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_PROFILE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取个人资料失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取当前用户的个人资料（包含统计信息）
   * GET /api/profile/me
   * 需要认证
   */
  static async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const userId = req.user.id
      const isAdmin = req.user.role === 'admin'

      const result = await ProfileService.getUserProfile(userId, isAdmin)

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.profile
        })
      } else {
        res.status(404).json({
          success: false,
          error: {
            message: result.message || '获取个人资料失败',
            code: 'PROFILE_NOT_FOUND'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_PROFILE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取个人资料失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户的愿望列表
   * GET /api/profile/:userId/wishes
   * 需要认证
   */
  static async getUserWishes(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const { userId } = req.params
      const currentUserId = req.user.id
      const isAdmin = req.user.role === 'admin'

      // 解析查询参数
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined
      const status = req.query.status as 'draft' | 'published' | 'archived' | undefined
      const sortBy = req.query.sortBy as string | undefined
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || undefined

      const result = await ProfileService.getUserWishes(userId, currentUserId, isAdmin, {
        page,
        pageSize,
        status,
        sortBy,
        sortOrder
      })

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            wishes: result.wishes,
            pagination: {
              total: result.total,
              page: result.page,
              pageSize: result.pageSize,
              totalPages: result.totalPages
            }
          }
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.message || '获取愿望列表失败',
            code: 'GET_WISHES_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_WISHES_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取愿望列表失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户的收藏列表
   * GET /api/profile/:userId/favorites
   * 需要认证
   */
  static async getUserFavorites(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const { userId } = req.params
      const currentUserId = req.user.id

      // 解析查询参数
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined

      const result = await ProfileService.getUserFavorites(userId, currentUserId, {
        page,
        pageSize
      })

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            favorites: result.favorites,
            pagination: {
              total: result.total,
              page: result.page,
              pageSize: result.pageSize,
              totalPages: result.totalPages
            }
          }
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            message: result.message || '获取收藏列表失败',
            code: 'GET_FAVORITES_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_FAVORITES_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取收藏列表失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户的愿望统计信息
   * GET /api/profile/:userId/stats/wishes
   * 需要认证
   */
  static async getUserWishStats(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const { userId } = req.params
      const currentUserId = req.user.id
      const isAdmin = req.user.role === 'admin'

      // 权限控制：用户只能查看自己的统计信息（除非是管理员）
      if (userId !== currentUserId && !isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            message: '无权查看其他用户的统计信息',
            code: 'FORBIDDEN'
          }
        })
        return
      }

      const stats = await ProfileService.getUserWishStats(userId, isAdmin)

      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_STATS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取统计信息失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户的互动统计信息
   * GET /api/profile/:userId/stats/interactions
   * 需要认证
   */
  static async getUserInteractionStats(req: Request, res: Response): Promise<void> {
    try {
      // 从认证中间件获取当前用户信息
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: '未登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const { userId } = req.params
      const currentUserId = req.user.id
      const isAdmin = req.user.role === 'admin'

      // 权限控制：用户只能查看自己的统计信息（除非是管理员）
      if (userId !== currentUserId && !isAdmin) {
        res.status(403).json({
          success: false,
          error: {
            message: '无权查看其他用户的统计信息',
            code: 'FORBIDDEN'
          }
        })
        return
      }

      const stats = await ProfileService.getUserInteractionStats(userId)

      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_STATS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取统计信息失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }
}
