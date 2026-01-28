// 岗位匹配分析服务

// 计算愿望与用户岗位的匹配度
export function calculateMatchScore(userJob, wishJob) {
  if (!userJob || !wishJob) {
    return 0
  }

  // 完全匹配
  if (userJob === wishJob) {
    return 100
  }

  // 相关岗位匹配（可以根据实际需求扩展）
  const relatedJobs = {
    开发: ['产品', '测试'],
    设计: ['产品', '运营'],
    产品: ['开发', '设计', '运营'],
    运营: ['产品', '设计'],
    行政: ['人事', '财务'],
    测试: ['开发']
  }

  const related = relatedJobs[userJob] || []
  if (related.includes(wishJob)) {
    return 70 // 相关岗位匹配度70%
  }

  // 其他岗位匹配度较低
  return 30
}

// 获取匹配度描述
export function getMatchDescription(score) {
  if (score >= 90) {
    return { level: '高度匹配', color: '#27ae60', icon: '⭐⭐⭐' }
  } else if (score >= 70) {
    return { level: '中度匹配', color: '#f39c12', icon: '⭐⭐' }
  } else if (score >= 50) {
    return { level: '低度匹配', color: '#e67e22', icon: '⭐' }
  } else {
    return { level: '不匹配', color: '#95a5a6', icon: '' }
  }
}

// 获取愿望的匹配度信息
export function getWishMatchInfo(wish) {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
  if (!user || !user.job) {
    return null
  }

  const score = calculateMatchScore(user.job, wish.job)
  const description = getMatchDescription(score)

  return {
    score,
    ...description,
    userJob: user.job,
    wishJob: wish.job
  }
}
