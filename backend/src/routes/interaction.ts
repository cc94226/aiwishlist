import { Router } from 'express'
import { InteractionController } from '../controllers/InteractionController'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

/**
 * 互动相关路由
 */

// 点赞愿望（需要认证）
router.post('/like', authenticate, InteractionController.likeWish)

// 取消点赞（需要认证）
router.post('/unlike', authenticate, InteractionController.unlikeWish)

// 检查点赞状态（需要认证）
router.get('/like/status/:wishId', authenticate, InteractionController.checkLikeStatus)

// 收藏愿望（需要认证）
router.post('/favorite', authenticate, InteractionController.favoriteWish)

// 取消收藏（需要认证）
router.post('/unfavorite', authenticate, InteractionController.unfavoriteWish)

// 检查收藏状态（需要认证）
router.get('/favorite/status/:wishId', authenticate, InteractionController.checkFavoriteStatus)

// 创建评论（需要认证）
router.post('/comments', authenticate, InteractionController.createComment)

// 更新评论（需要认证）
router.put('/comments/:commentId', authenticate, InteractionController.updateComment)

// 删除评论（需要认证）
router.delete('/comments/:commentId', authenticate, InteractionController.deleteComment)

// 获取评论列表（可选认证，未登录用户也可以查看）
router.get('/comments/:wishId', optionalAuth, InteractionController.getComments)

// 获取用户收藏列表（需要认证）
router.get('/favorites', authenticate, InteractionController.getFavorites)

// 获取互动统计信息（可选认证）
router.get('/stats/:wishId', optionalAuth, InteractionController.getInteractionStats)

export default router
