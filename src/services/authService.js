// 用户认证和权限管理服务

// 获取当前用户
export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser')
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
}

// 设置当前用户
export function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

// 登出
export function logout() {
  localStorage.removeItem('currentUser')
}

// 检查是否为管理员
export function isAdmin() {
  const user = getCurrentUser()
  return user && user.role === 'admin'
}

// 检查是否为愿望的创建者
export function isWishOwner(wish) {
  const user = getCurrentUser()
  if (!user) return false
  return wish.submitter === user.name || wish.submitterId === user.id
}

// 检查用户是否可以编辑愿望
export function canEditWish(wish) {
  if (isAdmin()) {
    return true // 管理员可以编辑所有愿望
  }
  // 普通用户只能编辑自己未提交暂存状态的愿望
  return isWishOwner(wish) && wish.status === 'draft'
}

// 检查用户是否可以删除愿望
export function canDeleteWish(wish) {
  if (isAdmin()) {
    return true // 管理员可以删除所有愿望
  }
  // 普通用户只能删除自己未提交暂存状态的愿望
  return isWishOwner(wish) && wish.status === 'draft'
}

// 初始化默认管理员账户（仅用于演示）
export function initDefaultAdmin() {
  const admin = {
    id: 'admin-001',
    name: '系统管理员',
    role: 'admin',
    email: 'admin@example.com',
    job: '开发' // 默认岗位，用于匹配分析演示
  }
  // 如果没有设置用户，默认设置为管理员（仅用于演示）
  if (!getCurrentUser()) {
    setCurrentUser(admin)
  }
}
