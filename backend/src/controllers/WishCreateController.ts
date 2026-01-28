import { Request, Response } from 'express'
import { WishCreateService } from '../services/WishCreateService'
import { AppError } from '../middleware/errorHandler'
import { JobType } from '../models/User'
import { WishStatus } from '../models/Wish'

/**
 * 愿望创建控制器
 * 处理愿望创建、更新、删除相关的HTTP请求
 */
export class WishCreateController {
  /**
   * 创建新愿望
   * POST /api/wishes/create
   * 需要认证
   */
  static async createWish(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, job, submitter, status } = req.body

      // 从认证中间件获取用户信息
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: '请先登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const wish = await WishCreateService.createWish({
        title,
        description,
        job: job as JobType,
        submitter,
        submitterId: userId,
        status: status as WishStatus | undefined,
        userId,
        isAdmin
      })

      res.status(201).json({
        success: true,
        data: {
          wish
        },
        message: '愿望创建成功'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'CREATE_WISH_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '创建愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 更新愿望信息
   * PUT /api/wishes/create/:id
   * 需要认证
   */
  static async updateWish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { title, description, job, submitter, status } = req.body

      // 从认证中间件获取用户信息
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: '请先登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      const wish = await WishCreateService.updateWish({
        id,
        title,
        description,
        job: job as JobType | undefined,
        submitter,
        status: status as WishStatus | undefined,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        data: {
          wish
        },
        message: '愿望更新成功'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'UPDATE_WISH_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '更新愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 删除愿望
   * DELETE /api/wishes/create/:id
   * 需要认证
   */
  static async deleteWish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      // 从认证中间件获取用户信息
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'admin'

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            message: '请先登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      await WishCreateService.deleteWish({
        id,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        message: '愿望删除成功'
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'DELETE_WISH_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '删除愿望失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }
}

export default WishCreateController
