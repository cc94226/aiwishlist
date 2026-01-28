import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserModel, UserWithoutPassword, CreateUserData, UpdateUserData } from '../models/User'
import { AppError } from '../middleware/errorHandler'

/**
 * 登录请求数据接口
 */
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 登录响应数据接口
 */
export interface LoginResponse {
  success: boolean
  token?: string // 未来将实现JWT token
  user?: UserWithoutPassword
  message?: string
}

/**
 * 注册请求数据接口
 */
export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword?: string
  job?: string | null
}

/**
 * 注册响应数据接口
 */
export interface RegisterResponse {
  success: boolean
  user?: UserWithoutPassword
  message?: string
  errors?: string[]
}

/**
 * 更新用户信息请求数据接口
 */
export interface UpdateUserRequest {
  name?: string
  email?: string
  job?: string | null
  password?: string
  oldPassword?: string
}

/**
 * 更新用户信息响应数据接口
 */
export interface UpdateUserResponse {
  success: boolean
  user?: UserWithoutPassword
  message?: string
}

/**
 * 修改密码请求数据接口
 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

/**
 * 修改密码响应数据接口
 */
export interface ChangePasswordResponse {
  success: boolean
  message?: string
}

/**
 * 认证服务类
 * 提供用户注册、登录、信息管理等业务逻辑
 */
export class AuthService {
  /**
   * 密码加密的盐值轮数（用于bcrypt）
   */
  private static readonly SALT_ROUNDS = 10

  /**
   * 用户登录
   * @param loginData 登录请求数据
   * @returns Promise<LoginResponse> 登录响应
   */
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData

    // 验证输入
    if (!email || !password) {
      throw new AppError('邮箱和密码不能为空', 400, 'INVALID_INPUT')
    }

    // 查找用户（包含密码）
    const user = await UserModel.findByEmail(email)
    if (!user) {
      throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password!)
    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401, 'INVALID_CREDENTIALS')
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    // 生成JWT token
    const token = this.generateToken(userWithoutPassword)

    return {
      success: true,
      token,
      user: userWithoutPassword,
      message: '登录成功'
    }
  }

  /**
   * 用户注册
   * @param registerData 注册请求数据
   * @returns Promise<RegisterResponse> 注册响应
   */
  static async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    const { name, email, password, confirmPassword, job } = registerData

    // 验证输入
    const errors: string[] = []

    if (!name || name.trim().length === 0) {
      errors.push('姓名不能为空')
    }

    if (!email || email.trim().length === 0) {
      errors.push('邮箱不能为空')
    } else if (!this.isValidEmail(email)) {
      errors.push('邮箱格式不正确')
    }

    if (!password || password.length < 6) {
      errors.push('密码长度至少为6位')
    }

    if (confirmPassword && password !== confirmPassword) {
      errors.push('两次输入的密码不一致')
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: '注册失败',
        errors
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await UserModel.findByEmailWithoutPassword(email)
    if (existingUser) {
      return {
        success: false,
        message: '该邮箱已被注册',
        errors: ['邮箱已存在']
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS)

    // 创建用户
    const createUserData: CreateUserData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'user',
      job: (job as any) || null // 类型转换：前端传来的job可能是字符串
    }

    try {
      const user = await UserModel.create(createUserData)

      return {
        success: true,
        user,
        message: '注册成功'
      }
    } catch (error) {
      if (error instanceof AppError && error.code === 'EMAIL_EXISTS') {
        return {
          success: false,
          message: '该邮箱已被注册',
          errors: ['邮箱已存在']
        }
      }
      throw error
    }
  }

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param updateData 更新数据
   * @returns Promise<UpdateUserResponse> 更新响应
   */
  static async updateUser(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    // 验证用户是否存在
    const existingUser = await UserModel.findById(userId)
    if (!existingUser) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    const updateUserData: UpdateUserData = {}

    // 更新姓名
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new AppError('姓名不能为空', 400, 'INVALID_INPUT')
      }
      updateUserData.name = updateData.name.trim()
    }

    // 更新邮箱
    if (updateData.email !== undefined) {
      if (!updateData.email || updateData.email.trim().length === 0) {
        throw new AppError('邮箱不能为空', 400, 'INVALID_INPUT')
      }
      if (!this.isValidEmail(updateData.email)) {
        throw new AppError('邮箱格式不正确', 400, 'INVALID_INPUT')
      }
      updateUserData.email = updateData.email.trim().toLowerCase()
    }

    // 更新岗位
    if (updateData.job !== undefined) {
      updateUserData.job = (updateData.job as any) || null // 类型转换：前端传来的job可能是字符串
    }

    // 更新密码（如果提供）
    if (updateData.password) {
      if (!updateData.oldPassword) {
        throw new AppError('修改密码需要提供旧密码', 400, 'INVALID_INPUT')
      }

      // 验证旧密码
      const user = await UserModel.findByEmail(existingUser.email)
      if (!user || !user.password) {
        throw new AppError('用户数据异常', 500, 'INTERNAL_ERROR')
      }

      const isOldPasswordValid = await bcrypt.compare(
        updateData.oldPassword,
        user.password
      )
      if (!isOldPasswordValid) {
        throw new AppError('旧密码错误', 401, 'INVALID_CREDENTIALS')
      }

      // 验证新密码长度
      if (updateData.password.length < 6) {
        throw new AppError('密码长度至少为6位', 400, 'INVALID_INPUT')
      }

      // 加密新密码
      updateUserData.password = await bcrypt.hash(
        updateData.password,
        this.SALT_ROUNDS
      )
    }

    try {
      const updatedUser = await UserModel.update(userId, updateUserData)

      return {
        success: true,
        user: updatedUser,
        message: '更新成功'
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('更新用户信息失败', 500, 'UPDATE_FAILED')
    }
  }

  /**
   * 修改密码
   * @param userId 用户ID
   * @param changePasswordData 修改密码数据
   * @returns Promise<ChangePasswordResponse> 修改密码响应
   */
  static async changePassword(
    userId: string,
    changePasswordData: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    const { oldPassword, newPassword } = changePasswordData

    // 验证输入
    if (!oldPassword || !newPassword) {
      throw new AppError('旧密码和新密码不能为空', 400, 'INVALID_INPUT')
    }

    if (newPassword.length < 6) {
      throw new AppError('新密码长度至少为6位', 400, 'INVALID_INPUT')
    }

    // 获取用户信息（包含密码）
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }

    const userWithPassword = await UserModel.findByEmail(user.email)
    if (!userWithPassword || !userWithPassword.password) {
      throw new AppError('用户数据异常', 500, 'INTERNAL_ERROR')
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      userWithPassword.password
    )
    if (!isOldPasswordValid) {
      throw new AppError('旧密码错误', 401, 'INVALID_CREDENTIALS')
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS)

    // 更新密码
    await UserModel.update(userId, { password: hashedPassword })

    return {
      success: true,
      message: '密码修改成功'
    }
  }

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns Promise<UserWithoutPassword> 用户信息
   */
  static async getUserInfo(userId: string): Promise<UserWithoutPassword> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
    }
    return user
  }

  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns boolean 是否为有效邮箱
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 生成JWT token
   * @param user 用户信息
   * @returns string JWT token
   */
  private static generateToken(user: UserWithoutPassword): string {
    const secret = process.env.JWT_SECRET || 'default-secret-key-change-in-production'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      job: user.job
    }

    return jwt.sign(payload, secret, { expiresIn })
  }

  /**
   * 验证JWT token
   * @param token JWT token字符串
   * @returns 解码后的用户信息
   */
  static verifyToken(token: string): {
    id: string
    email: string
    role: 'admin' | 'user'
    name?: string
    job?: string | null
  } {
    const secret = process.env.JWT_SECRET || 'default-secret-key-change-in-production'

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string
        email: string
        role: 'admin' | 'user'
        name?: string
        job?: string | null
      }
      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token已过期', 401, 'TOKEN_EXPIRED')
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的Token', 401, 'TOKEN_INVALID')
      }
      throw new AppError('Token验证失败', 401, 'TOKEN_VERIFY_FAILED')
    }
  }
}

export default AuthService
