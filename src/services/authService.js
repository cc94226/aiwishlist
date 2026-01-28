// 用户认证和权限管理服务

// 获取所有用户（从localStorage）
function getAllUsers() {
  const usersStr = localStorage.getItem('users')
  if (usersStr) {
    return JSON.parse(usersStr)
  }
  return []
}

// 保存所有用户（到localStorage）
function saveAllUsers(users) {
  localStorage.setItem('users', JSON.stringify(users))
}

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

// 登录功能
/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {{success: boolean, user?: Object, message?: string}} 登录结果
 */
export function login(email, password) {
  const users = getAllUsers()
  const user = users.find(u => u.email === email && u.password === password)

  if (user) {
    // 登录成功，设置当前用户（不保存密码）
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    setCurrentUser(userWithoutPassword)
    return {
      success: true,
      user: userWithoutPassword,
      message: '登录成功'
    }
  }

  return {
    success: false,
    message: '邮箱或密码错误'
  }
}

// 注册功能
/**
 * 用户注册
 * @param {string} name - 用户姓名
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {string} [job] - 用户岗位（可选）
 * @returns {{success: boolean, user?: Object, message?: string, errors?: string[]}} 注册结果
 */
export function register(name, email, password, job) {
  const users = getAllUsers()

  // 检查邮箱是否已存在
  if (users.some(u => u.email === email)) {
    return {
      success: false,
      message: '该邮箱已被注册',
      errors: ['邮箱已存在']
    }
  }

  // 创建新用户
  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password, // 实际应用中应该加密存储
    role: 'user',
    job: job || '',
    createdAt: new Date().toISOString()
  }

  // 保存用户
  users.push(newUser)
  saveAllUsers(users)

  // 自动登录
  // eslint-disable-next-line no-unused-vars
  const { password: _, ...userWithoutPassword } = newUser
  setCurrentUser(userWithoutPassword)

  return {
    success: true,
    user: userWithoutPassword,
    message: '注册成功'
  }
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
  const users = getAllUsers()

  // 检查是否已有管理员账户
  const adminExists = users.some(u => u.email === 'admin@example.com')

  if (!adminExists) {
    const admin = {
      id: 'admin-001',
      name: '系统管理员',
      role: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // 默认密码，仅用于演示
      job: '开发',
      createdAt: new Date().toISOString()
    }
    users.push(admin)
    saveAllUsers(users)
  }

  // 如果没有设置当前用户，默认设置为管理员（仅用于演示）
  if (!getCurrentUser()) {
    const admin = users.find(u => u.email === 'admin@example.com')
    if (admin) {
      // eslint-disable-next-line no-unused-vars
      const { password: _, ...adminWithoutPassword } = admin
      setCurrentUser(adminWithoutPassword)
    }
  }
}
