import { WishModel, Wish, CreateWishData, WishStatus } from '../models/Wish'
import { JobType } from '../models/User'
import { AppError } from '../middleware/errorHandler'

/**
 * 创建愿望请求参数
 */
export interface CreateWishRequest {
  title: string
  description: string
  job: JobType
  submitter?: string
  submitterId?: string
  status?: WishStatus
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 更新愿望请求参数
 */
export interface UpdateWishRequest {
  id: string
  title?: string
  description?: string
  job?: JobType
  submitter?: string
  status?: WishStatus
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 删除愿望请求参数
 */
export interface DeleteWishRequest {
  id: string
  userId?: string // 当前用户ID（用于权限控制）
  isAdmin?: boolean // 是否为管理员（用于权限控制）
}

/**
 * 愿望创建服务类
 * 提供愿望创建、更新、删除相关的业务逻辑
 */
export class WishCreateService {
  /**
   * 创建新愿望
   * @param request 创建请求参数
   * @returns Promise<Wish> 创建的愿望信息
   */
  static async createWish(request: CreateWishRequest): Promise<Wish> {
    const {
      title,
      description,
      job,
      submitter,
      submitterId,
      status,
      userId,
      isAdmin = false
    } = request

    // 验证必填字段
    if (!title || title.trim().length === 0) {
      throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
    }
    if (title.trim().length < 2) {
      throw new AppError('愿望名称至少需要2个字符', 400, 'INVALID_INPUT')
    }
    if (title.trim().length > 100) {
      throw new AppError('愿望名称不能超过100个字符', 400, 'INVALID_INPUT')
    }

    if (!description || description.trim().length === 0) {
      throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
    }
    if (description.trim().length < 10) {
      throw new AppError('需求描述至少需要10个字符', 400, 'INVALID_INPUT')
    }
    if (description.trim().length > 1000) {
      throw new AppError('需求描述不能超过1000个字符', 400, 'INVALID_INPUT')
    }

    if (!job) {
      throw new AppError('提交者岗位不能为空', 400, 'INVALID_INPUT')
    }

    // 验证岗位类型是否有效
    const validJobs: JobType[] = ['开发', '设计', '产品', '运营', '行政', '测试', '人事', '财务']
    if (!validJobs.includes(job)) {
      throw new AppError('无效的岗位类型', 400, 'INVALID_INPUT')
    }

    // 验证提交者姓名（如果提供）
    if (submitter !== undefined && submitter !== null) {
      if (submitter.trim().length === 0) {
        throw new AppError('提交者姓名不能为空', 400, 'INVALID_INPUT')
      }
      if (submitter.trim().length > 50) {
        throw new AppError('提交者姓名不能超过50个字符', 400, 'INVALID_INPUT')
      }
    }

    // 权限控制：只有管理员可以创建已发布的愿望，普通用户只能创建草稿
    let wishStatus: WishStatus = status || 'draft'
    if (wishStatus === 'published' && !isAdmin) {
      // 普通用户尝试创建已发布的愿望，自动改为草稿
      wishStatus = 'draft'
    }

    // 如果用户已登录，使用用户ID作为submitter_id
    const finalSubmitterId = submitterId || userId || null

    // 如果用户已登录但没有提供submitter，尝试从用户信息获取
    let finalSubmitter = submitter
    if (!finalSubmitter && userId) {
      // 这里可以查询用户信息获取姓名，但为了简化，暂时使用空字符串
      // 实际项目中应该查询UserModel获取用户姓名
      finalSubmitter = ''
    }

    // 如果submitter为空，使用默认值
    if (!finalSubmitter || finalSubmitter.trim().length === 0) {
      finalSubmitter = '匿名用户'
    }

    try {
      const wishData: CreateWishData = {
        title: title.trim(),
        description: description.trim(),
        job,
        submitter: finalSubmitter.trim(),
        submitter_id: finalSubmitterId,
        status: wishStatus
      }

      const wish = await WishModel.create(wishData)
      return wish
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('创建愿望失败', 500, 'CREATE_WISH_FAILED')
    }
  }

  /**
   * 更新愿望信息
   * @param request 更新请求参数
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async updateWish(request: UpdateWishRequest): Promise<Wish> {
    const { id, title, description, job, submitter, status, userId, isAdmin = false } = request

    // 验证ID
    if (!id || id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能编辑自己的草稿，管理员可以编辑所有愿望
    if (!isAdmin) {
      // 普通用户只能编辑自己的愿望
      if (existingWish.submitter_id !== userId) {
        throw new AppError('无权编辑此愿望', 403, 'FORBIDDEN')
      }
      // 普通用户只能编辑草稿状态的愿望
      if (existingWish.status !== 'draft') {
        throw new AppError('只能编辑草稿状态的愿望', 403, 'FORBIDDEN')
      }
    }

    // 验证更新字段
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
      }
      if (title.trim().length < 2) {
        throw new AppError('愿望名称至少需要2个字符', 400, 'INVALID_INPUT')
      }
      if (title.trim().length > 100) {
        throw new AppError('愿望名称不能超过100个字符', 400, 'INVALID_INPUT')
      }
    }

    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
      }
      if (description.trim().length < 10) {
        throw new AppError('需求描述至少需要10个字符', 400, 'INVALID_INPUT')
      }
      if (description.trim().length > 1000) {
        throw new AppError('需求描述不能超过1000个字符', 400, 'INVALID_INPUT')
      }
    }

    if (job !== undefined) {
      // 验证岗位类型是否有效
      const validJobs: JobType[] = ['开发', '设计', '产品', '运营', '行政', '测试', '人事', '财务']
      if (!validJobs.includes(job)) {
        throw new AppError('无效的岗位类型', 400, 'INVALID_INPUT')
      }
    }

    if (submitter !== undefined && submitter !== null) {
      if (submitter.trim().length === 0) {
        throw new AppError('提交者姓名不能为空', 400, 'INVALID_INPUT')
      }
      if (submitter.trim().length > 50) {
        throw new AppError('提交者姓名不能超过50个字符', 400, 'INVALID_INPUT')
      }
    }

    // 权限控制：只有管理员可以修改愿望状态
    let finalStatus = status
    if (status !== undefined && status !== existingWish.status && !isAdmin) {
      throw new AppError('无权修改愿望状态', 403, 'FORBIDDEN')
    }

    try {
      const updateData: any = {}
      if (title !== undefined) {
        updateData.title = title.trim()
      }
      if (description !== undefined) {
        updateData.description = description.trim()
      }
      if (job !== undefined) {
        updateData.job = job
      }
      if (submitter !== undefined) {
        updateData.submitter = submitter.trim()
      }
      if (finalStatus !== undefined) {
        updateData.status = finalStatus
      }

      const wish = await WishModel.update(id, updateData)
      return wish
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('更新愿望失败', 500, 'UPDATE_WISH_FAILED')
    }
  }

  /**
   * 删除愿望
   * @param request 删除请求参数
   * @returns Promise<void>
   */
  static async deleteWish(request: DeleteWishRequest): Promise<void> {
    const { id, userId, isAdmin = false } = request

    // 验证ID
    if (!id || id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能删除自己的草稿，管理员可以删除所有愿望
    if (!isAdmin) {
      // 普通用户只能删除自己的愿望
      if (existingWish.submitter_id !== userId) {
        throw new AppError('无权删除此愿望', 403, 'FORBIDDEN')
      }
      // 普通用户只能删除草稿状态的愿望
      if (existingWish.status !== 'draft') {
        throw new AppError('只能删除草稿状态的愿望', 403, 'FORBIDDEN')
      }
    }

    try {
      await WishModel.delete(id)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('删除愿望失败', 500, 'DELETE_WISH_FAILED')
    }
  }

  /**
   * 发布愿望（将草稿状态改为已发布）
   * @param id 愿望ID
   * @param userId 当前用户ID（用于权限控制）
   * @param isAdmin 是否为管理员（用于权限控制）
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async publishWish(id: string, userId?: string, isAdmin: boolean = false): Promise<Wish> {
    // 验证ID
    if (!id || id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能发布自己的草稿，管理员可以发布任何愿望
    if (!isAdmin) {
      // 普通用户只能发布自己的愿望
      if (existingWish.submitter_id !== userId) {
        throw new AppError('无权发布此愿望', 403, 'FORBIDDEN')
      }
      // 普通用户只能发布草稿状态的愿望
      if (existingWish.status !== 'draft') {
        throw new AppError('只能发布草稿状态的愿望', 403, 'FORBIDDEN')
      }
    }

    // 检查愿望是否已经是已发布状态
    if (existingWish.status === 'published') {
      throw new AppError('愿望已经是已发布状态', 400, 'INVALID_STATUS')
    }

    try {
      const wish = await WishModel.update(id, { status: 'published' })
      return wish
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('发布愿望失败', 500, 'PUBLISH_WISH_FAILED')
    }
  }

  /**
   * 下架愿望（将已发布状态改为已归档）
   * @param id 愿望ID
   * @param isAdmin 是否为管理员（用于权限控制）
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async archiveWish(id: string, isAdmin: boolean = false): Promise<Wish> {
    // 验证ID
    if (!id || id.trim().length === 0) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：只有管理员可以下架愿望
    if (!isAdmin) {
      throw new AppError('无权下架愿望，只有管理员可以下架', 403, 'FORBIDDEN')
    }

    // 检查愿望是否已经是已归档状态
    if (existingWish.status === 'archived') {
      throw new AppError('愿望已经是已归档状态', 400, 'INVALID_STATUS')
    }

    try {
      const wish = await WishModel.update(id, { status: 'archived' })
      return wish
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('下架愿望失败', 500, 'ARCHIVE_WISH_FAILED')
    }
  }
}

export default WishCreateService
