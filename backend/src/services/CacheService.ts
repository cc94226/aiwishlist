/**
 * 缓存服务
 * 提供统一的数据缓存策略，支持内存缓存和Redis缓存
 */

// import { AppError } from '../middleware/errorHandler' // 暂时未使用

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 默认TTL（秒） */
  defaultTTL?: number
  /** 是否启用缓存 */
  enabled?: boolean
  /** Redis配置（可选） */
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  } | null
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  /** 缓存数据 */
  data: T
  /** 过期时间戳（毫秒） */
  expiresAt: number
  /** 创建时间戳（毫秒） */
  createdAt: number
}

/**
 * 缓存键生成器类型
 */
export type CacheKeyGenerator = (...args: any[]) => string

/**
 * 缓存服务类
 * 提供内存缓存和可选的Redis缓存支持
 */
export class CacheService {
  private memoryCache: Map<string, CacheItem<any>>
  private redisClient: any = null
  private config: {
    defaultTTL: number
    enabled: boolean
    redis: { host: string; port: number; password?: string; db?: number } | null
  }

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 300, // 默认5分钟
      enabled: config.enabled !== false, // 默认启用
      redis: config.redis || null
    }

    // 初始化内存缓存
    this.memoryCache = new Map()

    // 如果配置了Redis，初始化Redis客户端
    if (this.config.redis) {
      this.initRedis()
    }

    // 启动过期清理任务
    this.startCleanupTask()
  }

  /**
   * 初始化Redis客户端
   */
  private async initRedis() {
    try {
      // 动态导入redis模块（如果安装了）
      // 动态导入redis（如果安装了redis包）
      // 使用try-catch处理redis模块不存在的情况
      let redis: any = null
      try {
        // @ts-ignore - redis包是可选的
        redis = await import('redis')
      } catch {
        // redis包未安装，使用内存缓存
        redis = null
      }
      this.redisClient = redis.createClient({
        socket: {
          host: this.config.redis!.host,
          port: this.config.redis!.port
        },
        password: this.config.redis!.password,
        database: this.config.redis!.db || 0
      })

      this.redisClient.on('error', (err: Error) => {
        console.error('Redis客户端错误:', err)
        this.redisClient = null // 禁用Redis，回退到内存缓存
      })

      await this.redisClient.connect()
      console.log('Redis缓存已连接')
    } catch (error) {
      console.warn('Redis未安装或连接失败，使用内存缓存:', error)
      this.redisClient = null
    }
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | undefined {
    if (!this.config.enabled) {
      return undefined
    }

    try {
      return this.cache.get(key) as T | undefined
    } catch (error) {
      console.error('缓存获取失败:', error)
      return undefined
    }
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) {
      return
    }

    try {
      const cacheTtl = ttl ? ttl * 1000 : this.config.defaultTTL * 1000
      this.cache.set(key, value, { ttl: cacheTtl })
    } catch (error) {
      console.error('缓存设置失败:', error)
    }
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    try {
      return this.cache.delete(key)
    } catch (error) {
      console.error('缓存删除失败:', error)
      return false
    }
  }

  /**
   * 批量删除缓存（支持前缀匹配）
   */
  deleteByPrefix(prefix: string): number {
    let count = 0
    const keysToDelete: string[] = []

    // 收集所有匹配前缀的键
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    // 删除匹配的键
    for (const key of keysToDelete) {
      if (this.cache.delete(key)) {
        count++
      }
    }

    return count
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    try {
      this.cache.clear()
    } catch (error) {
      console.error('清空缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.config.enabled) {
      return false
    }

    try {
      return this.cache.has(key)
    } catch (error) {
      console.error('缓存检查失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    maxSize: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.max
    }
  }
}

/**
 * 预定义的缓存键生成器
 */
export const CacheKeys = {
  /** 愿望列表缓存键 */
  wishList: (params: {
    job?: string
    status?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: string
  }) => {
    return `wish:list:${JSON.stringify(params)}`
  },

  /** 愿望详情缓存键 */
  wishDetail: (id: string) => `wish:detail:${id}`,

  /** 用户信息缓存键 */
  userInfo: (id: string) => `user:info:${id}`,

  /** 用户愿望列表缓存键 */
  userWishes: (userId: string, params?: any) => {
    return `user:${userId}:wishes:${JSON.stringify(params || {})}`
  },

  /** 岗位统计缓存键 */
  categoryStats: () => 'category:stats',

  /** 热门愿望缓存键 */
  popularWishes: (limit?: number) => `wish:popular:${limit || 10}`,

  /** 最新愿望缓存键 */
  latestWishes: (limit?: number) => `wish:latest:${limit || 10}`
}

/**
 * 创建默认缓存服务实例
 */
let defaultCacheService: CacheService | null = null

/**
 * 获取默认缓存服务实例
 */
export function getCacheService(): CacheService {
  if (!defaultCacheService) {
    const config: CacheConfig = {
      defaultTTL: parseInt(process.env.CACHE_TTL || '300', 10),
      enabled: process.env.CACHE_ENABLED !== 'false',
      max: parseInt(process.env.CACHE_MAX || '100', 10)
    }
    defaultCacheService = new CacheService(config)
  }
  return defaultCacheService
}

export default CacheService
