import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

/**
 * 认证路由
 */
const authRouter = Router()

/**
 * POST /api/auth/login
 * 用户登录
 */
authRouter.post('/login', AuthController.login)

/**
 * POST /api/auth/register
 * 用户注册
 */
authRouter.post('/register', AuthController.register)

/**
 * GET /api/auth/me
 * 获取当前用户信息（需要认证）
 */
authRouter.get('/me', authenticate, AuthController.getCurrentUser)

/**
 * PUT /api/auth/profile
 * 更新用户信息（需要认证）
 */
authRouter.put('/profile', authenticate, AuthController.updateProfile)

/**
 * PUT /api/auth/password
 * 修改密码（需要认证）
 */
authRouter.put('/password', authenticate, AuthController.changePassword)

/**
 * POST /api/auth/logout
 * 用户登出（需要认证）
 */
authRouter.post('/logout', authenticate, AuthController.logout)

export default authRouter
