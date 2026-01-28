import { Router } from 'express'
import { WishController } from '../controllers/WishController'
import { optionalAuth } from '../middleware/auth'

const router = Router()

/**
 * 愿望相关路由
 * 大部分路由使用optionalAuth中间件，支持已登录和未登录用户访问
 * 已登录用户可以查看自己的草稿，管理员可以查看所有状态的愿望
 */

// 获取愿望列表（可选认证）
router.get('/', optionalAuth, WishController.getWishList)

// 获取愿望详情（可选认证）
router.get('/:id', optionalAuth, WishController.getWishDetail)

// 搜索愿望（可选认证）
router.get('/search', optionalAuth, WishController.searchWish)

// 根据岗位获取愿望列表（可选认证）
router.get('/job/:job', optionalAuth, WishController.getWishesByJob)

// 获取用户提交的愿望列表（可选认证，但需要权限验证）
router.get('/user/:userId', optionalAuth, WishController.getWishesByUser)

// 获取热门愿望列表（可选认证）
router.get('/popular', optionalAuth, WishController.getPopularWishes)

// 获取最新愿望列表（可选认证）
router.get('/latest', optionalAuth, WishController.getLatestWishes)

export default router
