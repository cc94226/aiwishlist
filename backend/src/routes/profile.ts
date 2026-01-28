import { Router } from 'express'
import { ProfileController } from '../controllers/ProfileController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * 个人中心相关路由
 * 所有路由都需要用户登录认证
 */

// ========== 个人资料相关路由 ==========

// 获取用户个人资料（包含统计信息）
router.get('/:userId', authenticate, ProfileController.getUserProfile)

// 获取当前用户个人资料（包含统计信息）
router.get('/me', authenticate, ProfileController.getCurrentUserProfile)

// ========== 愿望列表相关路由 ==========

// 获取用户的愿望列表
router.get('/:userId/wishes', authenticate, ProfileController.getUserWishes)

// 获取当前用户的愿望列表
router.get('/me/wishes', authenticate, ProfileController.getCurrentUserWishes)

// ========== 收藏列表相关路由 ==========

// 获取用户的收藏列表
router.get('/:userId/favorites', authenticate, ProfileController.getUserFavorites)

// 获取当前用户的收藏列表
router.get('/me/favorites', authenticate, ProfileController.getCurrentUserFavorites)

// ========== 统计信息相关路由 ==========

// 获取用户的愿望统计信息
router.get('/:userId/stats/wishes', authenticate, ProfileController.getUserWishStats)

// 获取用户的互动统计信息
router.get('/:userId/stats/interactions', authenticate, ProfileController.getUserInteractionStats)

export default router
