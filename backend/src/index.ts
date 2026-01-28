import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件配置
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查路由
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '后端服务运行正常' })
})

// API路由占位符
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'AI工具需求愿望收集平台 API' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`)
  console.log(`📝 API文档: http://localhost:${PORT}/api`)
})

export default app
