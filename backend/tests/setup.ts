/**
 * Jest测试环境设置文件
 * 在每个测试文件运行前执行
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-jwt-token-generation'
process.env.JWT_EXPIRES_IN = '7d'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '3306'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || ''
process.env.DB_NAME = process.env.DB_NAME || 'aiwishlist_test'

// 增加超时时间（用于数据库操作）
jest.setTimeout(10000)
