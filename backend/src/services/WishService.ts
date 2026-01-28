import { WishModel, Wish, WishQueryOptions, WishQueryResult, WishStatus } from '../models/Wish'
import { JobType } from '../models/User'
import { AppError } from '../middleware/errorHandler'

/**
 * 获取愿望列表请求参数
 */
export interface GetWishListRequest {
  job?: JobType
  status?: WishStatus
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'likes' | 'updated_at'
  sortOrder?: 'ASC' | 'DESC'
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 获取愿望详情请求参数
 */
export interface GetWishDetailRequest {
  id: string
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 搜索愿望请求参数
 */
export interface SearchWishRequest {
  keyword: string
  job?: JobType
  page?: number
  pageSize?: number
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 愿望查询服务类
 * 提供愿望查询相关的业务逻辑（列表、详情、搜索）
 */
export class WishService {
  /**
   * 获取愿望列表
   * @param request 查询请求参数
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async getWishList(request: GetWishListRequest): Promise<WishQueryResult> {
    const {
      job,
      status,
      search,
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      userId,
      isAdmin = false
    } = request

    // 权限控制：普通用户只能查看已发布的愿望，管理员可以查看所有状态
    let queryStatus: WishStatus | undefined = status
    if (!isAdmin && !status) {
      // 普通用户默认只查看已发布的愿望
      queryStatus = 'published'
    }

    // 构建查询选项
    const queryOptions: WishQueryOptions = {
      job,
      status: queryStatus,
      search,
      page: Math.max(1, page), // 确保页码至少为1
      pageSize: Math.min(Math.max(1, pageSize), 100), // 限制每页最多100条
      sortBy,
      sortOrder
    }

    // 如果指定了用户ID，只查询该用户提交的愿望
    if (userId) {
      queryOptions.submitter_id = userId
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询愿望列表失败', 500, 'QUERY_WISH_LIST_FAILED')
    }
  }

  /**
   * 获取愿望详情
   * @param request 查询请求参数
   * @returns Promise<Wish> 愿望详情
   */
  static async getWishDetail(request: GetWishDetailRequest): Promise<Wish> {
    const { id, userId, isAdmin = false } = request

    // 验证ID
    if (!id || id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    try {
      const wish = await WishModel.findById(id)

      if (!wish) {
        throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
      }

      // 权限控制：普通用户只能查看已发布的愿望，管理员可以查看所有状态
      // 如果愿望是草稿状态，只有管理员或愿望提交者可以查看
      if (wish.status === 'draft' && !isAdmin) {
        if (!userId || wish.submitter_id !== userId) {
          throw new AppError('无权访问此愿望', 403, 'FORBIDDEN')
        }
      }

      // 普通用户不能查看已下架的愿望（除非是自己提交的）
      if (wish.status === 'archived' && !isAdmin) {
        if (!userId || wish.submitter_id !== userId) {
          throw new AppError('愿望已下架', 404, 'WISH_NOT_FOUND')
        }
      }

      return wish
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询愿望详情失败', 500, 'QUERY_WISH_DETAIL_FAILED')
    }
  }

  /**
   * 搜索愿望
   * @param request 搜索请求参数
   * @returns Promise<WishQueryResult> 搜索结果和分页信息
   */
  static async searchWish(request: SearchWishRequest): Promise<WishQueryResult> {
    const {
      keyword,
      job,
      page = 1,
      pageSize = 10,
      userId,
      isAdmin = false
    } = request

    // 验证搜索关键词
    if (!keyword || keyword.trim().length === 0) {
      throw new AppError('搜索关键词不能为空', 400, 'INVALID_INPUT')
    }

    // 权限控制：普通用户只能搜索已发布的愿望，管理员可以搜索所有状态
    const queryOptions: WishQueryOptions = {
      search: keyword.trim(),
      job,
      status: isAdmin ? undefined : 'published', // 普通用户只搜索已发布的
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    // 如果指定了用户ID，只搜索该用户提交的愿望
    if (userId) {
      queryOptions.submitter_id = userId
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('搜索愿望失败', 500, 'SEARCH_WISH_FAILED')
    }
  }

  /**
   * 根据岗位获取愿望列表
   * @param job 岗位类型
   * @param page 页码
   * @param pageSize 每页数量
   * @param isAdmin 是否为管理员
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async getWishesByJob(
    job: JobType,
    page: number = 1,
    pageSize: number = 10,
    isAdmin: boolean = false
  ): Promise<WishQueryResult> {
    // 验证岗位类型
    if (!job) {
      throw new AppError('岗位类型不能为空', 400, 'INVALID_INPUT')
    }

    // 权限控制：普通用户只能查看已发布的愿望
    const status: WishStatus | undefined = isAdmin ? undefined : 'published'

    const queryOptions: WishQueryOptions = {
      job,
      status,
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('根据岗位查询愿望失败', 500, 'QUERY_WISH_BY_JOB_FAILED')
    }
  }

  /**
   * 获取用户提交的愿望列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param isAdmin 是否为管理员（管理员可以查看所有用户的愿望）
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async getWishesByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    isAdmin: boolean = false
  ): Promise<WishQueryResult> {
    // 验证用户ID
    if (!userId || userId.trim().length === 0) {
      throw new AppError('用户ID不能为空', 400, 'INVALID_INPUT')
    }

    const queryOptions: WishQueryOptions = {
      submitter_id: userId,
      status: isAdmin ? undefined : 'published', // 普通用户只能查看已发布的
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询用户愿望列表失败', 500, 'QUERY_USER_WISHES_FAILED')
    }
  }

  /**
   * 获取热门愿望列表（按点赞数排序）
   * @param page 页码
   * @param pageSize 每页数量
   * @param isAdmin 是否为管理员
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async getPopularWishes(
    page: number = 1,
    pageSize: number = 10,
    isAdmin: boolean = false
  ): Promise<WishQueryResult> {
    const queryOptions: WishQueryOptions = {
      status: isAdmin ? undefined : 'published', // 普通用户只能查看已发布的
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy: 'likes',
      sortOrder: 'DESC'
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询热门愿望失败', 500, 'QUERY_POPULAR_WISHES_FAILED')
    }
  }

  /**
   * 获取最新愿望列表（按创建时间排序）
   * @param page 页码
   * @param pageSize 每页数量
   * @param isAdmin 是否为管理员
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async getLatestWishes(
    page: number = 1,
    pageSize: number = 10,
    isAdmin: boolean = false
  ): Promise<WishQueryResult> {
    const queryOptions: WishQueryOptions = {
      status: isAdmin ? undefined : 'published', // 普通用户只能查看已发布的
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    try {
      const result = await WishModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询最新愿望失败', 500, 'QUERY_LATEST_WISHES_FAILED')
    }
  }
}

export default WishService
