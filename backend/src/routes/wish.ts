import { Router } from 'express'
import { WishController } from '../controllers/WishController'
import { WishCreateController } from '../controllers/WishCreateController'
import { optionalAuth, authenticate } from '../middleware/auth'

const router = Router()

/**
 * 愿望相关路由
 * 查询路由使用optionalAuth中间件，支持已登录和未登录用户访问
 * 创建、更新、删除路由使用authenticate中间件，需要登录
 * 已登录用户可以查看自己的草稿，管理员可以查看所有状态的愿望
 */

// ========== 查询路由（可选认证）==========

// 获取愿望列表（可选认证）
router.get('/', optionalAuth, WishController.getWishList)

// 搜索愿望（可选认证，必须在 /:id 之前）
router.get('/search', optionalAuth, WishController.searchWish)

// 根据岗位获取愿望列表（可选认证，必须在 /:id 之前）
router.get('/job/:job', optionalAuth, WishController.getWishesByJob)

// 获取用户提交的愿望列表（可选认证，但需要权限验证，必须在 /:id 之前）
router.get('/user/:userId', optionalAuth, WishController.getWishesByUser)

// 获取热门愿望列表（可选认证，必须在 /:id 之前）
router.get('/popular', optionalAuth, WishController.getPopularWishes)

// 获取最新愿望列表（可选认证，必须在 /:id 之前）
router.get('/latest', optionalAuth, WishController.getLatestWishes)

// 获取愿望详情（可选认证，必须在最后）
router.get('/:id', optionalAuth, WishController.getWishDetail)

// ========== 创建、更新、删除路由（需要认证）==========

// 创建新愿望（需要认证）
router.post('/', authenticate, WishCreateController.createWish)

// 发布愿望（需要认证，必须在 /:id 之前）
router.post('/:id/publish', authenticate, WishCreateController.publishWish)

// 下架愿望（需要认证，必须在 /:id 之前）
router.post('/:id/archive', authenticate, WishCreateController.archiveWish)

// 更新愿望信息（需要认证）
router.put('/:id', authenticate, WishCreateController.updateWish)

// 删除愿望（需要认证）
router.delete('/:id', authenticate, WishCreateController.deleteWish)

export default router
