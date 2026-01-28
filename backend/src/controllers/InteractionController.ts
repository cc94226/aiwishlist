import { Request, Response } from 'express'
import { InteractionService } from '../services/InteractionService'
import { AppError } from '../middleware/errorHandler'

/**
 * 互动控制器
 * 处理点赞、收藏、评论相关的HTTP请求
 */
export class InteractionController {
  /**
   * 点赞愿望
   * POST /api/interactions/like
   * 需要认证
   */
  static async likeWish(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.body
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await InteractionService.likeWish({ wishId, userId })

      res.status(200).json({
        success: true,
        message: '点赞成功',
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'LIKE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '点赞失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 取消点赞
   * POST /api/interactions/unlike
   * 需要认证
   */
  static async unlikeWish(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.body
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await InteractionService.unlikeWish({ wishId, userId })

      res.status(200).json({
        success: true,
        message: '取消点赞成功',
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'UNLIKE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '取消点赞失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 检查点赞状态
   * GET /api/interactions/like/status/:wishId
   * 需要认证
   */
  static async checkLikeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.params
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const liked = await InteractionService.checkLikeStatus(wishId, userId)

      res.status(200).json({
        success: true,
        data: {
          liked
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'CHECK_LIKE_STATUS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '检查点赞状态失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 收藏愿望
   * POST /api/interactions/favorite
   * 需要认证
   */
  static async favoriteWish(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.body
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await InteractionService.favoriteWish({ wishId, userId })

      res.status(200).json({
        success: true,
        message: '收藏成功',
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'FAVORITE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '收藏失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 取消收藏
   * POST /api/interactions/unfavorite
   * 需要认证
   */
  static async unfavoriteWish(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.body
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await InteractionService.unfavoriteWish({ wishId, userId })

      res.status(200).json({
        success: true,
        message: '取消收藏成功',
        data: result
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'UNFAVORITE_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '取消收藏失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 检查收藏状态
   * GET /api/interactions/favorite/status/:wishId
   * 需要认证
   */
  static async checkFavoriteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.params
      const userId = req.user?.id

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

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const favorited = await InteractionService.checkFavoriteStatus(wishId, userId)

      res.status(200).json({
        success: true,
        data: {
          favorited
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'CHECK_FAVORITE_STATUS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '检查收藏状态失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 创建评论
   * POST /api/interactions/comments
   * 需要认证
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { wishId, content } = req.body
      const userId = req.user?.id
      const userName = req.user?.name

      if (!userId || !userName) {
        res.status(401).json({
          success: false,
          error: {
            message: '请先登录',
            code: 'UNAUTHORIZED'
          }
        })
        return
      }

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: '评论内容不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const comment = await InteractionService.createComment({
        wishId,
        content,
        author: userName,
        authorId: userId
      })

      res.status(201).json({
        success: true,
        message: '评论成功',
        data: {
          comment
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'CREATE_COMMENT_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '评论失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 更新评论
   * PUT /api/interactions/comments/:commentId
   * 需要认证
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params
      const { content } = req.body
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

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: '评论内容不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const comment = await InteractionService.updateComment({
        commentId,
        content,
        userId,
        isAdmin
      })

      res.status(200).json({
        success: true,
        message: '更新评论成功',
        data: {
          comment
        }
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'UPDATE_COMMENT_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '更新评论失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 删除评论
   * DELETE /api/interactions/comments/:commentId
   * 需要认证
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params
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

      const success = await InteractionService.deleteComment({
        commentId,
        userId,
        isAdmin
      })

      if (success) {
        res.status(200).json({
          success: true,
          message: '删除评论成功'
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '删除评论失败',
            code: 'DELETE_COMMENT_FAILED'
          }
        })
      }
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code || 'DELETE_COMMENT_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '删除评论失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取评论列表
   * GET /api/interactions/comments/:wishId
   * 可选认证（未登录用户也可以查看评论）
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.params
      const { page, pageSize, sortBy, sortOrder } = req.query

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const result = await InteractionService.getComments({
        wishId,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
        sortBy: sortBy as 'created_at' | 'updated_at' | undefined,
        sortOrder: sortOrder as 'ASC' | 'DESC' | undefined
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
            code: error.code || 'GET_COMMENTS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取评论列表失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }

  /**
   * 获取用户收藏列表
   * GET /api/interactions/favorites
   * 需要认证
   */
  static async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { page, pageSize } = req.query

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

      const result = await InteractionService.getFavorites({
        userId,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined
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
   * 获取互动统计信息
   * GET /api/interactions/stats/:wishId
   * 可选认证（未登录用户也可以查看统计，但不会显示用户是否点赞/收藏）
   */
  static async getInteractionStats(req: Request, res: Response): Promise<void> {
    try {
      const { wishId } = req.params
      const userId = req.user?.id

      if (!wishId) {
        res.status(400).json({
          success: false,
          error: {
            message: '愿望ID不能为空',
            code: 'INVALID_INPUT'
          }
        })
        return
      }

      const stats = await InteractionService.getInteractionStats(wishId, userId)

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
            code: error.code || 'GET_INTERACTION_STATS_FAILED'
          }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: '获取互动统计信息失败',
            code: 'INTERNAL_ERROR'
          }
        })
      }
    }
  }
}

export default InteractionController
