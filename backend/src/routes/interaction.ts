import { Router } from 'express'
import { InteractionController } from '../controllers/InteractionController'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

/**
 * 互动相关路由
 * 点赞、收藏、评论功能都需要用户登录
 * 查询评论列表和统计信息可以使用optionalAuth，支持未登录用户查看
 */

// ========== 点赞相关路由（需要认证）==========

// 点赞愿望（需要认证）
router.post('/likes', authenticate, InteractionController.likeWish)

// 取消点赞（需要认证）
router.delete('/likes', authenticate, InteractionController.unlikeWish)

// 检查点赞状态（需要认证）
router.get('/likes/status', authenticate, InteractionController.checkLikeStatus)

// ========== 收藏相关路由（需要认证）==========

// 收藏愿望（需要认证）
router.post('/favorites', authenticate, InteractionController.favoriteWish)

// 取消收藏（需要认证）
router.delete('/favorites', authenticate, InteractionController.unfavoriteWish)

// 检查收藏状态（需要认证）
router.get('/favorites/status', authenticate, InteractionController.checkFavoriteStatus)

// 获取用户收藏列表（需要认证）
router.get('/favorites', authenticate, InteractionController.getFavorites)

// ========== 评论相关路由 ==========

// 创建评论（需要认证）
router.post('/comments', authenticate, InteractionController.createComment)

// 更新评论（需要认证）
router.put('/comments/:id', authenticate, InteractionController.updateComment)

// 删除评论（需要认证）
router.delete('/comments/:id', authenticate, InteractionController.deleteComment)

// 获取评论列表（可选认证，支持未登录用户查看）
router.get('/comments', optionalAuth, InteractionController.getComments)

// ========== 统计信息路由（可选认证）==========

// 获取互动统计信息（可选认证，支持未登录用户查看）
router.get('/stats/:wishId', optionalAuth, InteractionController.getInteractionStats)

export default router
