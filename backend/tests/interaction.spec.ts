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

  // 测试数据
  let testUserId: string
  let testUser2Id: string
  let testUserToken: string
  let testUser2Token: string
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
      // 清理测试数据
      await query('DELETE FROM comments WHERE author IN (?, ?)', [testUser.name, testUser2.name])
      await query(
        'DELETE FROM likes WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))',
        [testUser.email, testUser2.email]
      )
      await query(
        'DELETE FROM favorites WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))',
        [testUser.email, testUser2.email]
      )
      await query('DELETE FROM wishes WHERE submitter IN (?, ?)', [testUser.name, testUser2.name])
      await query('DELETE FROM users WHERE email IN (?, ?)', [testUser.email, testUser2.email])

      // 创建测试用户
      const userResult = await AuthService.register(testUser)
      testUserId = userResult.user!.id

      const user2Result = await AuthService.register(testUser2)
      testUser2Id = user2Result.user!.id

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

      // 创建已发布的愿望（用于测试）
      const publishedWish = await WishModel.create({
        title: '测试愿望标题',
        description: '这是一个测试愿望的描述，至少需要10个字符',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
      publishedWishId = publishedWish.id

      // 创建草稿状态的愿望（用于测试）
      const draftWish = await WishModel.create({
        title: '草稿愿望标题',
        description: '这是一个草稿愿望的描述',
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

  // ========== 点赞功能测试 ==========

  describe('POST /api/interactions/likes - 点赞愿望', () => {
    it('应该成功点赞已发布的愿望', async () => {
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
      expect(response.body.data.liked).toBe(true)
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
      expect(response.body.error.message).toContain('登录')
    })

    it('应该拒绝点赞不存在的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const response = await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: 'non-existent-id' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('愿望不存在')
    })

    it('应该拒绝重复点赞', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 第一次点赞
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 第二次点赞应该失败
      const response = await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('已经点赞')
    })
  })

  describe('DELETE /api/interactions/likes - 取消点赞', () => {
    it('应该成功取消点赞', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先点赞
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 取消点赞
      const response = await request(app)
        .delete('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.liked).toBe(false)
      expect(response.body.data.totalLikes).toBeGreaterThanOrEqual(0)
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
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('未找到点赞记录')
    })
  })

  describe('GET /api/interactions/likes/status - 检查点赞状态', () => {
    it('应该正确返回点赞状态', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先点赞
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 检查状态
      const response = await request(app)
        .get('/api/interactions/likes/status')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.liked).toBe(true)
    })
  })

  // ========== 收藏功能测试 ==========

  describe('POST /api/interactions/favorites - 收藏愿望', () => {
    it('应该成功收藏已发布的愿望', async () => {
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
      expect(response.body.error.message).toContain('登录')
    })

    it('应该拒绝重复收藏', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 第一次收藏
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 第二次收藏应该失败
      const response = await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('已经收藏')
    })
  })

  describe('DELETE /api/interactions/favorites - 取消收藏', () => {
    it('应该成功取消收藏', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先收藏
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 取消收藏
      const response = await request(app)
        .delete('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.favorited).toBe(false)
    })
  })

  describe('GET /api/interactions/favorites - 获取用户收藏列表', () => {
    it('应该成功获取用户收藏列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先收藏
      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      const response = await request(app)
        .get('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.favorites).toBeDefined()
      expect(Array.isArray(response.body.data.favorites)).toBe(true)
      expect(response.body.data.total).toBeGreaterThanOrEqual(1)
    })
  })

  // ========== 评论功能测试 ==========

  describe('POST /api/interactions/comments - 创建评论', () => {
    it('应该成功为已发布的愿望创建评论', async () => {
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
      expect(response.body.data.content).toBe(commentData.content)
      expect(response.body.data.author).toBe(testUser.name)
    })

    it('应该拒绝为草稿状态的愿望创建评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const commentData = {
        wishId: draftWishId,
        content: '这是一条测试评论'
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(commentData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('已发布')
    })

    it('应该拒绝空评论内容', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      const commentData = {
        wishId: publishedWishId,
        content: ''
      }

      const response = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(commentData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('评论内容不能为空')
    })
  })

  describe('PUT /api/interactions/comments/:id - 更新评论', () => {
    it('应该成功更新自己的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先创建评论
      const createResponse = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '原始评论内容'
        })
        .expect(201)

      const commentId = createResponse.body.data.id

      // 更新评论
      const updateResponse = await request(app)
        .put(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          content: '更新后的评论内容'
        })
        .expect(200)

      expect(updateResponse.body.success).toBe(true)
      expect(updateResponse.body.data.content).toBe('更新后的评论内容')
    })

    it('应该拒绝更新他人的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // testUser创建评论
      const createResponse = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: 'testUser的评论'
        })
        .expect(201)

      const commentId = createResponse.body.data.id

      // testUser2尝试更新testUser的评论
      const updateResponse = await request(app)
        .put(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({
          content: 'testUser2尝试更新的内容'
        })
        .expect(403)

      expect(updateResponse.body.success).toBe(false)
      expect(updateResponse.body.error.message).toContain('无权')
    })
  })

  describe('DELETE /api/interactions/comments/:id - 删除评论', () => {
    it('应该成功删除自己的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 先创建评论
      const createResponse = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '要删除的评论'
        })
        .expect(201)

      const commentId = createResponse.body.data.id

      // 删除评论
      const deleteResponse = await request(app)
        .delete(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(deleteResponse.body.success).toBe(true)
    })

    it('应该拒绝删除他人的评论', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // testUser创建评论
      const createResponse = await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: 'testUser的评论'
        })
        .expect(201)

      const commentId = createResponse.body.data.id

      // testUser2尝试删除testUser的评论
      const deleteResponse = await request(app)
        .delete(`/api/interactions/comments/${commentId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(403)

      expect(deleteResponse.body.success).toBe(false)
      expect(deleteResponse.body.error.message).toContain('无权')
    })
  })

  describe('GET /api/interactions/comments - 获取评论列表', () => {
    it('应该成功获取愿望的评论列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 创建几条评论
      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '评论1'
        })
        .expect(201)

      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({
          wishId: publishedWishId,
          content: '评论2'
        })
        .expect(201)

      const response = await request(app)
        .get('/api/interactions/comments')
        .query({ wishId: publishedWishId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.comments).toBeDefined()
      expect(Array.isArray(response.body.data.comments)).toBe(true)
      expect(response.body.data.total).toBeGreaterThanOrEqual(2)
    })
  })

  // ========== 统计信息测试 ==========

  describe('GET /api/interactions/stats/:wishId - 获取互动统计信息', () => {
    it('应该成功获取互动统计信息', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }

      // 添加点赞和收藏
      await request(app)
        .post('/api/interactions/likes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      await request(app)
        .post('/api/interactions/favorites')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ wishId: publishedWishId })
        .expect(200)

      // 创建评论
      await request(app)
        .post('/api/interactions/comments')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          wishId: publishedWishId,
          content: '统计测试评论'
        })
        .expect(201)

      const response = await request(app)
        .get(`/api/interactions/stats/${publishedWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishId).toBe(publishedWishId)
      expect(response.body.data.totalLikes).toBeGreaterThanOrEqual(1)
      expect(response.body.data.totalFavorites).toBeGreaterThanOrEqual(1)
      expect(response.body.data.totalComments).toBeGreaterThanOrEqual(1)
      expect(response.body.data.userLiked).toBe(true)
      expect(response.body.data.userFavorited).toBe(true)
    })
  })
})
