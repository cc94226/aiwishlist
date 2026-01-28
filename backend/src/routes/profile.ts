import express from 'express'
import { ProfileController } from '../controllers/ProfileController'
import { authenticate } from '../middleware/auth'

const router = express.Router()

/**
 * 个人中心路由
 * 所有路由都需要认证
 */

// 获取当前用户的个人资料（包含统计信息）
router.get('/me', authenticate, ProfileController.getMyProfile)

// 获取指定用户的个人资料（包含统计信息）
router.get('/:userId', authenticate, ProfileController.getProfile)

// 获取用户的愿望列表
router.get('/:userId/wishes', authenticate, ProfileController.getUserWishes)

// 获取用户的收藏列表
router.get('/:userId/favorites', authenticate, ProfileController.getUserFavorites)

// 获取用户的愿望统计信息
router.get('/:userId/stats/wishes', authenticate, ProfileController.getUserWishStats)

// 获取用户的互动统计信息
router.get('/:userId/stats/interactions', authenticate, ProfileController.getUserInteractionStats)

export default router
