/**
 * 愿望查询接口测试用例
 * 测试愿望查询相关的所有API端点
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

describe('愿望查询接口测试', () => {
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
  let publishedWishId: string
  let draftWishId: string
  let testUserId: string
  let testAdminId: string
  let testUserToken: string
  let testAdminToken: string

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

      // 创建测试愿望数据
      const publishedWish = await WishModel.create({
        title: '已发布的愿望',
        description: '这是一个已发布的愿望描述',
        job: '开发',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
      publishedWishId = publishedWish.id

      const draftWish = await WishModel.create({
        title: '草稿愿望',
        description: '这是一个草稿愿望描述',
        job: '设计',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'draft'
      })
      draftWishId = draftWish.id

      await WishModel.create({
        title: '已下架的愿望',
        description: '这是一个已下架的愿望描述',
        job: '产品',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'archived'
      })

      // 创建其他岗位的愿望
      await WishModel.create({
        title: '设计岗位愿望',
        description: '设计岗位的愿望描述',
        job: '设计',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })

      await WishModel.create({
        title: '产品岗位愿望',
        description: '产品岗位的愿望描述',
        job: '产品',
        submitter: testUser.name,
        submitter_id: testUserId,
        status: 'published'
      })
    } catch (error) {
      console.warn('设置测试数据时出错:', error)
    }
  })

  // 在所有测试后关闭数据库连接
  afterAll(async () => {
    await closePool()
  })

  describe('GET /api/wishes - 获取愿望列表', () => {
    it('未登录用户应该只能查看已发布的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      // 验证只返回已发布的愿望
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.status).toBe('published')
      })
    })

    it('普通用户应该只能查看已发布的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证只返回已发布的愿望
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.status).toBe('published')
      })
    })

    it('管理员应该可以查看所有状态的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ status: 'draft' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 管理员可以查看草稿
      const hasDraft = response.body.data.wishes.some((wish: any) => wish.status === 'draft')
      expect(hasDraft).toBe(true)
    })

    it('应该支持按岗位筛选', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes').query({ job: '设计' }).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证所有返回的愿望都是设计岗位
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.job).toBe('设计')
        expect(wish.status).toBe('published')
      })
    })

    it('应该支持分页', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes')
        .query({ page: 1, pageSize: 2 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(2)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(2)
      expect(response.body.data.totalPages).toBeGreaterThan(0)
    })

    it('应该支持按点赞数排序', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes')
        .query({ sortBy: 'likes', sortOrder: 'DESC' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeGreaterThan(0)
      // 验证排序（点赞数递减）
      const likes = response.body.data.wishes.map((wish: any) => wish.likes)
      const sortedLikes = [...likes].sort((a, b) => b - a)
      expect(likes).toEqual(sortedLikes)
    })

    it('应该支持搜索功能', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes').query({ search: '设计' }).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证搜索结果包含关键词
      const hasMatch = response.body.data.wishes.some(
        (wish: any) => wish.title.includes('设计') || wish.description.includes('设计')
      )
      expect(hasMatch).toBe(true)
    })
  })

  describe('GET /api/wishes/:id - 获取愿望详情', () => {
    it('未登录用户应该可以查看已发布的愿望详情', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get(`/api/wishes/${publishedWishId}`).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish).toBeDefined()
      expect(response.body.data.wish.id).toBe(publishedWishId)
      expect(response.body.data.wish.status).toBe('published')
    })

    it('未登录用户不应该可以查看草稿愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get(`/api/wishes/${draftWishId}`).expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('普通用户不应该可以查看他人的草稿愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      // 创建另一个用户
      await AuthService.register({
        name: '其他用户',
        email: 'other@example.com',
        password: 'other123456',
        confirmPassword: 'other123456',
        job: '设计'
      })
      const otherUserToken = (
        await AuthService.login({
          email: 'other@example.com',
          password: 'other123456'
        })
      ).token!

      const response = await request(app)
        .get(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')

      // 清理
      await query('DELETE FROM users WHERE email = ?', ['other@example.com'])
    })

    it('普通用户应该可以查看自己的草稿愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.id).toBe(draftWishId)
      expect(response.body.data.wish.status).toBe('draft')
    })

    it('管理员应该可以查看所有状态的愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get(`/api/wishes/${draftWishId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wish.id).toBe(draftWishId)
      expect(response.body.data.wish.status).toBe('draft')
    })

    it('应该返回404当愿望不存在', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes/non-existent-id').expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('WISH_NOT_FOUND')
    })

    it('应该拒绝无效的愿望ID', async () => {
      await request(app).get('/api/wishes/').expect(404) // 路由不匹配，返回404
    })
  })

  describe('GET /api/wishes/search - 搜索愿望', () => {
    it('应该成功搜索愿望', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/search')
        .query({ keyword: '设计' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      // 验证搜索结果包含关键词
      const hasMatch = response.body.data.wishes.some(
        (wish: any) => wish.title.includes('设计') || wish.description.includes('设计')
      )
      expect(hasMatch).toBe(true)
    })

    it('应该拒绝空搜索关键词', async () => {
      const response = await request(app)
        .get('/api/wishes/search')
        .query({ keyword: '' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_INPUT')
    })

    it('应该支持按岗位筛选搜索结果', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/search')
        .query({ keyword: '愿望', job: '设计' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证所有结果都是设计岗位
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.job).toBe('设计')
      })
    })

    it('应该支持分页', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/search')
        .query({ keyword: '愿望', page: 1, pageSize: 2 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(2)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(2)
    })
  })

  describe('GET /api/wishes/job/:job - 根据岗位获取愿望列表', () => {
    it('应该成功获取指定岗位的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes/job/设计').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证所有返回的愿望都是设计岗位
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.job).toBe('设计')
        expect(wish.status).toBe('published')
      })
    })

    it('应该拒绝无效的岗位类型', async () => {
      await request(app).get('/api/wishes/job/').expect(404) // 路由不匹配
    })

    it('应该支持分页', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/job/开发')
        .query({ page: 1, pageSize: 1 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(1)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(1)
    })
  })

  describe('GET /api/wishes/user/:userId - 获取用户提交的愿望列表', () => {
    it('普通用户应该可以查看自己的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get(`/api/wishes/user/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证所有返回的愿望都是该用户提交的
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.submitter_id).toBe(testUserId)
      })
    })

    it('普通用户不应该可以查看他人的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      // 创建另一个用户
      await AuthService.register({
        name: '其他用户',
        email: 'other@example.com',
        password: 'other123456',
        confirmPassword: 'other123456',
        job: '设计'
      })
      const otherUserToken = (
        await AuthService.login({
          email: 'other@example.com',
          password: 'other123456'
        })
      ).token!

      const response = await request(app)
        .get(`/api/wishes/user/${testUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')

      // 清理
      await query('DELETE FROM users WHERE email = ?', ['other@example.com'])
    })

    it('管理员应该可以查看所有用户的愿望列表', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get(`/api/wishes/user/${testUserId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      // 验证所有返回的愿望都是该用户提交的
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.submitter_id).toBe(testUserId)
      })
    })

    it('应该拒绝无效的用户ID', async () => {
      await request(app).get('/api/wishes/user/').expect(404) // 路由不匹配
    })
  })

  describe('GET /api/wishes/popular - 获取热门愿望列表', () => {
    it('应该成功获取热门愿望列表（按点赞数排序）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes/popular').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      // 验证排序（点赞数递减）
      if (response.body.data.wishes.length > 1) {
        const likes = response.body.data.wishes.map((wish: any) => wish.likes)
        const sortedLikes = [...likes].sort((a, b) => b - a)
        expect(likes).toEqual(sortedLikes)
      }
      // 验证只返回已发布的愿望
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.status).toBe('published')
      })
    })

    it('应该支持分页', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/popular')
        .query({ page: 1, pageSize: 2 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(2)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(2)
    })
  })

  describe('GET /api/wishes/latest - 获取最新愿望列表', () => {
    it('应该成功获取最新愿望列表（按创建时间排序）', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app).get('/api/wishes/latest').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes).toBeDefined()
      expect(Array.isArray(response.body.data.wishes)).toBe(true)
      // 验证排序（创建时间递减）
      if (response.body.data.wishes.length > 1) {
        const dates = response.body.data.wishes.map((wish: any) =>
          new Date(wish.created_at).getTime()
        )
        const sortedDates = [...dates].sort((a, b) => b - a)
        expect(dates).toEqual(sortedDates)
      }
      // 验证只返回已发布的愿望
      response.body.data.wishes.forEach((wish: any) => {
        expect(wish.status).toBe('published')
      })
    })

    it('应该支持分页', async () => {
      if (!dbConnected) {
        console.log('⏭️  跳过测试：数据库未连接')
        return
      }
      const response = await request(app)
        .get('/api/wishes/latest')
        .query({ page: 1, pageSize: 2 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.wishes.length).toBeLessThanOrEqual(2)
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(2)
    })
  })
})
