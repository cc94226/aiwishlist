import { Request, Response } from 'express'
import { WishService } from '../services/WishService'
import { AppError } from '../middleware/errorHandler'
import { JobType } from '../models/User'

/**
 * 愿望控制器
 * 处理愿望查询相关的HTTP请求
 */
export class WishController {
  /**
   * 获取愿望列表
   * GET /api/wishes
   * 支持查询参数：job, status, search, page, pageSize, sortBy, sortOrder
   */
  static async getWishList(req: Request, res: Response): Promise<void> {
    try {
      const {
        job,
        status,
        search,
        page,
        pageSize,
        sortBy,
        sortOrder
      } = req.query

      // 从认证中间件获取用户信息（可选）
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      const result = await WishService.getWishList({
        job: job as JobType | undefined,
        status: status as any,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
        sortBy: sortBy as 'created_at' | 'likes' | 'updated_at' | undefined,
        sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_WISH_LIST_FAILED'
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
   * 获取愿望详情
   * GET /api/wishes/:id
   */
  static async getWishDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      // 从认证中间件获取用户信息（可选）
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      const wish = await WishService.getWishDetail({
        id,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        data: {
          wish
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_WISH_DETAIL_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取愿望详情失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 搜索愿望
   * GET /api/wishes/search
   * 支持查询参数：keyword, job, page, pageSize
   */
  static async searchWish(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, job, page, pageSize } = req.query

      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: '搜索关键词不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      // 从认证中间件获取用户信息（可选）
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      const result = await WishService.searchWish({
        keyword: keyword as string,
        job: job as JobType | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'SEARCH_WISH_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '搜索愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 根据岗位获取愿望列表
   * GET /api/wishes/job/:job
   * 支持查询参数：page, pageSize
   */
  static async getWishesByJob(req: Request, res: Response): Promise<void> {
    try {
      const { job } = req.params
      const { page, pageSize } = req.query

      if (!job) {
        res.status(400).json({
          success: false,
          error: {
            message: '岗位类型不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      // 从认证中间件获取用户信息（可选）
      const isAdmin = req.user?.role === 'admin'

      const result = await WishService.getWishesByJob(
        job as JobType,
        page ? parseInt(page as string, 10) : undefined,
        pageSize ? parseInt(pageSize as string, 10) : undefined,
        isAdmin
      )

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_WISHES_BY_JOB_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '根据岗位查询愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户提交的愿望列表
   * GET /api/wishes/user/:userId
   * 支持查询参数：page, pageSize
   */
  static async getWishesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const { page, pageSize } = req.query

      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            message: '用户ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      // 权限控制：普通用户只能查看自己的愿望，管理员可以查看所有用户的愿望
      const currentUserId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      if (!isAdmin && currentUserId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            message: '无权访问此用户的愿望列表',
            code: 'FORBIDDEN'
          }
        })
        return
      }

      const result = await WishService.getWishesByUser(
        userId,
        page ? parseInt(page as string, 10) : undefined,
        pageSize ? parseInt(pageSize as string, 10) : undefined,
        isAdmin
      )

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_USER_WISHES_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '查询用户愿望列表失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取热门愿望列表（按点赞数排序）
   * GET /api/wishes/popular
   * 支持查询参数：page, pageSize
   */
  static async getPopularWishes(req: Request, res: Response): Promise<void> {
    try {
      const { page, pageSize } = req.query

      // 从认证中间件获取用户信息（可选）
      const isAdmin = req.user?.role === 'admin'

      const result = await WishService.getPopularWishes(
        page ? parseInt(page as string, 10) : undefined,
        pageSize ? parseInt(pageSize as string, 10) : undefined,
        isAdmin
      )

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_POPULAR_WISHES_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '查询热门愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取最新愿望列表（按创建时间排序）
   * GET /api/wishes/latest
   * 支持查询参数：page, pageSize
   */
  static async getLatestWishes(req: Request, res: Response): Promise<void> {
    try {
      const { page, pageSize } = req.query

      // 从认证中间件获取用户信息（可选）
      const isAdmin = req.user?.role === 'admin'

      const result = await WishService.getLatestWishes(
        page ? parseInt(page as string, 10) : undefined,
        pageSize ? parseInt(pageSize as string, 10) : undefined,
        isAdmin
      )

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'GET_LATEST_WISHES_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '查询最新愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }
}

export default WishController
