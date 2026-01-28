/**
 * 懒加载工具函数
 * 用于实现Vue组件的代码分割和按需加载
 */

/**
 * 创建懒加载组件
 * @param {Function} importFn - 动态导入函数，返回Promise
 * @returns {Object} Vue组件配置对象
 */
export function lazyLoad(importFn) {
  return () => ({
    component: importFn(),
    loading: {
      // 加载中显示的组件（可选）
      template:
        '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>',
      delay: 200 // 延迟显示加载状态，避免闪烁
    },
    error: {
      // 加载失败显示的组件（可选）
      template: '<div class="error-container"><p>加载失败，请刷新页面重试</p></div>'
    },
    timeout: 10000 // 超时时间（毫秒）
  })
}

/**
 * 预加载组件
 * 在空闲时间预加载指定组件，提升用户体验
 * @param {Function} importFn - 动态导入函数
 */
export function preloadComponent(importFn) {
  if ('requestIdleCallback' in window) {
    // 使用requestIdleCallback在浏览器空闲时预加载
    requestIdleCallback(() => {
      importFn().catch(() => {
        // 预加载失败不影响正常使用
      })
    })
  } else {
    // 降级方案：使用setTimeout延迟加载
    setTimeout(() => {
      importFn().catch(() => {
        // 预加载失败不影响正常使用
      })
    }, 2000)
  }
}

/**
 * 批量预加载组件
 * @param {Array<Function>} importFns - 动态导入函数数组
 */
export function preloadComponents(importFns) {
  importFns.forEach((importFn, index) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          importFn().catch(() => {
            // 预加载失败不影响正常使用
          })
        },
        { timeout: 5000 + index * 1000 } // 错开预加载时间
      )
    } else {
      setTimeout(
        () => {
          importFn().catch(() => {
            // 预加载失败不影响正常使用
          })
        },
        2000 + index * 500
      )
    }
  })
}

/**
 * 创建带重试机制的懒加载组件
 * @param {Function} importFn - 动态导入函数
 * @param {number} maxRetries - 最大重试次数，默认3次
 * @returns {Object} Vue组件配置对象
 */
export function lazyLoadWithRetry(importFn, maxRetries = 3) {
  let retryCount = 0

  const loadWithRetry = () => {
    return importFn().catch(error => {
      if (retryCount < maxRetries) {
        retryCount++
        console.warn(`组件加载失败，正在重试 (${retryCount}/${maxRetries})...`, error)
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(loadWithRetry())
          }, 1000 * retryCount) // 指数退避
        })
      }
      throw error
    })
  }

  return () => ({
    component: loadWithRetry(),
    loading: {
      template:
        '<div class="loading-container"><div class="loading-spinner"></div><p>加载中...</p></div>',
      delay: 200
    },
    error: {
      template: '<div class="error-container"><p>加载失败，请刷新页面重试</p></div>'
    },
    timeout: 15000
  })
}
