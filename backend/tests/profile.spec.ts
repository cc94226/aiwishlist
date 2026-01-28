/**
 * 个人中心接口测试用例
 * 测试个人中心相关的所有API端点
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
import { LikeModel, FavoriteModel, CommentModel } from '../src/models/Interaction'
import { JobType } from '../src/models/User'

describe('个人中心接口测试', () => {
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

  const testUser2 = {
    name: '测试用户2',
    email: 'test2@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '设计' as JobType
  }

  const testAdmin = {
    name: '测试管理员',
    email: 'admin@example.com',
    password: 'admin123456',
    confirmPassword: 'admin123456',
    job: '开发' as JobType
  }

  // 测试数据
  let testUserId: string
  let testUser2Id: string
  let testAdminId: string
  let testUserToken: string
  let testUser2Token: string
  let testAdminToken: string
  let publishedWishId: string
  let otherUserWishId: string

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
      await query('DELETE FROM comments WHERE author_id IN (?, ?, ?)', [
        testUser.email,
        testUser2.email,
        testAdmin.email
      ])
      await query('DELETE FROM likes WHERE user_id IN (?, ?, ?)', [
        testUser.email,
        testUser2.email,
        testAdmin.email
      ])
      await query('DELETE FROM favorites WHERE user_id IN (?, ?, ?)', [
        testUser.email,
        testUser2.email,
        testAdmin.email
      ])
      await query(
        'DELETE FROM wishes WHERE submitter_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))',
        [testUser.email, testUser2.email, testAdmin.email]
      )
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

      const user2LoginResult = await AuthService.login({
        email: testUser2.email,
        password: testUser2.password
      })
      testUser2Token = user2LoginResult.token!

      const adminLoginResult = await AuthService.login({
        email: testAdmin.email,
        password: testAdmin.password
      })
      testAdminToken = adminLoginResult.token!

      // 创建测试愿望
      const publishedWish = await WishModel.create({
        title: '测试已发布愿望',
        description: '这是一个已发布的测试愿望',
        submitter: testUser.name,
        submitter_id: testUserId,
        job: '开发',
        status: 'published'
      })
      publishedWishId = publishedWish.id

      await WishModel.create({
        title: '测试草稿愿望',
        description: '这是一个草稿状态的测试愿望',
        submitter: testUser.name,
        submitter_id: testUserId,
        job: '开发',
        status: 'draft'
      })

      // 创建其他用户的愿望
      const otherWish = await WishModel.create({
        title: '其他用户的愿望',
        description: '这是其他用户的愿望',
        submitter: testUser2.name,
        submitter_id: testUser2Id,
        job: '设计',
        status: 'published'
      })
      otherUserWishId = otherWish.id

      // 创建一些互动数据
      // 用户2点赞用户1的愿望
      await LikeModel.create({
        user_id: testUser2Id,
        wish_id: publishedWishId
      })

      // 用户2收藏用户1的愿望
      await FavoriteModel.create({
        user_id: testUser2Id,
        wish_id: publishedWishId
      })

      // 用户2评论用户1的愿望
      await CommentModel.create({
        author: testUser2.name,
        author_id: testUser2Id,
        wish_id: publishedWishId,
        content: '这是一个测试评论'
      })

      // 用户1点赞其他用户的愿望
      await LikeModel.create({
        user_id: testUserId,
        wish_id: otherUserWishId
      })
    } catch (error) {
      console.error('设置测试数据时出错:', error)
    }
  })

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await closePool()
  })

  describe('GET /api/profile/me - 获取当前用户的个人资料', () => {
    it('应该成功获取当前用户的个人资料（包含统计信息）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.profile).toBeDefined()
      expect(response.body.data.profile.user).toBeDefined()
      expect(response.body.data.profile.user.id).toBe(testUserId)
      expect(response.body.data.profile.user.email).toBe(testUser.email.toLowerCase())
      expect(response.body.data.profile.stats).toBeDefined()
      expect(response.body.data.profile.stats.wishes).toBeDefined()
      expect(response.body.data.profile.stats.interactions).toBeDefined()
    })

    it('应该拒绝未登录用户的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app).get('/api/profile/me').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/profile/:userId - 获取指定用户的个人资料', () => {
    it('应该成功获取自己的个人资料', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.profile).toBeDefined()
      expect(response.body.data.profile.user.id).toBe(testUserId)
    })

    it('应该拒绝用户查看其他用户的个人资料', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员查看任何用户的个人资料', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.profile).toBeDefined()
      expect(response.body.data.profile.user.id).toBe(testUserId)
    })

    it('应该拒绝未登录用户的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app).get(`/api/profile/${testUserId}`).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('应该返回404当用户不存在时', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const fakeUserId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .get(`/api/profile/${fakeUserId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('GET /api/profile/:userId/wishes - 获取用户的愿望列表', () => {
    it('应该成功获取自己的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(0)
    })

    it('应该支持分页参数', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/wishes`)
        .query({ page: 1, pageSize: 1 })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.pageSize).toBe(1)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(1)
    })

    it('应该支持状态筛选（管理员可以查看所有状态）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 管理员查看所有状态
      const adminResponse = await request(app)
        .get(`/api/profile/${testUserId}/wishes`)
        .query({ status: 'draft' })
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(adminResponse.body.success).toBe(true)
      expect(adminResponse.body.data.wishes).toBeDefined()

      // 普通用户只能查看已发布的
      const userResponse = await request(app)
        .get(`/api/profile/${testUserId}/wishes`)
        .query({ status: 'draft' })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(userResponse.body.success).toBe(true)
    })

    it('应该拒绝用户查看其他用户的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员查看任何用户的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/wishes`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
    })
  })

  describe('GET /api/profile/:userId/favorites - 获取用户的收藏列表', () => {
    it('应该成功获取自己的收藏列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/favorites`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.favorites).toBeDefined()
      expect(Array.isArray(response.body.data.favorites)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
    })

    it('应该支持分页参数', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/favorites`)
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.pageSize).toBe(10)
    })

    it('应该拒绝用户查看其他用户的收藏列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/favorites`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该拒绝未登录用户的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app).get(`/api/profile/${testUser2Id}/favorites`).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/profile/:userId/stats/wishes - 获取用户的愿望统计信息', () => {
    it('应该成功获取自己的愿望统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.total).toBeDefined()
      expect(response.body.data.draft).toBeDefined()
      expect(response.body.data.published).toBeDefined()
      expect(response.body.data.archived).toBeDefined()
      expect(typeof response.body.data.total).toBe('number')
    })

    it('管理员应该能看到所有状态的统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/wishes`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      // 管理员可以看到草稿状态的统计
      expect(response.body.data.draft).toBeGreaterThanOrEqual(0)
    })

    it('应该拒绝用户查看其他用户的统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/stats/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员查看任何用户的统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/wishes`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })

  describe('GET /api/profile/:userId/stats/interactions - 获取用户的互动统计信息', () => {
    it('应该成功获取自己的互动统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.receivedLikes).toBeDefined()
      expect(response.body.data.favoritesCount).toBeDefined()
      expect(response.body.data.commentsCount).toBeDefined()
      expect(response.body.data.likesGiven).toBeDefined()
      expect(typeof response.body.data.receivedLikes).toBe('number')
      expect(typeof response.body.data.favoritesCount).toBe('number')
      expect(typeof response.body.data.commentsCount).toBe('number')
      expect(typeof response.body.data.likesGiven).toBe('number')
    })

    it('应该正确统计用户获得的点赞数（用户提交的愿望收到的点赞数）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      // 用户1的愿望被用户2点赞了，所以应该收到至少1个点赞
      expect(response.body.data.receivedLikes).toBeGreaterThanOrEqual(1)
    })

    it('应该正确统计用户点赞的愿望数量', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      // 用户1点赞了其他用户的愿望
      expect(response.body.data.likesGiven).toBeGreaterThanOrEqual(1)
    })

    it('应该拒绝用户查看其他用户的统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser2Id}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员查看任何用户的统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUserId}/stats/interactions`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })
})
