/**
 * 互动功能接口测试用例
 * 测试点赞、收藏、评论相关的所有API端点
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

describe('互动功能接口测试', () => {
  // 检查数据库连接
  let dbConnected = false

  // 测试用户数据
  const testUser = {
    name: '测试用户',
    email: 'test_interaction@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '开发' as JobType
  }

  const testUser2 = {
    name: '测试用户2',
    email: 'test_interaction2@example.com',
    password: 'test123456',
    confirmPassword: 'test123456',
    job: '设计' as JobType
  }

  const testAdmin = {
    name: '测试管理员',
    email: 'admin_interaction@example.com',
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
      // 清理测试数据（按依赖顺序删除）
      await query(
        'DELETE FROM comments WHERE wish_id IN (SELECT id FROM wishes WHERE submitter IN (?, ?, ?))',
        [testUser.name, testUser2.name, testAdmin.name]
      )
      await query(
        'DELETE FROM likes WHERE wish_id IN (SELECT id FROM wishes WHERE submitter IN (?, ?, ?))',
        [testUser.name, testUser2.name, testAdmin.name]
      )
      await query(
        'DELETE FROM favorites WHERE wish_id IN (SELECT id FROM wishes WHERE submitter IN (?, ?, ?))',
        [testUser.name, testUser2.name, testAdmin.name]
      )
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

      // 创建测试愿望数据
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '这是一个已发布的愿望描述，用于测试互动功能',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
      publishedWishId = publishedWish.id

      const draftWish = await WishModel.create({
        title: '草稿愿望',
        description: '这是一个草稿状态的愿望描述',
        job: '设计',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      draftWishId = draftWish.id
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

  // ========== 点赞相关测试 ==========

  describe('POST /api/interactions/likes - 点赞愿望', () => {
    it('应该成功点赞愿望（已登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.liked).toBe(true)
      expect(typeof response.body.data.totalLikes).toBe('number')
      expect(response.body.data.totalLikes).toBeGreaterThanOrEqual(1)
    })

    it('应该拒绝未登录用户的点赞请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/likes')
        .send({ wishId: publishedWishId })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('应该拒绝点赞不存在的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: 'non-existent-wish-id' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('WISH_NOT_FOUND')
    })

    it('应该拒绝空愿望ID的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })
  })

  describe('DELETE /api/interactions/likes - 取消点赞', () => {
    it('应该成功取消点赞（已点赞的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先点赞
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      // 取消点赞
      const response = await request(app)
        .delete('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.liked).toBe(false)
      expect(typeof response.body.data.totalLikes).toBe('number')
    })

    it('应该拒绝取消未点赞的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_LIKED')
    })

    it('应该拒绝未登录用户的取消点赞请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete('/api/interactions/likes')
        .send({ wishId: publishedWishId })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/interactions/likes/status - 检查点赞状态', () => {
    it('应该返回已点赞状态（已点赞的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先点赞
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      // 检查状态
      const response = await request(app)
        .get('/api/interactions/likes/status')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.liked).toBe(true)
    })

    it('应该返回未点赞状态（未点赞的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/likes/status')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.liked).toBe(false)
    })

    it('应该拒绝未登录用户的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/likes/status')
        .query({ wishId: publishedWishId })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  // ========== 收藏相关测试 ==========

  describe('POST /api/interactions/favorites - 收藏愿望', () => {
    it('应该成功收藏愿望（已登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.favorited).toBe(true)
    })

    it('应该拒绝未登录用户的收藏请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/favorites')
        .send({ wishId: publishedWishId })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('应该拒绝收藏不存在的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: 'non-existent-wish-id' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('WISH_NOT_FOUND')
    })
  })

  describe('DELETE /api/interactions/favorites - 取消收藏', () => {
    it('应该成功取消收藏（已收藏的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先收藏
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      // 取消收藏
      const response = await request(app)
        .delete('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.favorited).toBe(false)
    })

    it('应该拒绝取消未收藏的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('NOT_FAVORITED')
    })
  })

  describe('GET /api/interactions/favorites/status - 检查收藏状态', () => {
    it('应该返回已收藏状态（已收藏的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先收藏
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      // 检查状态
      const response = await request(app)
        .get('/api/interactions/favorites/status')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.favorited).toBe(true)
    })

    it('应该返回未收藏状态（未收藏的用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/favorites/status')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.favorited).toBe(false)
    })
  })

  describe('GET /api/interactions/favorites - 获取用户收藏列表', () => {
    it('应该成功获取用户的收藏列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先收藏一个愿望
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      const response = await request(app)
        .get('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data.favorites)).toBe(true)
      expect(typeof response.body.data.total).toBe('number')
      expect(response.body.data.total).toBeGreaterThanOrEqual(1)
    })

    it('应该拒绝未登录用户的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app).get('/api/interactions/favorites').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  // ========== 评论相关测试 ==========

  describe('POST /api/interactions/comments - 创建评论', () => {
    it('应该成功创建评论（已登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const commentData = {
        wishId: publishedWishId,
        content: '这是一条测试评论'
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(commentData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBeDefined()
      expect(response.body.data.content).toBe(commentData.content)
      expect(response.body.data.author).toBe(testUser.name)
      expect(response.body.data.wish_id).toBe(publishedWishId)
    })

    it('应该拒绝未登录用户的评论请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .send({
          wishId: publishedWishId,
          content: '这是一条测试评论'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('应该拒绝评论草稿状态的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: draftWishId,
          content: '这是一条测试评论'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('WISH_NOT_PUBLISHED')
    })

    it('应该拒绝空评论内容', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: ''
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })
  })

  describe('PUT /api/interactions/comments/:id - 更新评论', () => {
    let commentId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个评论用于测试
      const commentData = {
        wishId: publishedWishId,
        content: '原始评论内容'
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(commentData)

      commentId = response.body.data.id
    })

    it('应该成功更新自己的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .put(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ content: '更新后的评论内容' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.content).toBe('更新后的评论内容')
    })

    it('应该拒绝更新他人的评论（非管理员）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 使用testUser2尝试更新testUser的评论
      const response = await request(app)
        .put(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({ content: '尝试更新他人的评论' })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员更新任何评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .put(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ content: '管理员更新的评论内容' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.content).toBe('管理员更新的评论内容')
    })
  })

  describe('DELETE /api/interactions/comments/:id - 删除评论', () => {
    let commentId: string

    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一个评论用于测试
      const commentData = {
        wishId: publishedWishId,
        content: '待删除的评论'
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(commentData)

      commentId = response.body.data.id
    })

    it('应该成功删除自己的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('评论已删除')
    })

    it('应该拒绝删除他人的评论（非管理员）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 使用testUser2尝试删除testUser的评论
      const response = await request(app)
        .delete(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('FORBIDDEN')
    })

    it('应该允许管理员删除任何评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .delete(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('评论已删除')
    })
  })

  describe('GET /api/interactions/comments - 获取评论列表', () => {
    beforeEach(async () => {
      if (!dbConnected) return

      // 创建几条测试评论
      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '第一条评论'
        })

      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({
          wishId: publishedWishId,
          content: '第二条评论'
        })
    })

    it('应该成功获取愿望的评论列表（未登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/comments')
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data.comments)).toBe(true)
      expect(response.body.data.comments.length).toBeGreaterThanOrEqual(2)
      expect(typeof response.body.data.total).toBe('number')
    })

    it('应该支持分页查询', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/comments')
        .query({
          wishId: publishedWishId,
          page: 1,
          pageSize: 1
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.comments.length).toBeLessThanOrEqual(1)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(1)
    })

    it('应该拒绝空愿望ID的请求', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app).get('/api/interactions/comments').expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })
  })

  // ========== 统计信息测试 ==========

  describe('GET /api/interactions/stats/:wishId - 获取互动统计信息', () => {
    beforeEach(async () => {
      if (!dbConnected) return

      // 创建一些互动数据
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({ wishId: publishedWishId })

      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })

      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '统计测试评论'
        })
    })

    it('应该成功获取互动统计信息（未登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/interactions/stats/${publishedWishId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(typeof response.body.data.totalLikes).toBe('number')
      expect(typeof response.body.data.totalFavorites).toBe('number')
      expect(typeof response.body.data.totalComments).toBe('number')
      expect(response.body.data.totalLikes).toBeGreaterThanOrEqual(2)
      expect(response.body.data.totalFavorites).toBeGreaterThanOrEqual(1)
      expect(response.body.data.totalComments).toBeGreaterThanOrEqual(1)
    })

    it('应该返回用户互动状态（已登录用户）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get(`/api/interactions/stats/${publishedWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.userLiked).toBe(true)
      expect(response.body.data.userFavorited).toBe(true)
    })

    it('应该拒绝不存在的愿望ID', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .get('/api/interactions/stats/non-existent-wish-id')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('WISH_NOT_FOUND')
    })
  })
})
