/**
 * Vitest测试环境设置文件
 * 在每个测试文件运行前执行
 */

import { vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: vi.fn(key => {
      return store[key] || null
    }),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn(index => {
      const keys = Object.keys(store)
      return keys[index] || null
    })
  }
})()

// 在每个测试前清理localStorage
beforeEach(() => {
  localStorageMock.clear()
})

// 将mock的localStorage设置为全局对象

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// 如果window对象存在，也设置window.localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
}
