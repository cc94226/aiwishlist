import { LRUCache } from 'lru-cache'

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 默认TTL（秒） */
  defaultTTL?: number
  /** 是否启用缓存 */
  enabled?: boolean
  /** 最大缓存项数量 */
  max?: number
}

/**
 * 缓存服务类
 * 提供基于LRU（最近最少使用）策略的内存缓存
 */
export class CacheService {
  private cache: LRUCache<string, any>
  private config: {
    defaultTTL: number
    enabled: boolean
    max: number
  }

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 300, // 默认5分钟
      enabled: config.enabled !== false, // 默认启用
      max: config.max || 100 // 默认最多100项
    }

    // 初始化LRU缓存
    this.cache = new LRUCache<string, any>({
      max: this.config.max,
      ttl: this.config.defaultTTL * 1000, // 转换为毫秒
      updateAgeOnGet: true, // 访问时更新过期时间
      updateAgeOnHas: false // 检查时不更新过期时间
    })
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
   * 批量删除缓存（支持通配符模式）
   */
  deletePattern(pattern: string): number {
    let count = 0
    const keysToDelete: string[] = []

    // 将通配符模式转换为正则表达式
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)

    // 收集所有匹配模式的键
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
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
    userId?: string
    isAdmin?: boolean
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
  categoryStats: (isAdmin?: boolean) => `category:stats:${isAdmin ? 'admin' : 'user'}`,

  /** 岗位信息缓存键 */
  categoryInfo: (job: string, isAdmin?: boolean) =>
    `category:info:${job}:${isAdmin ? 'admin' : 'user'}`,

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
