import { query } from '../config/database'
import { JobType } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import { getCacheService, CacheKeys } from './CacheService'

/**
 * 岗位分类信息
 */
export interface CategoryInfo {
  /** 岗位类型 */
  job: JobType
  /** 岗位名称 */
  name: string
  /** 该岗位的愿望总数 */
  totalWishes: number
  /** 该岗位已发布的愿望数 */
  publishedWishes: number
  /** 该岗位草稿状态的愿望数 */
  draftWishes: number
  /** 该岗位已归档的愿望数 */
  archivedWishes: number
}

/**
 * 岗位统计信息
 */
export interface CategoryStats {
  /** 所有岗位分类信息列表 */
  categories: CategoryInfo[]
  /** 总愿望数 */
  totalWishes: number
  /** 总已发布愿望数 */
  totalPublishedWishes: number
  /** 总草稿愿望数 */
  totalDraftWishes: number
  /** 总已归档愿望数 */
  totalArchivedWishes: number
}

/**
 * 岗位分类服务类
 * 提供岗位分类相关的业务逻辑（列表、统计信息等）
 */
export class CategoryService {
  /**
   * 所有可用的岗位类型列表
   */
  static readonly ALL_JOBS: JobType[] = [
    '开发',
    '设计',
    '产品',
    '运营',
    '行政',
    '测试',
    '人事',
    '财务'
  ]

  /**
   * 获取所有岗位列表
   * @returns Promise<JobType[]> 岗位类型列表
   */
  static async getAllJobs(): Promise<JobType[]> {
    return [...this.ALL_JOBS]
  }

  /**
   * 验证岗位类型是否有效
   * @param job 岗位类型
   * @returns boolean 是否有效
   */
  static isValidJob(job: string): job is JobType {
    return this.ALL_JOBS.includes(job as JobType)
  }

  /**
   * 获取岗位统计信息
   * @param isAdmin 是否为管理员（管理员可以看到所有状态的愿望，普通用户只能看到已发布的）
   * @returns Promise<CategoryStats> 岗位统计信息
   */
  static async getCategoryStats(isAdmin: boolean = false): Promise<CategoryStats> {
    // 尝试从缓存获取（仅对普通用户的查询进行缓存）
    const cacheService = getCacheService()
    if (!isAdmin) {
      const cacheKey = CacheKeys.categoryStats(isAdmin)
      const cached = cacheService.get<CategoryStats>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const categories: CategoryInfo[] = []
      let totalWishes = 0
      let totalPublishedWishes = 0
      let totalDraftWishes = 0
      let totalArchivedWishes = 0

      // 权限控制：普通用户只能查看已发布的愿望统计
      const statusFilter = isAdmin ? '' : "AND status = 'published'"

      // 遍历所有岗位类型，获取每个岗位的统计信息
      for (const job of this.ALL_JOBS) {
        // 查询该岗位的总愿望数
        const totalResult = await query<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM wishes WHERE job = ? ${statusFilter}`,
          [job]
        )
        const totalWishesForJob = totalResult[0]?.count || 0

        // 查询该岗位已发布的愿望数
        const publishedResult = await query<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'published'`,
          [job]
        )
        const publishedWishesForJob = publishedResult[0]?.count || 0

        // 查询该岗位草稿状态的愿望数（仅管理员可见）
        let draftWishesForJob = 0
        let archivedWishesForJob = 0
        if (isAdmin) {
          const draftResult = await query<{ count: number }[]>(
            `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'draft'`,
            [job]
          )
          draftWishesForJob = draftResult[0]?.count || 0

          const archivedResult = await query<{ count: number }[]>(
            `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'archived'`,
            [job]
          )
          archivedWishesForJob = archivedResult[0]?.count || 0
        }

        categories.push({
          job,
          name: job, // 岗位名称就是岗位类型本身
          totalWishes: totalWishesForJob,
          publishedWishes: publishedWishesForJob,
          draftWishes: draftWishesForJob,
          archivedWishes: archivedWishesForJob
        })

        // 累加总数
        totalWishes += totalWishesForJob
        totalPublishedWishes += publishedWishesForJob
        totalDraftWishes += draftWishesForJob
        totalArchivedWishes += archivedWishesForJob
      }

      const result = {
        categories,
        totalWishes,
        totalPublishedWishes,
        totalDraftWishes,
        totalArchivedWishes
      }

      // 缓存结果（仅对普通用户的查询进行缓存）
      if (!isAdmin) {
        const cacheKey = CacheKeys.categoryStats(isAdmin)
        cacheService.set(cacheKey, result, 600) // 缓存10分钟
      }

      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取岗位统计信息失败', 500, 'GET_CATEGORY_STATS_FAILED')
    }
  }

  /**
   * 获取指定岗位的统计信息
   * @param job 岗位类型
   * @param isAdmin 是否为管理员
   * @returns Promise<CategoryInfo> 岗位统计信息
   */
  static async getCategoryInfo(job: JobType, isAdmin: boolean = false): Promise<CategoryInfo> {
    // 验证岗位类型
    if (!job || !this.isValidJob(job)) {
      throw new AppError('无效的岗位类型', 400, 'INVALID_JOB_TYPE')
    }

    try {
      // 权限控制：普通用户只能查看已发布的愿望统计
      const statusFilter = isAdmin ? '' : "AND status = 'published'"

      // 查询该岗位的总愿望数
      const totalResult = await query<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM wishes WHERE job = ? ${statusFilter}`,
        [job]
      )
      const totalWishes = totalResult[0]?.count || 0

      // 查询该岗位已发布的愿望数
      const publishedResult = await query<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'published'`,
        [job]
      )
      const publishedWishes = publishedResult[0]?.count || 0

      // 查询该岗位草稿状态的愿望数（仅管理员可见）
      let draftWishes = 0
      let archivedWishes = 0
      if (isAdmin) {
        const draftResult = await query<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'draft'`,
          [job]
        )
        draftWishes = draftResult[0]?.count || 0

        const archivedResult = await query<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM wishes WHERE job = ? AND status = 'archived'`,
          [job]
        )
        archivedWishes = archivedResult[0]?.count || 0
      }

      return {
        job,
        name: job,
        totalWishes,
        publishedWishes,
        draftWishes,
        archivedWishes
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取岗位统计信息失败', 500, 'GET_CATEGORY_INFO_FAILED')
    }
  }

  /**
   * 获取岗位列表（包含每个岗位的愿望数量）
   * @param isAdmin 是否为管理员
   * @returns Promise<CategoryInfo[]> 岗位列表（包含统计信息）
   */
  static async getCategoriesWithStats(isAdmin: boolean = false): Promise<CategoryInfo[]> {
    try {
      const stats = await this.getCategoryStats(isAdmin)
      return stats.categories
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('获取岗位列表失败', 500, 'GET_CATEGORIES_FAILED')
    }
  }
}
