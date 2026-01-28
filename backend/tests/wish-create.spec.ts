/**
 * 愿望创建接口测试用例
 * 测试愿望创建、更新、删除相关的所有API端点
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
import { WishModel } from '../src/models/Wish'
import { UserModel } from '../src/models/User'
import { JobType } from '../src/models/User'

describe('愿望创建接口测试', () => {
  // 检查数据库连接
  let dbConnected = false

  // 测试用户数据
  const testUser = {
    name: '测试用户',
    email: 'test_create@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '开发' as JobType
  }

  const testUser2 = {
    name: '测试用户2',
    email: 'test_create2@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '设计' as JobType
  }

  const testAdmin = {
    name: '测试管理员',
    email: 'admin_create@example.com',
    password: 'admin123456',
    confirmPassword: 'admin123456',
    job: '开发' as JobType
  }

  // 测试数据
  let testUserId: string
  let testUser2Id: string
  let testAdminId: string
  let testUserToken: string
  let testAdminToken: string
  let draftWishId: string

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
      await query('DELETE FROM wishes WHERE submitter IN (?, ?, ?)', [
        testUser.name,
        testUser2.name,
        testAdmin.name
      ])
      await query('DELETE FROM users WHERE email IN (?, ?, ?)', [
        testUser.email,
        testUser2.email,
        testAdmin.email
      ])

      // 创建测试用户（普通用户）
      const userResult = await AuthService.register(testUser)
      testUserId = userResult.user!.id

      // 创建测试用户2（普通用户）
      const user2Result = await AuthService.register(testUser2)
      testUser2Id = user2Result.user!.id

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

      // testUser2Token 用于测试，但当前测试用例中未使用
      // const user2LoginResult = await AuthService.login({
      //   email: testUser2.email,
      //   password: testUser2.password
      // })
      // testUser2Token = user2LoginResult.token!

      const adminLoginResult = await AuthService.login({
        email: testAdmin.email,
        password: testAdmin.password
      })
      testAdminToken = adminLoginResult.token!
    } catch (error) {
      console.error('设置测试数据失败:', error)
    }
  })

  // 在所有测试后清理资源
  afterAll(async () => {
    if (dbConnected) {
      await closePool()
    }
  })

  describe('POST /api/wishes - 创建愿望', () => {
    it('应该成功创建草稿状态的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题',
        description: '这是一个测试愿望的描述，至少需要10个字符',
        job: '开发',
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
      expect(response.body.data.wish.status).toBe('draft') // 普通用户创建的愿望默认为草稿
      expect(response.body.data.wish.submitter_id).toBe(testUserId)
    })

    it('应该成功创建已发布状态的愿望（管理员）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '管理员创建的已发布愿望',
        description: '这是一个管理员创建的已发布愿望的描述，至少需要10个字符',
        job: '设计',
        submitter: testAdmin.name,
        status: 'published'
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(wishData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish).toBeDefined()
      expect(response.body.data.wish.status).toBe('published')
    })

    it('应该拒绝未登录用户创建愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '未登录用户的愿望',
        description: '这是一个未登录用户尝试创建的愿望描述',
        job: '开发'
      }

      await request(app).post('/api/wishes').send(wishData).expect(401)
    })

    it('应该拒绝创建缺少必填字段的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        // 缺少title
        description: '这是一个缺少标题的愿望描述',
        job: '开发'
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('愿望名称不能为空')
    })

    it('应该拒绝创建标题过短的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '短', // 少于2个字符
        description: '这是一个标题过短的愿望描述，至少需要10个字符',
        job: '开发'
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('至少需要2个字符')
    })

    it('应该拒绝创建描述过短的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题',
        description: '短描述', // 少于10个字符
        job: '开发'
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('至少需要10个字符')
    })

    it('应该拒绝创建无效岗位类型的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '测试愿望标题',
        description: '这是一个测试愿望的描述，至少需要10个字符',
        job: '无效岗位' // 无效的岗位类型
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('无效的岗位类型')
    })

    it('普通用户尝试创建已发布愿望应该自动改为草稿', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const wishData = {
        title: '普通用户尝试发布的愿望',
        description: '这是一个普通用户尝试创建已发布状态的愿望描述',
        job: '开发',
        status: 'published' // 普通用户尝试发布
      }

      const response = await request(app)
        .post('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(wishData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('draft') // 自动改为草稿
    })
  })

  describe('PUT /api/wishes/:id - 更新愿望', () => {
    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个草稿愿望用于测试更新
      const draftWish = await WishModel.create({
        title: '待更新的草稿愿望',
        description: '这是一个待更新的草稿愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      draftWishId = draftWish.id
    })

    it('应该成功更新自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        title: '更新后的愿望标题',
        description: '这是更新后的愿望描述，至少需要10个字符'
      }

      const response = await request(app)
        .put(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.title).toBe(updateData.title)
      expect(response.body.data.wish.description).toBe(updateData.description)
    })

    it('应该拒绝更新他人的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的愿望
      const otherWish = await WishModel.create({
        title: '他人创建的愿望',
        description: '这是他人创建的愿望的描述，至少需要10个字符',
        job: '设计',
        submitter: testUser2.name,
        submitter_id: testUser2Id,
        status: 'draft'
      })

      const updateData = {
        title: '尝试更新的标题'
      }

      const response = await request(app)
        .put(`/api/wishes/${otherWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('无权编辑')
    })

    it('应该拒绝更新已发布的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建一个已发布的愿望
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '这是一个已发布的愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      const updateData = {
        title: '尝试更新的标题'
      }

      const response = await request(app)
        .put(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('只能编辑草稿状态的愿望')
    })

    it('管理员应该可以更新任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        title: '管理员更新的标题',
        description: '这是管理员更新的愿望描述，至少需要10个字符'
      }

      const response = await request(app)
        .put(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.title).toBe(updateData.title)
    })

    it('管理员应该可以修改愿望状态', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        status: 'published'
      }

      const response = await request(app)
        .put(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })

    it('普通用户应该不能修改愿望状态', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const updateData = {
        status: 'published'
      }

      const response = await request(app)
        .put(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('无权修改愿望状态')
    })
  })

  describe('DELETE /api/wishes/:id - 删除愿望', () => {
    let deleteWishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个草稿愿望用于测试删除
      const deleteWish = await WishModel.create({
        title: '待删除的草稿愿望',
        description: '这是一个待删除的草稿愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      deleteWishId = deleteWish.id
    })

    it('应该成功删除自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete(`/api/wishes/${deleteWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('删除成功')

      // 验证愿望已被删除
      const wish = await WishModel.findById(deleteWishId)
      expect(wish).toBeNull()
    })

    it('应该拒绝删除他人的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的愿望
      const otherWish = await WishModel.create({
        title: '他人创建的愿望',
        description: '这是他人创建的愿望的描述，至少需要10个字符',
        job: '设计',
        submitter: testUser2.name,
        submitter_id: testUser2Id,
        status: 'draft'
      })

      const response = await request(app)
        .delete(`/api/wishes/${otherWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('无权删除')
    })

    it('应该拒绝删除已发布的愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建一个已发布的愿望
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '这是一个已发布的愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      const response = await request(app)
        .delete(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('只能删除草稿状态的愿望')
    })

    it('管理员应该可以删除任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的已发布愿望
      const publishedWish = await WishModel.create({
        title: '管理员删除的愿望',
        description: '这是管理员删除的愿望的描述，至少需要10个字符',
        job: '设计',
        submitter: testUser2.name,
        submitter_id: testUser2Id,
        status: 'published'
      })

      const response = await request(app)
        .delete(`/api/wishes/${publishedWish.id}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // 验证愿望已被删除
      const wish = await WishModel.findById(publishedWish.id)
      expect(wish).toBeNull()
    })
  })

  describe('POST /api/wishes/:id/publish - 发布愿望', () => {
    let publishWishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个草稿愿望用于测试发布
      const publishWish = await WishModel.create({
        title: '待发布的草稿愿望',
        description: '这是一个待发布的草稿愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      publishWishId = publishWish.id
    })

    it('应该成功发布自己的草稿愿望（普通用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${publishWishId}/publish`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })

    it('管理员应该可以发布任何愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建另一个用户的草稿愿望
      const otherWish = await WishModel.create({
        title: '管理员发布的愿望',
        description: '这是管理员发布的愿望的描述，至少需要10个字符',
        job: '设计',
        submitter: testUser2.name,
        submitter_id: testUser2Id,
        status: 'draft'
      })

      const response = await request(app)
        .post(`/api/wishes/${otherWish.id}/publish`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('published')
    })
  })

  describe('POST /api/wishes/:id/archive - 下架愿望', () => {
    let archiveWishId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个已发布的愿望用于测试下架
      const archiveWish = await WishModel.create({
        title: '待下架的已发布愿望',
        description: '这是一个待下架的已发布愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
      archiveWishId = archiveWish.id
    })

    it('管理员应该可以下架愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${archiveWishId}/archive`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.status).toBe('archived')
    })

    it('普通用户应该不能下架愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post(`/api/wishes/${archiveWishId}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('只有管理员可以下架愿望')
    })
  })
})
