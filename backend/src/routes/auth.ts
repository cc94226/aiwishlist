import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * 认证相关路由
 */

// 用户注册（不需要认证）
router.post('/register', AuthController.register)

// 用户登录（不需要认证）
router.post('/login', AuthController.login)

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, AuthController.getCurrentUser)

// 更新用户信息（需要认证）
router.put('/profile', authenticate, AuthController.updateProfile)

// 修改密码（需要认证）
router.put('/password', authenticate, AuthController.changePassword)

export default router
