/**
 * 个人中心接口测试用例
 * 测试用户个人资料、统计信息、愿望列表、收藏列表等功能
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
import { FavoriteModel } from '../src/models/Interaction'

describe('个人中心接口测试', () => {
  // 检查数据库连接
  let dbConnected = false

  // 测试用户数据
  let testUser: any = null
  let testUserToken: string = ''
  let testAdmin: any = null
  let testAdminToken: string = ''

  beforeAll(async () => {
    // 测试数据库连接
    dbConnected = await testConnection()
    if (!dbConnected) {
      console.warn(
        '⚠️  数据库连接失败，部分测试将被跳过。请确保MySQL服务正在运行并配置了正确的连接信息。'
      )
      return
    }

    // 创建测试用户
    const registerResult = await AuthService.register({
      name: '测试用户',
      email: 'testprofile@example.com',
      password: 'test123456',
      job: '开发'
    })

    if (registerResult.success && registerResult.user) {
      testUser = registerResult.user
      // 登录获取token
      const loginResult = await AuthService.login({
        email: 'testprofile@example.com',
        password: 'test123456'
      })
      if (loginResult.success && loginResult.token) {
        testUserToken = loginResult.token
      }
    }

    // 创建测试管理员
    const adminRegisterResult = await AuthService.register({
      name: '测试管理员',
      email: 'testadminprofile@example.com',
      password: 'test123456',
      job: '产品'
    })

    if (adminRegisterResult.success && adminRegisterResult.user) {
      testAdmin = adminRegisterResult.user
      // 将用户设置为管理员
      await query('UPDATE users SET role = ? WHERE id = ?', ['admin', testAdmin.id])
      testAdmin.role = 'admin'
      // 登录获取token
      const adminLoginResult = await AuthService.login({
        email: 'testadminprofile@example.com',
        password: 'test123456'
      })
      if (adminLoginResult.success && adminLoginResult.token) {
        testAdminToken = adminLoginResult.token
      }
    }
  })

  // 在每个测试前清理测试数据
  beforeEach(async () => {
    if (!dbConnected) return

    try {
      // 清理愿望、评论、点赞、收藏数据
      if (testUser) {
        await query('DELETE FROM comments WHERE author_id = ?', [testUser.id])
        await query('DELETE FROM likes WHERE user_id = ?', [testUser.id])
        await query('DELETE FROM favorites WHERE user_id = ?', [testUser.id])
        await query('DELETE FROM wishes WHERE submitter_id = ?', [testUser.id])
      }
      if (testAdmin) {
        await query('DELETE FROM comments WHERE author_id = ?', [testAdmin.id])
        await query('DELETE FROM likes WHERE user_id = ?', [testAdmin.id])
        await query('DELETE FROM favorites WHERE user_id = ?', [testAdmin.id])
        await query('DELETE FROM wishes WHERE submitter_id = ?', [testAdmin.id])
      }
    } catch (error) {
      // 忽略错误（表可能不存在）
      console.warn('清理测试数据时出错:', error)
    }
  })

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    if (dbConnected) {
      // 清理测试用户
      if (testUser) {
        await query('DELETE FROM users WHERE id = ?', [testUser.id])
      }
      if (testAdmin) {
        await query('DELETE FROM users WHERE id = ?', [testAdmin.id])
      }
    }
    await closePool()
  })

  describe('GET /api/profile/me - 获取当前用户个人资料', () => {
    it('应该成功获取当前用户的个人资料（包含统计信息）', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
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
      expect(response.body.data.profile.user.id).toBe(testUser.id)
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
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/profile/:userId - 获取指定用户个人资料', () => {
    it('应该成功获取自己的个人资料', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.profile.user.id).toBe(testUser.id)
    })

    it('应该拒绝查看其他用户的个人资料（普通用户）', async () => {
      if (!dbConnected || !testUser || !testUserToken || !testAdmin) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testAdmin.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员查看任何用户的个人资料', async () => {
      if (!dbConnected || !testAdmin || !testAdminToken || !testUser) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser.id}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.profile.user.id).toBe(testUser.id)
    })
  })

  describe('GET /api/profile/:userId/wishes - 获取用户愿望列表', () => {
    it('应该成功获取自己的愿望列表', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      // 创建一些测试愿望
      await WishModel.create({
        title: '测试愿望1',
        description: '测试描述1',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUser.id,
        status: 'published'
      })

      await WishModel.create({
        title: '测试愿望2',
        description: '测试描述2',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUser.id,
        status: 'draft'
      })

      const response = await request(app)
        .get(`/api/profile/${testUser.id}/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      expect(response.body.data.pagination).toBeDefined()
    })

    it('应该拒绝查看其他用户的愿望列表（普通用户）', async () => {
      if (!dbConnected || !testUser || !testUserToken || !testAdmin) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testAdmin.id}/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该支持分页查询', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser.id}/wishes?page=1&pageSize=5`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.pageSize).toBe(5)
    })
  })

  describe('GET /api/profile/:userId/favorites - 获取用户收藏列表', () => {
    it('应该成功获取自己的收藏列表', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      // 创建一个测试愿望
      const wish = await WishModel.create({
        title: '测试愿望',
        description: '测试描述',
        job: '开发',
        submitter: testAdmin?.name || '测试管理员',
        submitter_id: testAdmin?.id || null,
        status: 'published'
      })

      // 收藏愿望
      await FavoriteModel.create({
        wish_id: wish.id,
        user_id: testUser.id
      })

      const response = await request(app)
        .get(`/api/profile/${testUser.id}/favorites`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.favorites).toBeDefined()
      expect(Array.isArray(response.body.data.favorites)).toBe(true)
    })

    it('应该拒绝查看其他用户的收藏列表', async () => {
      if (!dbConnected || !testUser || !testUserToken || !testAdmin) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testAdmin.id}/favorites`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('GET /api/profile/:userId/stats/wishes - 获取用户愿望统计', () => {
    it('应该成功获取自己的愿望统计信息', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      // 创建不同状态的愿望
      await WishModel.create({
        title: '草稿愿望',
        description: '草稿描述',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUser.id,
        status: 'draft'
      })

      await WishModel.create({
        title: '已发布愿望',
        description: '已发布描述',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUser.id,
        status: 'published'
      })

      const response = await request(app)
        .get(`/api/profile/${testUser.id}/stats/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.total).toBeGreaterThanOrEqual(0)
      expect(response.body.data.draft).toBeGreaterThanOrEqual(0)
      expect(response.body.data.published).toBeGreaterThanOrEqual(0)
      expect(response.body.data.archived).toBeGreaterThanOrEqual(0)
    })

    it('应该拒绝查看其他用户的统计信息（普通用户）', async () => {
      if (!dbConnected || !testUser || !testUserToken || !testAdmin) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testAdmin.id}/stats/wishes`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('GET /api/profile/:userId/stats/interactions - 获取用户互动统计', () => {
    it('应该成功获取自己的互动统计信息', async () => {
      if (!dbConnected || !testUser || !testUserToken) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testUser.id}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(typeof response.body.data.receivedLikes).toBe('number')
      expect(typeof response.body.data.favoritesCount).toBe('number')
      expect(typeof response.body.data.commentsCount).toBe('number')
      expect(typeof response.body.data.likesGiven).toBe('number')
    })

    it('应该拒绝查看其他用户的统计信息（普通用户）', async () => {
      if (!dbConnected || !testUser || !testUserToken || !testAdmin) {
        console.log('⏭️  跳过测试：数据库未连接或测试用户未创建')
        return
      }

      const response = await request(app)
        .get(`/api/profile/${testAdmin.id}/stats/interactions`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
  })
})
