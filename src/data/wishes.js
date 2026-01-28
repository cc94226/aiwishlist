// 初始愿望库数据 - 各职业对AI工具的需求愿望
export const initialWishes = [
  {
    id: 1,
    title: '智能代码审查助手',
    description:
      '希望有一个AI工具能够自动审查代码，识别潜在bug、性能问题和代码规范问题，并提供改进建议。',
    job: '开发',
    submitter: '张开发',
    likes: 15,
    comments: [],
    createdAt: '2026-01-20T10:00:00Z',
    status: 'published'
  },
  {
    id: 2,
    title: 'UI设计灵感生成器',
    description: '需要一款AI工具，能够根据产品需求自动生成UI设计灵感和配色方案，提高设计效率。',
    job: '设计',
    submitter: '李设计',
    likes: 23,
    comments: [],
    createdAt: '2026-01-21T14:30:00Z',
    status: 'published'
  },
  {
    id: 3,
    title: '智能会议纪要生成',
    description:
      '希望有AI工具能够自动记录会议内容，生成结构化的会议纪要，并提取关键决策和待办事项。',
    job: '行政',
    submitter: '王行政',
    likes: 18,
    comments: [],
    createdAt: '2026-01-22T09:15:00Z',
    status: 'published'
  },
  {
    id: 4,
    title: '自动化测试用例生成',
    description: '需要AI工具能够根据功能需求自动生成测试用例，覆盖各种边界情况和异常场景。',
    job: '开发',
    submitter: '赵测试',
    likes: 12,
    comments: [],
    createdAt: '2026-01-23T11:20:00Z',
    status: 'published'
  },
  {
    id: 5,
    title: '设计稿转代码工具',
    description: '希望有AI工具能够将设计稿（Figma/Sketch）自动转换为前端代码，减少重复工作。',
    job: '设计',
    submitter: '周设计',
    likes: 28,
    comments: [],
    createdAt: '2026-01-24T16:45:00Z',
    status: 'published'
  },
  {
    id: 6,
    title: '智能文档整理系统',
    description: '需要AI工具能够自动分类和整理公司文档，建立知识库，方便快速检索。',
    job: '行政',
    submitter: '吴行政',
    likes: 9,
    comments: [],
    createdAt: '2026-01-25T13:10:00Z',
    status: 'published'
  },
  {
    id: 7,
    title: 'API文档自动生成',
    description: '希望有AI工具能够根据代码注释自动生成API文档，保持文档与代码同步更新。',
    job: '开发',
    submitter: '钱开发',
    likes: 20,
    comments: [],
    createdAt: '2026-01-26T10:30:00Z',
    status: 'published'
  },
  {
    id: 8,
    title: '品牌视觉识别生成',
    description: '需要AI工具能够根据品牌定位自动生成logo、配色方案和视觉识别系统。',
    job: '设计',
    submitter: '孙设计',
    likes: 16,
    comments: [],
    createdAt: '2026-01-27T15:20:00Z',
    status: 'published'
  }
]

// 从localStorage加载愿望数据，如果没有则使用初始数据
export function loadWishes() {
  const stored = localStorage.getItem('wishes')
  if (stored) {
    return JSON.parse(stored)
  }
  // 保存初始数据到localStorage
  localStorage.setItem('wishes', JSON.stringify(initialWishes))
  return initialWishes
}

// 保存愿望数据到localStorage
export function saveWishes(wishes) {
  localStorage.setItem('wishes', JSON.stringify(wishes))
}

// 获取下一个ID
export function getNextId(wishes) {
  return wishes.length > 0 ? Math.max(...wishes.map(w => w.id)) + 1 : 1
}
