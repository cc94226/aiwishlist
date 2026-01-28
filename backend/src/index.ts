import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { requestLogger, errorHandler, notFoundHandler } from './middleware'
import { testConnection } from './config/database'
import authRouter from './routes/auth'
import wishRouter from './routes/wish'
import interactionRouter from './routes/interaction'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件配置
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志中间件（应该在其他中间件之前）
app.use(requestLogger)

// 健康检查路由
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: '后端服务运行正常' })
})

// 数据库连接测试路由
app.get('/health/db', async (_req: Request, res: Response) => {
  const isConnected = await testConnection()
  res.json({
    status: isConnected ? 'ok' : 'error',
    message: isConnected ? '数据库连接正常' : '数据库连接失败',
    database: isConnected
  })
})

// API路由占位符
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'AI工具需求愿望收集平台 API' })
})

// 认证路由
app.use('/api/auth', authRouter)

// 愿望路由
app.use('/api/wishes', wishRouter)

// 互动路由
app.use('/api/interactions', interactionRouter)

// 404错误处理（必须在所有路由之后）
app.use(notFoundHandler)

// 错误处理中间件（必须在最后）
app.use(errorHandler)

// 启动服务器（仅在非测试环境）
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`)
    console.log(`📝 API文档: http://localhost:${PORT}/api`)

    // 测试数据库连接
    await testConnection()
  })
}

export default app
