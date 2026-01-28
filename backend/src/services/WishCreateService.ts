import { WishModel, Wish, CreateWishData, WishStatus } from '../models/Wish'
import { JobType } from '../models/User'
import { AppError } from '../middleware/errorHandler'

/**
 * 创建愿望请求参数
 */
export interface CreateWishRequest {
  /** 愿望名称 */
  title: string
  /** 需求描述 */
  description: string
  /** 提交者岗位 */
  job: JobType
  /** 提交者姓名 */
  submitter?: string
  /** 愿望状态（draft: 草稿, published: 已发布） */
  status?: WishStatus
  /** 当前用户ID（用于权限控制） */
  userId?: string
  /** 是否为管理员（用于权限控制） */
  isAdmin?: boolean
}

/**
 * 更新愿望请求参数
 */
export interface UpdateWishRequest {
  /** 愿望ID */
  id: string
  /** 愿望名称 */
  title?: string
  /** 需求描述 */
  description?: string
  /** 提交者岗位 */
  job?: JobType
  /** 提交者姓名 */
  submitter?: string
  /** 愿望状态 */
  status?: WishStatus
  /** 当前用户ID（用于权限控制） */
  userId?: string
  /** 是否为管理员（用于权限控制） */
  isAdmin?: boolean
}

/**
 * 删除愿望请求参数
 */
export interface DeleteWishRequest {
  /** 愿望ID */
  id: string
  /** 当前用户ID（用于权限控制） */
  userId?: string
  /** 是否为管理员（用于权限控制） */
  isAdmin?: boolean
}

/**
 * 愿望创建服务类
 * 提供愿望创建、更新、删除相关的业务逻辑
 */
export class WishCreateService {
  /**
   * 创建新愿望
   * @param request 创建愿望请求参数
   * @returns Promise<Wish> 创建的愿望信息
   */
  static async createWish(request: CreateWishRequest): Promise<Wish> {
    // 验证必填字段
    if (!request.title || request.title.trim().length === 0) {
      throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
    }
    if (request.title.trim().length > 200) {
      throw new AppError('愿望名称不能超过200个字符', 400, 'INVALID_INPUT')
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
    }
    if (request.description.trim().length > 5000) {
      throw new AppError('需求描述不能超过5000个字符', 400, 'INVALID_INPUT')
    }
    if (!request.job) {
      throw new AppError('提交者岗位不能为空', 400, 'INVALID_INPUT')
    }

    // 权限控制：普通用户只能创建草稿状态的愿望，管理员可以创建任何状态的愿望
    let status: WishStatus = request.status || 'draft'
    if (!request.isAdmin && status !== 'draft') {
      // 普通用户尝试创建非草稿状态的愿望，强制设置为草稿
      status = 'draft'
    }

    // 如果提供了用户ID，使用用户ID；否则使用提交者姓名
    const submitterId = request.userId || null
    const submitter = request.submitter || '匿名用户'

    // 构建创建愿望的数据
    const wishData: CreateWishData = {
      title: request.title.trim(),
      description: request.description.trim(),
      job: request.job,
      submitter: submitter.trim(),
      submitter_id: submitterId,
      status
    }

    try {
      // 调用模型层创建愿望
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
   * @param request 更新愿望请求参数
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async updateWish(request: UpdateWishRequest): Promise<Wish> {
    // 验证必填字段
    if (!request.id) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(request.id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能编辑自己的草稿状态愿望，管理员可以编辑所有愿望
    if (!request.isAdmin) {
      // 普通用户权限检查
      if (existingWish.status !== 'draft') {
        throw new AppError('只能编辑草稿状态的愿望', 403, 'PERMISSION_DENIED')
      }
      if (existingWish.submitter_id && existingWish.submitter_id !== request.userId) {
        throw new AppError('只能编辑自己创建的愿望', 403, 'PERMISSION_DENIED')
      }
    }

    // 验证更新字段
    if (request.title !== undefined) {
      if (!request.title || request.title.trim().length === 0) {
        throw new AppError('愿望名称不能为空', 400, 'INVALID_INPUT')
      }
      if (request.title.trim().length > 200) {
        throw new AppError('愿望名称不能超过200个字符', 400, 'INVALID_INPUT')
      }
    }
    if (request.description !== undefined) {
      if (!request.description || request.description.trim().length === 0) {
        throw new AppError('需求描述不能为空', 400, 'INVALID_INPUT')
      }
      if (request.description.trim().length > 5000) {
        throw new AppError('需求描述不能超过5000个字符', 400, 'INVALID_INPUT')
      }
    }

    // 权限控制：普通用户不能修改状态为已发布，管理员可以修改任何状态
    let status = request.status
    if (!request.isAdmin && status !== undefined && status !== 'draft') {
      // 普通用户尝试修改为非草稿状态，拒绝
      throw new AppError('普通用户只能保持愿望为草稿状态', 403, 'PERMISSION_DENIED')
    }

    // 构建更新数据
    const updateData: Partial<CreateWishData> = {}
    if (request.title !== undefined) {
      updateData.title = request.title.trim()
    }
    if (request.description !== undefined) {
      updateData.description = request.description.trim()
    }
    if (request.job !== undefined) {
      updateData.job = request.job
    }
    if (request.submitter !== undefined) {
      updateData.submitter = request.submitter.trim()
    }
    if (status !== undefined) {
      updateData.status = status
    }

    try {
      // 调用模型层更新愿望
      const wish = await WishModel.update(request.id, updateData)
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
   * @param request 删除愿望请求参数
   * @returns Promise<void>
   */
  static async deleteWish(request: DeleteWishRequest): Promise<void> {
    // 验证必填字段
    if (!request.id) {
      throw new AppError('愿望ID不能为空', 400, 'INVALID_INPUT')
    }

    // 检查愿望是否存在
    const existingWish = await WishModel.findById(request.id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能删除自己的草稿状态愿望，管理员可以删除所有愿望
    if (!request.isAdmin) {
      // 普通用户权限检查
      if (existingWish.status !== 'draft') {
        throw new AppError('只能删除草稿状态的愿望', 403, 'PERMISSION_DENIED')
      }
      if (existingWish.submitter_id && existingWish.submitter_id !== request.userId) {
        throw new AppError('只能删除自己创建的愿望', 403, 'PERMISSION_DENIED')
      }
    }

    try {
      // 调用模型层删除愿望
      await WishModel.delete(request.id)
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
   * @param userId 当前用户ID
   * @param isAdmin 是否为管理员
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async publishWish(id: string, userId?: string, isAdmin: boolean = false): Promise<Wish> {
    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：普通用户只能发布自己的草稿愿望，管理员可以发布任何愿望
    if (!isAdmin) {
      if (existingWish.status !== 'draft') {
        throw new AppError('只能发布草稿状态的愿望', 403, 'PERMISSION_DENIED')
      }
      if (existingWish.submitter_id && existingWish.submitter_id !== userId) {
        throw new AppError('只能发布自己创建的愿望', 403, 'PERMISSION_DENIED')
      }
    }

    try {
      // 更新愿望状态为已发布
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
   * @param userId 当前用户ID
   * @param isAdmin 是否为管理员
   * @returns Promise<Wish> 更新后的愿望信息
   */
  static async archiveWish(id: string, userId?: string, isAdmin: boolean = false): Promise<Wish> {
    // 检查愿望是否存在
    const existingWish = await WishModel.findById(id)
    if (!existingWish) {
      throw new AppError('愿望不存在', 404, 'WISH_NOT_FOUND')
    }

    // 权限控制：只有管理员可以下架愿望
    if (!isAdmin) {
      throw new AppError('只有管理员可以下架愿望', 403, 'PERMISSION_DENIED')
    }

    try {
      // 更新愿望状态为已归档
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
