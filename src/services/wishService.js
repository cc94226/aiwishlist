import { loadWishes, saveWishes, getNextId } from '../data/wishes'

// 获取所有愿望
export function getAllWishes() {
  return loadWishes()
}

// 根据ID获取愿望
export function getWishById(id) {
  const wishes = loadWishes()
  return wishes.find(w => w.id === parseInt(id))
}

// 根据职业筛选愿望
export function getWishesByJob(job) {
  const wishes = loadWishes()
  if (!job || job === '全部') {
    return wishes.filter(w => w.status === 'published')
  }
  return wishes.filter(w => w.job === job && w.status === 'published')
}

// 添加新愿望
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

// 更新愿望
export function updateWish(id, updates) {
  const wishes = loadWishes()
  const index = wishes.findIndex(w => w.id === parseInt(id))
  if (index !== -1) {
    wishes[index] = { ...wishes[index], ...updates }
    saveWishes(wishes)
    return wishes[index]
  }
  return null
}

// 删除愿望
export function deleteWish(id) {
  const wishes = loadWishes()
  const filtered = wishes.filter(w => w.id !== parseInt(id))
  saveWishes(filtered)
  return filtered.length < wishes.length
}

// 点赞愿望
export function likeWish(id) {
  const wish = getWishById(id)
  if (wish) {
    return updateWish(id, { likes: wish.likes + 1 })
  }
  return null
}

// 添加评论
export function addComment(id, comment) {
  const wish = getWishById(id)
  if (wish) {
    const comments = [...wish.comments, {
      id: Date.now(),
      content: comment,
      author: '匿名用户',
      createdAt: new Date().toISOString()
    }]
    return updateWish(id, { comments })
  }
  return null
}

// 获取所有职业列表
export function getAllJobs() {
  const wishes = loadWishes()
  const jobs = [...new Set(wishes.map(w => w.job))]
  return jobs.sort()
}

// 下架愿望（管理员功能）
export function unpublishWish(id) {
  return updateWish(id, { status: 'unpublished' })
}

// 发布愿望（管理员功能）
export function publishWish(id) {
  return updateWish(id, { status: 'published' })
}

// 获取所有愿望（包括未发布的，管理员使用）
export function getAllWishesForAdmin() {
  return loadWishes()
}
