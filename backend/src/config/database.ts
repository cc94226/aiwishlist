import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  charset: string
  timezone: string
  connectionLimit: number
  waitForConnections: boolean
  queueLimit: number
}

/**
 * 从环境变量获取数据库配置
 */
const getDatabaseConfig = (): DatabaseConfig => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aiwishlist',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    waitForConnections: true,
    queueLimit: 0
  }
}

/**
 * 创建数据库连接池
 */
const createConnectionPool = () => {
  const config = getDatabaseConfig()
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: config.charset,
    timezone: config.timezone,
    waitForConnections: config.waitForConnections,
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  })
}

/**
 * 数据库连接池实例
 */
let pool: mysql.Pool | null = null

/**
 * 获取数据库连接池
 * @returns 数据库连接池实例
 */
export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = createConnectionPool()
  }
  return pool
}

/**
 * 测试数据库连接
 * @returns Promise<boolean> 连接是否成功
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const connectionPool = getPool()
    const connection = await connectionPool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ 数据库连接成功')
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    return false
  }
}

/**
 * 关闭数据库连接池
 * @returns Promise<void>
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    console.log('数据库连接池已关闭')
  }
}

/**
 * 执行SQL查询
 * @param sql SQL语句
 * @param params 参数数组
 * @returns Promise<any> 查询结果
 */
export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const connectionPool = getPool()
  const [rows] = await connectionPool.execute(sql, params)
  return rows as T
}

/**
 * 执行事务
 * @param callback 事务回调函数
 * @returns Promise<T> 事务执行结果
 */
export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connectionPool = getPool()
  const connection = await connectionPool.getConnection()

  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * 导出数据库配置（用于其他模块）
 */
export const dbConfig = getDatabaseConfig()

export default {
  getPool,
  testConnection,
  closePool,
  query,
  transaction,
  dbConfig
}
