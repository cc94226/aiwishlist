/**
 * 愿望提交接口测试用例
 * 测试愿望创建、更新、删除、发布、下架相关的所有API端点
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
import { UserModel } from '../src/models/User'
import { WishModel } from '../src/models/Wish'
import { JobType } from '../src/models/User'

describe('愿望提交接口测试', () => {
  // 检查数据库连接
  let dbConnected = false

  // 测试用户数据
  const testUser = {
    name: '测试用户',
    email: 'test@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '开发' as JobType
  }

  const testAdmin = {
    name: '测试管理员',
    email: 'admin@example.com',
    password: 'admin123456',
    confirmPassword: 'admin123456',
    job: '开发' as JobType
  }

  // 测试愿望数据
  let testUserId: string
  let testAdminId: string
  let testUserToken: string
  let testAdminToken: string
  let createdWishId: string

  beforeAll(async () => {
    // 测试数据库连接
    dbConnected = await testConnection()
    if (!dbConnected) {
      console.warn(
        '⚠️  数据库连接失败，部分测试将被跳过。请确保MySQL服务正在运行并配置了正确的连接信息。'
      )
    }
  })

  // 在每个测试前设置测试数据
  beforeEach(async () => {
    if (!dbConnected) return

    try {
      // 清理测试数据
      await query('DELETE FROM wishes WHERE submitter IN (?, ?)', [testUser.name, testAdmin.name])
      await query('DELETE FROM users WHERE email IN (?, ?)', [testUser.email, testAdmin.email])

      // 创建测试用户（普通用户）
      const userResult = await AuthService.register(testUser)
      testUserId = userResult.user!.id

      // 创建测试管理员
      const adminResult = await AuthService.register(testAdmin)
      testAdminId = adminResult.user!.id
      // 将管理员设置为admin角色
      await UserModel.update(testAdminId, { role: 'admin' })

      // 登录获取token
      const userLoginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      })
      testUserToken = userLoginResult.token!

      const adminLoginResult = await AuthService.login({
        email: testAdmin.email,
        password: testAdmin.password
      })
      testAdminToken = adminLoginResult.token!
    } catch (error) {
      console.error('设置测试数据时出错:', error)
    }
  })

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await closePool()
  })

  describe('POST /api/wishes - 创建新愿望', () => {
    it('应该成功创建草稿状态的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题',
        description: '测试愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish).toBeDefined()
      expect(response.body.data.wish.title).toBe(wishData.title)
      expect(response.body.data.wish.description).toBe(wishData.description)
      expect(response.body.data.wish.job).toBe(wishData.job)
      expect(response.body.data.wish.status).toBe('draft') // 普通用户创建的愿望默认为草稿状态
      expect(response.body.data.wish.submitter_id).toBe(testUserId)

      createdWishId = response.body.data.wish.id
    })

    it('应该拒绝未登录用户创建愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题',
        description: '测试愿望描述',
        job: '开发' as JobType
      }

      await request(app).post('/api/wishes').send(wishData).expect(401)
    })

    it('应该拒绝创建缺少必填字段的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题'
        // 缺少 description 和 job
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('管理员应该能够创建已发布状态的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '管理员创建的愿望',
        description: '管理员创建的愿望描述',
        job: '设计' as JobType,
        status: 'published'
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(wishData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })

    it('普通用户尝试创建已发布状态的愿望应该被强制设置为草稿', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '普通用户尝试发布的愿望',
        description: '普通用户尝试发布的愿望描述',
        job: '产品' as JobType,
        status: 'published' // 普通用户尝试设置为已发布
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('draft') // 应该被强制设置为草稿
    })
  })

  describe('PUT /api/wishes/:id - 更新愿望信息', () => {
    let wishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个测试愿望
      const wish = await WishModel.create({
        title: '待更新的愿望',
        description: '待更新的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      wishId = wish.id
    })

    it('应该成功更新自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        title: '更新后的愿望标题',
        description: '更新后的愿望描述'
      }

      const response = await request(app)
        .put(`/api/wishes/${wishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.title).toBe(updateData.title)
      expect(response.body.data.wish.description).toBe(updateData.description)
    })

    it('应该拒绝更新非草稿状态的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先创建一个已发布的愿望
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '已发布的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      const updateData = {
        title: '尝试更新已发布的愿望'
      }

      const response = await request(app)
        .put(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PERMISSION_DENIED')
    })

    it('应该拒绝更新他人的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的愿望
      const otherUser = await AuthService.register({
        name: '其他用户',
        email: 'other@example.com',
        password: 'test123456',
        confirmPassword: 'test123456',
        job: '设计' as JobType
      })

      const otherUserWish = await WishModel.create({
        title: '其他用户的愿望',
        description: '其他用户的愿望描述',
        job: '设计' as JobType,
        submitter: '其他用户',
        submitter_id: otherUser.user!.id,
        status: 'draft'
      })

      const updateData = {
        title: '尝试更新他人的愿望'
      }

      const response = await request(app)
        .put(`/api/wishes/${otherUserWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PERMISSION_DENIED')
    })

    it('管理员应该能够更新任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        title: '管理员更新的愿望标题',
        status: 'published'
      }

      const response = await request(app)
        .put(`/api/wishes/${wishId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.title).toBe(updateData.title)
      expect(response.body.data.wish.status).toBe('published')
    })
  })

  describe('DELETE /api/wishes/:id - 删除愿望', () => {
    let wishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个测试愿望
      const wish = await WishModel.create({
        title: '待删除的愿望',
        description: '待删除的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      wishId = wish.id
    })

    it('应该成功删除自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete(`/api/wishes/${wishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // 验证愿望已被删除
      const deletedWish = await WishModel.findById(wishId)
      expect(deletedWish).toBeNull()
    })

    it('应该拒绝删除非草稿状态的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建一个已发布的愿望
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '已发布的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      const response = await request(app)
        .delete(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PERMISSION_DENIED')
    })

    it('管理员应该能够删除任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建一个已发布的愿望
      const publishedWish = await WishModel.create({
        title: '管理员要删除的愿望',
        description: '管理员要删除的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      const response = await request(app)
        .delete(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // 验证愿望已被删除
      const deletedWish = await WishModel.findById(publishedWish.id)
      expect(deletedWish).toBeNull()
    })
  })

  describe('POST /api/wishes/:id/publish - 发布愿望', () => {
    let draftWishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个草稿状态的愿望
      const wish = await WishModel.create({
        title: '待发布的愿望',
        description: '待发布的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      draftWishId = wish.id
    })

    it('应该成功发布自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${draftWishId}/publish`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })

    it('应该拒绝发布他人的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的愿望
      const otherUser = await AuthService.register({
        name: '其他用户',
        email: 'other@example.com',
        password: 'test123456',
        confirmPassword: 'test123456',
        job: '设计' as JobType
      })

      const otherUserWish = await WishModel.create({
        title: '其他用户的愿望',
        description: '其他用户的愿望描述',
        job: '设计' as JobType,
        submitter: '其他用户',
        submitter_id: otherUser.user!.id,
        status: 'draft'
      })

      const response = await request(app)
        .post(`/api/wishes/${otherUserWish.id}/publish`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PERMISSION_DENIED')
    })

    it('管理员应该能够发布任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${draftWishId}/publish`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })
  })

  describe('POST /api/wishes/:id/archive - 下架愿望', () => {
    let publishedWishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个已发布状态的愿望
      const wish = await WishModel.create({
        title: '待下架的愿望',
        description: '待下架的愿望描述',
        job: '开发' as JobType,
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
      publishedWishId = wish.id
    })

    it('应该拒绝普通用户下架愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${publishedWishId}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PERMISSION_DENIED')
    })

    it('管理员应该能够下架任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${publishedWishId}/archive`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('archived')
    })
  })
})
