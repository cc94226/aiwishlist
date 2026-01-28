import { query } from '../config/database'
import { AppError } from '../middleware/errorHandler'

/**
 * 用户角色枚举
 */
export type UserRole = 'admin' | 'user'

/**
 * 岗位类型枚举
 */
export type JobType =
  | '开发'
  | '设计'
  | '产品'
  | '运营'
  | '行政'
  | '测试'
  | '人事'
  | '财务'

/**
 * 用户数据模型接口
 */
export interface User {
  id: string
  name: string
  email: string
  password?: string // 密码字段，查询时通常不返回
  role: UserRole
  job?: JobType | null
  created_at: Date | string
  updated_at: Date | string
}

/**
 * 创建用户数据模型接口（不包含id和时间戳）
 */
export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: UserRole
  job?: JobType | null
}

/**
 * 更新用户数据模型接口（所有字段可选）
 */
export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  job?: JobType | null
}

/**
 * 用户查询结果（不包含密码）
 */
export interface UserWithoutPassword extends Omit<User, 'password'> {}

/**
 * 用户模型类
 * 提供用户相关的数据库操作方法
 */
export class UserModel {
  /**
   * 根据ID查询用户
   * @param id 用户ID
   * @returns Promise<User | null> 用户信息（不包含密码）
   */
  static async findById(id: string): Promise<UserWithoutPassword | null> {
    const sql = 'SELECT id, name, email, role, job, created_at, updated_at FROM users WHERE id = ?'
    const results = await query<User[]>(sql, [id])

    if (results.length === 0) {
      return null
    }

    return this.mapToUserWithoutPassword(results[0])
  }

  /**
   * 根据邮箱查询用户（包含密码，用于登录验证）
   * @param email 用户邮箱
   * @returns Promise<User | null> 用户信息（包含密码）
   */
  static async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?'
    const results = await query<User[]>(sql, [email])

    if (results.length === 0) {
      return null
    }

    return results[0]
  }

  /**
   * 根据邮箱查询用户（不包含密码）
   * @param email 用户邮箱
   * @returns Promise<UserWithoutPassword | null> 用户信息（不包含密码）
   */
  static async findByEmailWithoutPassword(
    email: string
  ): Promise<UserWithoutPassword | null> {
    const sql =
      'SELECT id, name, email, role, job, created_at, updated_at FROM users WHERE email = ?'
    const results = await query<User[]>(sql, [email])

    if (results.length === 0) {
      return null
    }

    return this.mapToUserWithoutPassword(results[0])
  }

  /**
   * 创建新用户
   * @param userData 用户数据
   * @returns Promise<UserWithoutPassword> 创建的用户信息（不包含密码）
   */
  static async create(userData: CreateUserData): Promise<UserWithoutPassword> {
    // 检查邮箱是否已存在
    const existingUser = await this.findByEmail(userData.email)
    if (existingUser) {
      throw new AppError('邮箱已被注册', 400, 'EMAIL_EXISTS')
    }

    // 生成UUID
    const id = this.generateUUID()
    const role = userData.role || 'user'

    const sql = `
      INSERT INTO users (id, name, email, password, role, job)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    await query(sql, [
      id,
      userData.name,
      userData.email,
      userData.password,
      role,
      userData.job || null
    ])

    // 返回创建的用户（不包含密码）
    const createdUser = await this.findById(id)
    if (!createdUser) {
      throw new AppError('创建用户失败', 500, 'CREATE_USER_FAILED')
    }

    return createdUser
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param userData 要更新的用户数据
   * @returns Promise<UserWithoutPassword> 更新后的用户信息（不包含密码）
   */
  static async update(
    id: string,
    userData: UpdateUserData
  ): Promise<UserWithoutPassword> {
    // 检查用户是否存在
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    // 如果更新邮箱，检查新邮箱是否已被其他用户使用
    if (userData.email && userData.email !== existingUser.email) {
      const emailUser = await this.findByEmail(userData.email)
      if (emailUser && emailUser.id !== id) {
        throw new AppError('邮箱已被其他用户使用', 400, 'EMAIL_EXISTS')
      }
    }

    // 构建更新SQL
    const updates: string[] = []
    const values: any[] = []

    if (userData.name !== undefined) {
      updates.push('name = ?')
      values.push(userData.name)
    }
    if (userData.email !== undefined) {
      updates.push('email = ?')
      values.push(userData.email)
    }
    if (userData.password !== undefined) {
      updates.push('password = ?')
      values.push(userData.password)
    }
    if (userData.role !== undefined) {
      updates.push('role = ?')
      values.push(userData.role)
    }
    if (userData.job !== undefined) {
      updates.push('job = ?')
      values.push(userData.job)
    }

    if (updates.length === 0) {
      // 没有要更新的字段，直接返回原用户信息
      return existingUser
    }

    // 添加更新时间（MySQL会自动更新，但为了明确性，我们也可以手动设置）
    updates.push('updated_at = NOW()')
    values.push(id)

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    await query(sql, values)

    // 返回更新后的用户信息
    const updatedUser = await this.findById(id)
    if (!updatedUser) {
      throw new AppError('更新用户失败', 500, 'UPDATE_USER_FAILED')
    }

    return updatedUser
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns Promise<boolean> 是否删除成功
   */
  static async delete(id: string): Promise<boolean> {
    // 检查用户是否存在
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    const sql = 'DELETE FROM users WHERE id = ?'
    const result = await query<{ affectedRows: number }>(sql, [id])

    return result.affectedRows > 0
  }

  /**
   * 查询所有用户（分页）
   * @param page 页码（从1开始）
   * @param pageSize 每页数量
   * @returns Promise<{ users: UserWithoutPassword[]; total: number }> 用户列表和总数
   */
  static async findAll(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ users: UserWithoutPassword[]; total: number }> {
    const offset = (page - 1) * pageSize

    // 查询总数
    const countSql = 'SELECT COUNT(*) as total FROM users'
    const countResult = await query<{ total: number }[]>(countSql)
    const total = countResult[0]?.total || 0

    // 查询用户列表
    const sql = `
      SELECT id, name, email, role, job, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const users = await query<User[]>(sql, [pageSize, offset])

    return {
      users: users.map(user => this.mapToUserWithoutPassword(user)),
      total
    }
  }

  /**
   * 根据角色查询用户
   * @param role 用户角色
   * @returns Promise<UserWithoutPassword[]> 用户列表
   */
  static async findByRole(role: UserRole): Promise<UserWithoutPassword[]> {
    const sql = `
      SELECT id, name, email, role, job, created_at, updated_at
      FROM users
      WHERE role = ?
      ORDER BY created_at DESC
    `
    const users = await query<User[]>(sql, [role])

    return users.map(user => this.mapToUserWithoutPassword(user))
  }

  /**
   * 根据岗位查询用户
   * @param job 用户岗位
   * @returns Promise<UserWithoutPassword[]> 用户列表
   */
  static async findByJob(job: JobType): Promise<UserWithoutPassword[]> {
    const sql = `
      SELECT id, name, email, role, job, created_at, updated_at
      FROM users
      WHERE job = ?
      ORDER BY created_at DESC
    `
    const users = await query<User[]>(sql, [job])

    return users.map(user => this.mapToUserWithoutPassword(user))
  }

  /**
   * 将User对象转换为不包含密码的User对象
   * @param user 用户对象
   * @returns UserWithoutPassword 不包含密码的用户对象
   */
  private static mapToUserWithoutPassword(
    user: User
  ): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as UserWithoutPassword
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

export default UserModel
