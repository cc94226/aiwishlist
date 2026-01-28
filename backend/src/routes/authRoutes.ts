import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

/**
 * 认证相关路由
 */
const router = Router()

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', AuthController.register)

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', AuthController.login)

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
router.get('/me', authenticate, AuthController.getMe)

/**
 * 更新用户信息
 * PUT /api/auth/profile
 * 需要认证
 */
router.put('/profile', authenticate, AuthController.updateProfile)

/**
 * 修改密码
 * PUT /api/auth/password
 * 需要认证
 */
router.put('/password', authenticate, AuthController.changePassword)

export default router
