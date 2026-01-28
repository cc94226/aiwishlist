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
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null
    }

    try {
      // 先尝试从内存缓存获取
      const memoryItem = this.memoryCache.get(key)
      if (memoryItem) {
        if (Date.now() < memoryItem.expiresAt) {
          return memoryItem.data as T
        } else {
          // 已过期，删除
          this.memoryCache.delete(key)
        }
      }

      // 如果配置了Redis，尝试从Redis获取
      if (this.redisClient) {
        try {
          const redisValue = await this.redisClient.get(key)
          if (redisValue) {
            const data = JSON.parse(redisValue)
            // 同时更新内存缓存
            this.setMemoryCache(key, data, this.config.defaultTTL)
            return data as T
          }
        } catch (error) {
          console.error('Redis获取失败:', error)
        }
      }

      return null
    } catch (error) {
      console.error('缓存获取失败:', error)
      return null
    }
  }

  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl: number = this.config.defaultTTL): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    try {
      // 设置内存缓存
      this.setMemoryCache(key, value, ttl)

      // 如果配置了Redis，同时设置Redis缓存
      if (this.redisClient) {
        try {
          const serialized = JSON.stringify(value)
          await this.redisClient.setEx(key, ttl, serialized)
        } catch (error) {
          console.error('Redis设置失败:', error)
        }
      }
    } catch (error) {
      console.error('缓存设置失败:', error)
    }
  }

  /**
   * 设置内存缓存
   */
  private setMemoryCache<T>(key: string, value: T, ttl: number): void {
    const now = Date.now()
    const item: CacheItem<T> = {
      data: value,
      expiresAt: now + ttl * 1000,
      createdAt: now
    }
    this.memoryCache.set(key, item)
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      // 删除内存缓存
      this.memoryCache.delete(key)

      // 如果配置了Redis，同时删除Redis缓存
      if (this.redisClient) {
        try {
          await this.redisClient.del(key)
        } catch (error) {
          console.error('Redis删除失败:', error)
        }
      }
    } catch (error) {
      console.error('缓存删除失败:', error)
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // 删除匹配的内存缓存
      const keysToDelete: string[] = []
      for (const key of this.memoryCache.keys()) {
        if (this.matchPattern(key, pattern)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => this.memoryCache.delete(key))

      // 如果配置了Redis，使用SCAN命令删除匹配的键
      if (this.redisClient) {
        try {
          const keys = await this.redisClient.keys(pattern)
          if (keys.length > 0) {
            await this.redisClient.del(keys)
          }
        } catch (error) {
          console.error('Redis批量删除失败:', error)
        }
      }
    } catch (error) {
      console.error('批量删除缓存失败:', error)
    }
  }

  /**
   * 匹配模式（简单的通配符匹配）
   */
  private matchPattern(key: string, pattern: string): boolean {
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(key)
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      // 清空内存缓存
      this.memoryCache.clear()

      // 如果配置了Redis，清空Redis缓存
      if (this.redisClient) {
        try {
          await this.redisClient.flushDb()
        } catch (error) {
          console.error('Redis清空失败:', error)
        }
      }
    } catch (error) {
      console.error('清空缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false
    }

    try {
      // 检查内存缓存
      const memoryItem = this.memoryCache.get(key)
      if (memoryItem && Date.now() < memoryItem.expiresAt) {
        return true
      }

      // 如果配置了Redis，检查Redis缓存
      if (this.redisClient) {
        try {
          const exists = await this.redisClient.exists(key)
          return exists === 1
        } catch (error) {
          console.error('Redis检查失败:', error)
        }
      }

      return false
    } catch (error) {
      console.error('缓存检查失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    memorySize: number
    memoryKeys: string[]
    redisEnabled: boolean
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
      redisEnabled: this.redisClient !== null
    }
  }

  /**
   * 启动过期清理任务
   */
  private startCleanupTask(): void {
    // 每5分钟清理一次过期缓存
    setInterval(
      () => {
        this.cleanupExpired()
      },
      5 * 60 * 1000
    )
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key))

    if (keysToDelete.length > 0) {
      console.log(`清理了 ${keysToDelete.length} 个过期缓存项`)
    }
  }

  /**
   * 缓存装饰器：自动缓存方法结果
   */
  static cache<T>(cacheService: CacheService, keyGenerator: CacheKeyGenerator, ttl: number = 300) {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const cacheKey = keyGenerator(...args)

        // 尝试从缓存获取
        const cached = await cacheService.get<T>(cacheKey)
        if (cached !== null) {
          return cached
        }

        // 执行原方法
        const result = await method.apply(this, args)

        // 缓存结果
        await cacheService.set(cacheKey, result, ttl)

        return result
      }

      return descriptor
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
      redis: process.env.REDIS_HOST
        ? {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0', 10)
          }
        : undefined
    }
    defaultCacheService = new CacheService(config)
  }
  return defaultCacheService
}

export default CacheService
