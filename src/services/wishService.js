// 愿望服务 - 处理愿望数据的增删改查操作
import { loadWishes, saveWishes, getNextId } from '../data/wishes'

/**
 * 获取所有愿望（仅已发布的）
 * @returns {Array} 愿望列表
 */
export function getAllWishes() {
  const wishes = loadWishes()
  return wishes.filter(w => w.status === 'published')
}

/**
 * 获取所有愿望（包括草稿和已下架的，用于管理员）
 * @returns {Array} 愿望列表
 */
export function getAllWishesForAdmin() {
  return loadWishes()
}

/**
 * 根据ID获取愿望
 * @param {number|string} id - 愿望ID
 * @returns {Object|null} 愿望对象，如果不存在则返回null
 */
export function getWishById(id) {
  const wishes = loadWishes()
  const wishId = typeof id === 'string' ? parseInt(id, 10) : id
  return wishes.find(w => w.id === wishId) || null
}

/**
 * 根据岗位筛选愿望
 * @param {string} job - 岗位名称
 * @returns {Array} 愿望列表
 */
export function getWishesByJob(job) {
  const wishes = loadWishes()
  return wishes.filter(w => w.job === job && w.status === 'published')
}

/**
 * 获取所有岗位列表
 * @returns {Array<string>} 岗位列表
 */
export function getAllJobs() {
  const wishes = loadWishes()
  const jobs = new Set()
  wishes.forEach(w => {
    if (w.job) {
      jobs.add(w.job)
    }
  })
  return Array.from(jobs).sort()
}

/**
 * 添加新愿望
 * @param {Object} wishData - 愿望数据
 * @param {string} wishData.title - 愿望名称
 * @param {string} wishData.description - 需求描述
 * @param {string} wishData.job - 提交者岗位
 * @param {string} wishData.submitter - 提交者姓名
 * @param {string} [wishData.submitterId] - 提交者ID（可选）
 * @param {string} [wishData.status] - 愿望状态（可选，默认为'published'）
 * @returns {Object|null} 新创建的愿望对象，如果失败则返回null
 */
export function addWish(wishData) {
  const wishes = loadWishes()
  const newWish = {
    id: getNextId(wishes),
    title: wishData.title,
    description: wishData.description,
    job: wishData.job,
    submitter: wishData.submitter || '匿名用户',
    submitterId: wishData.submitterId || null,
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    status: wishData.status || 'published'
  }

  wishes.push(newWish)
  saveWishes(wishes)
  return newWish
}

/**
 * 更新愿望
 * @param {number|string} id - 愿望ID
 * @param {Object} updates - 要更新的字段
 * @returns {Object|null} 更新后的愿望对象，如果不存在则返回null
 */
export function updateWish(id, updates) {
  const wishes = loadWishes()
  const wishId = typeof id === 'string' ? parseInt(id, 10) : id
  const index = wishes.findIndex(w => w.id === wishId)

  if (index === -1) {
    return null
  }

  wishes[index] = {
    ...wishes[index],
    ...updates
  }

  saveWishes(wishes)
  return wishes[index]
}

/**
 * 删除愿望
 * @param {number|string} id - 愿望ID
 * @returns {boolean} 是否删除成功
 */
export function deleteWish(id) {
  const wishes = loadWishes()
  const wishId = typeof id === 'string' ? parseInt(id, 10) : id
  const index = wishes.findIndex(w => w.id === wishId)

  if (index === -1) {
    return false
  }

  wishes.splice(index, 1)
  saveWishes(wishes)
  return true
}

/**
 * 为愿望点赞
 * @param {number|string} id - 愿望ID
 * @returns {Object|null} 更新后的愿望对象，如果不存在则返回null
 */
export function likeWish(id) {
  const wishes = loadWishes()
  const wishId = typeof id === 'string' ? parseInt(id, 10) : id
  const index = wishes.findIndex(w => w.id === wishId)

  if (index === -1) {
    return null
  }

  wishes[index].likes = (wishes[index].likes || 0) + 1
  saveWishes(wishes)
  return wishes[index]
}

/**
 * 添加评论
 * @param {number|string} id - 愿望ID
 * @param {string} content - 评论内容
 * @param {string} [author] - 评论作者（可选，默认为'匿名用户'）
 * @returns {Object|null} 更新后的愿望对象，如果不存在则返回null
 */
export function addComment(id, content, author) {
  const wishes = loadWishes()
  const wishId = typeof id === 'string' ? parseInt(id, 10) : id
  const index = wishes.findIndex(w => w.id === wishId)

  if (index === -1) {
    return null
  }

  if (!wishes[index].comments) {
    wishes[index].comments = []
  }

  const newComment = {
    id: `comment-${Date.now()}`,
    author: author || '匿名用户',
    content: content.trim(),
    createdAt: new Date().toISOString()
  }

  wishes[index].comments.push(newComment)
  saveWishes(wishes)
  return wishes[index]
}

/**
 * 下架愿望（将状态改为unpublished）
 * @param {number|string} id - 愿望ID
 * @returns {Object|null} 更新后的愿望对象，如果不存在则返回null
 */
export function unpublishWish(id) {
  return updateWish(id, { status: 'unpublished' })
}

/**
 * 发布愿望（将状态改为published）
 * @param {number|string} id - 愿望ID
 * @returns {Object|null} 更新后的愿望对象，如果不存在则返回null
 */
export function publishWish(id) {
  return updateWish(id, { status: 'published' })
}

/**
 * 获取用户提交的愿望列表
 * @param {string} userId - 用户ID或用户名
 * @returns {Array} 用户提交的愿望列表
 */
export function getUserWishes(userId) {
  const wishes = loadWishes()
  return wishes.filter(w => w.submitterId === userId || w.submitter === userId)
}
