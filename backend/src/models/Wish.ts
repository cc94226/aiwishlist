import { query } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { JobType } from './User'

/**
 * 愿望状态枚举
 */
export type WishStatus = 'draft' | 'published' | 'archived'

/**
 * 愿望数据模型接口
 */
export interface Wish {
  id: string
  title: string
  description: string
  job: JobType
  submitter: string
  submitter_id?: string | null
  status: WishStatus
  likes: number
  created_at: Date | string
  updated_at: Date | string
}

/**
 * 创建愿望数据模型接口（不包含id和时间戳）
 */
export interface CreateWishData {
  title: string
  description: string
  job: JobType
  submitter: string
  submitter_id?: string | null
  status?: WishStatus
}

/**
 * 更新愿望数据模型接口（所有字段可选）
 */
export interface UpdateWishData {
  title?: string
  description?: string
  job?: JobType
  submitter?: string
  submitter_id?: string | null
  status?: WishStatus
}

/**
 * 愿望查询选项
 */
export interface WishQueryOptions {
  job?: JobType
  status?: WishStatus
  submitter_id?: string
  search?: string // 搜索关键词（搜索标题和描述）
  page?: number // 页码（从1开始）
  pageSize?: number // 每页数量
  sortBy?: 'created_at' | 'likes' | 'updated_at' // 排序字段
  sortOrder?: 'ASC' | 'DESC' // 排序顺序
}

/**
 * 愿望查询结果（包含分页信息）
 */
export interface WishQueryResult {
  wishes: Wish[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 愿望模型类
 * 提供愿望相关的数据库操作方法
 */
export class WishModel {
  /**
   * 根据ID查询愿望
   * @param id 愿望ID
   * @returns Promise<Wish | null> 愿望信息
   */
  static async findById(id: string): Promise<Wish | null> {
    const sql = `
      SELECT id, title, description, job, submitter, submitter_id, status, likes, created_at, updated_at
      FROM wishes
      WHERE id = ?
    `
    const results = await query<Wish[]>(sql, [id])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 创建新愿望
   * @param wishData 愿望数据
   * @returns Promise<Wish> 创建的愿望信息
   */
  static async create(wishData: CreateWishData): Promise<Wish> {
    // 验证必填字段
    if (!wishData.title || wishData.title.trim().length === 0) {
      throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
    }
    if (!wishData.description || wishData.description.trim().length === 0) {
      throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
    }
    if (!wishData.job) {
      throw new AppError('提交者岗位不能为空', 400, 'INVALID_INPUT')
    }
    if (!wishData.submitter || wishData.submitter.trim().length === 0) {
      throw new AppError('提交者姓名不能为空', 400, 'INVALID_INPUT')
    }

    // 生成UUID
    const id = this.generateUUID()
    const status = wishData.status || 'draft'

    const sql = `
      INSERT INTO wishes (id, title, description, job, submitter, submitter_id, status, likes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `
    await query(sql, [
      id,
      wishData.title.trim(),
      wishData.description.trim(),
      wishData.job,
      wishData.submitter.trim(),
      wishData.submitter_id || null,
      status
    ])

    // 返回创建的愿望
    const createdWish = await this.findById(id)
    if (!createdWish) {
      throw new AppError('创建愿望失败', 500, 'CREATE_WISH_FAILED')
    }

    return createdWish
  }

  /**
   * 更新愿望信息
   * @param id 愿望ID
   * @param wishData 要更新的愿望数据
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async update(id: string, wishData: UpdateWishData): Promise<Wish> {
    // 检查愿望是否存在
    const existingWish = await this.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 构建更新SQL
    const updates: string[] = []
    const values: any[] = []

    if (wishData.title !== undefined) {
      if (!wishData.title || wishData.title.trim().length === 0) {
        throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
      }
      updates.push('title = ?')
      values.push(wishData.title.trim())
    }
    if (wishData.description !== undefined) {
      if (!wishData.description || wishData.description.trim().length === 0) {
        throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
      }
      updates.push('description = ?')
      values.push(wishData.description.trim())
    }
    if (wishData.job !== undefined) {
      updates.push('job = ?')
      values.push(wishData.job)
    }
    if (wishData.submitter !== undefined) {
      if (!wishData.submitter || wishData.submitter.trim().length === 0) {
        throw new AppError('提交者姓名不能为空', 400, 'INVALID_INPUT')
      }
      updates.push('submitter = ?')
      values.push(wishData.submitter.trim())
    }
    if (wishData.submitter_id !== undefined) {
      updates.push('submitter_id = ?')
      values.push(wishData.submitter_id || null)
    }
    if (wishData.status !== undefined) {
      updates.push('status = ?')
      values.push(wishData.status)
    }

    if (updates.length === 0) {
      // 没有要更新的字段，直接返回原愿望信息
      return existingWish
    }

    // 添加更新时间
    updates.push('updated_at = NOW()')
    values.push(id)

    const sql = `UPDATE wishes SET ${updates.join(', ')} WHERE id = ?`
    await query(sql, values)

    // 返回更新后的愿望信息
    const updatedWish = await this.findById(id)
    if (!updatedWish) {
      throw new AppError('更新愿望失败', 500, 'UPDATE_WISH_FAILED')
    }

    return updatedWish
  }

  /**
   * 删除愿望
   * @param id 愿望ID
   * @returns Promise<boolean> 是否删除成功
   */
  static async delete(id: string): Promise<boolean> {
    // 检查愿望是否存在
    const existingWish = await this.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    const sql = 'DELETE FROM wishes WHERE id = ?'
    const result = await query<{ affectedRows: number }>(sql, [id])

    return result.affectedRows > 0
  }

  /**
   * 查询愿望列表（支持分页、筛选、排序）
   * @param options 查询选项
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async findAll(options: WishQueryOptions = {}): Promise<WishQueryResult> {
    const {
      job,
      status,
      submitter_id,
      search,
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options

    const offset = (page - 1) * pageSize

    // 构建WHERE条件
    const conditions: string[] = []
    const values: any[] = []

    if (job) {
      conditions.push('job = ?')
      values.push(job)
    }
    if (status) {
      conditions.push('status = ?')
      values.push(status)
    }
    if (submitter_id) {
      conditions.push('submitter_id = ?')
      values.push(submitter_id)
    }
    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      const searchPattern = `%${search}%`
      values.push(searchPattern, searchPattern)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM wishes ${whereClause}`
    const countResult = await query<{ total: number }[]>(countSql, values)
    const total = countResult[0]?.total || 0

    // 查询愿望列表
    const sql = `
      SELECT id, title, description, job, submitter, submitter_id, status, likes, created_at, updated_at
      FROM wishes
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `
    const wishes = await query<Wish[]>(sql, [...values, pageSize, offset])

    const totalPages = Math.ceil(total / pageSize)

    return {
      wishes,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * 根据岗位查询愿望
   * @param job 岗位类型
   * @param status 愿望状态（可选，默认查询已发布的）
   * @returns Promise<Wish[]> 愿望列表
   */
  static async findByJob(
    job: JobType,
    status: WishStatus = 'published'
  ): Promise<Wish[]> {
    const sql = `
      SELECT id, title, description, job, submitter, submitter_id, status, likes, created_at, updated_at
      FROM wishes
      WHERE job = ? AND status = ?
      ORDER BY created_at DESC
    `
    const wishes = await query<Wish[]>(sql, [job, status])

    return wishes
  }

  /**
   * 根据提交者ID查询愿望
   * @param submitterId 提交者ID
   * @returns Promise<Wish[]> 愿望列表
   */
  static async findBySubmitter(submitterId: string): Promise<Wish[]> {
    const sql = `
      SELECT id, title, description, job, submitter, submitter_id, status, likes, created_at, updated_at
      FROM wishes
      WHERE submitter_id = ?
      ORDER BY created_at DESC
    `
    const wishes = await query<Wish[]>(sql, [submitterId])

    return wishes
  }

  /**
   * 根据状态查询愿望
   * @param status 愿望状态
   * @returns Promise<Wish[]> 愿望列表
   */
  static async findByStatus(status: WishStatus): Promise<Wish[]> {
    const sql = `
      SELECT id, title, description, job, submitter, submitter_id, status, likes, created_at, updated_at
      FROM wishes
      WHERE status = ?
      ORDER BY created_at DESC
    `
    const wishes = await query<Wish[]>(sql, [status])

    return wishes
  }

  /**
   * 搜索愿望（根据标题和描述）
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<WishQueryResult> 愿望列表和分页信息
   */
  static async search(
    keyword: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<WishQueryResult> {
    return this.findAll({
      search: keyword,
      page,
      pageSize,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    })
  }

  /**
   * 增加愿望点赞数（手动更新，触发器会自动维护，但提供此方法以备不时之需）
   * @param id 愿望ID
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async incrementLikes(id: string): Promise<Wish> {
    const sql = 'UPDATE wishes SET likes = likes + 1 WHERE id = ?'
    await query(sql, [id])

    const updatedWish = await this.findById(id)
    if (!updatedWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    return updatedWish
  }

  /**
   * 减少愿望点赞数（手动更新，触发器会自动维护，但提供此方法以备不时之需）
   * @param id 愿望ID
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async decrementLikes(id: string): Promise<Wish> {
    const sql = 'UPDATE wishes SET likes = GREATEST(likes - 1, 0) WHERE id = ?'
    await query(sql, [id])

    const updatedWish = await this.findById(id)
    if (!updatedWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    return updatedWish
  }

  /**
   * 生成UUID（简化版本，实际生产环境应使用uuid库）
   * @returns string UUID字符串
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

export default WishModel
