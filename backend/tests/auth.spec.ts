/**
 * 认证接口测试用例
 * 测试用户注册和登录功能
 * 
 * 注意：这些测试需要MySQL数据库连接
 * 请确保：
 * 1. MySQL服务正在运行
 * 2. 已创建测试数据库（默认：aiwishlist_test）
 * 3. 已运行数据库迁移脚本（database/migrations/001_create_tables.sql）
 * 4. 配置了正确的数据库连接信息（通过环境变量或.env文件）
 */

import request from 'supertest'
import app from '../src/index'
import { query, closePool, testConnection } from '../src/config/database'
import { AuthService } from '../src/services/AuthService'

describe('认证接口测试', () => {
  // 检查数据库连接
  let dbConnected = false

  beforeAll(async () => {
    // 测试数据库连接
    dbConnected = await testConnection()
    if (!dbConnected) {
      console.warn(
        '⚠️  数据库连接失败，部分测试将被跳过。请确保MySQL服务正在运行并配置了正确的连接信息。'
      )
    }
  })

  // 测试用户数据
  const testUser = {
    name: '测试用户',
    email: 'test@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '开发' as const
  }

  const testUser2 = {
    name: '测试用户2',
    email: 'test2@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '设计' as const
  }

  // 在每个测试前清理测试用户数据
  beforeEach(async () => {
    if (!dbConnected) return

    try {
      await query('DELETE FROM users WHERE email IN (?, ?)', [
        testUser.email,
        testUser2.email
      ])
    } catch (error) {
      // 忽略错误（表可能不存在）
      console.warn('清理测试数据时出错:', error)
    }
  })

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await closePool()
  })

  describe('POST /api/auth/register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('注册成功')
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase())
      expect(response.body.data.user.name).toBe(testUser.name)
      expect(response.body.data.user.password).toBeUndefined() // 密码不应该返回
    })

    it('应该拒绝注册已存在的邮箱', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      // 先注册一个用户
      await request(app).post('/api/auth/register').send(testUser)

      // 尝试用相同邮箱注册
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('邮箱')
    })

    it('应该拒绝空姓名注册', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          name: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors.length).toBeGreaterThan(0)
    })

    it('应该拒绝无效邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors.some((e: string) => e.includes('邮箱'))).toBe(
        true
      )
    })

    it('应该拒绝密码长度不足', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: '12345' // 少于6位
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(
        response.body.errors.some((e: string) => e.includes('密码'))
      ).toBe(true)
    })

    it('应该拒绝密码不一致', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          confirmPassword: 'different-password'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
      expect(
        response.body.errors.some((e: string) => e.includes('密码'))
      ).toBe(true)
    })

    it('应该拒绝无效请求数据格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('invalid-json')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })
  })

  describe('POST /api/auth/login - 用户登录', () => {
    beforeEach(async () => {
      if (!dbConnected) return
      // 注册一个测试用户用于登录测试
      await AuthService.register(testUser)
    })

    it('应该成功登录', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('登录成功')
      expect(response.body.data).toBeDefined()
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase())
      expect(response.body.data.user.password).toBeUndefined() // 密码不应该返回
    })

    it('应该拒绝错误的邮箱', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('邮箱或密码错误')
    })

    it('应该拒绝错误的密码', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong-password'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('邮箱或密码错误')
    })

    it('应该拒绝空邮箱或密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: testUser.password
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝无效请求数据格式', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid-json')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })

    it('登录后返回的token应该可以验证', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      const token = response.body.data.token
      expect(token).toBeDefined()

      // 验证token
      const decoded = AuthService.verifyToken(token)
      expect(decoded.email).toBe(testUser.email.toLowerCase())
      expect(decoded.id).toBeDefined()
    })
  })

  describe('GET /api/auth/me - 获取当前用户信息', () => {
    let authToken: string
    let userId: string

    beforeEach(async () => {
      // 注册并登录用户
      const registerResult = await AuthService.register(testUser)
      userId = registerResult.user!.id

      const loginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      })
      authToken = loginResult.token!
    })

    it('应该成功获取已登录用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.id).toBe(userId)
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase())
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('应该拒绝无效的token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('PUT /api/auth/profile - 更新用户信息', () => {
    let authToken: string

    beforeEach(async () => {
      // 注册并登录用户
      await AuthService.register(testUser)
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      })
      authToken = loginResult.token!
    })

    it('应该成功更新用户姓名', async () => {
      const newName = '新姓名'
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: newName
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('更新成功')
      expect(response.body.data.user.name).toBe(newName)
    })

    it('应该成功更新用户岗位', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          job: '设计'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.job).toBe('设计')
    })

    it('应该拒绝空姓名', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝无效邮箱格式', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          name: '新姓名'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('PUT /api/auth/password - 修改密码', () => {
    let authToken: string

    beforeEach(async () => {
      // 注册并登录用户
      await AuthService.register(testUser)
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      })
      authToken = loginResult.token!
    })

    it('应该成功修改密码', async () => {
      const newPassword = 'newpassword123'
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('密码修改成功')

      // 验证新密码可以登录
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: newPassword
      })
      expect(loginResult.success).toBe(true)
    })

    it('应该拒绝错误的旧密码', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'wrong-password',
          newPassword: 'newpassword123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('旧密码')
    })

    it('应该拒绝密码长度不足', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: '12345' // 少于6位
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝空密码', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: '',
          newPassword: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          oldPassword: testUser.password,
          newPassword: 'newpassword123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })
})
