## 工程上下文与 AI 编码规范 (Project Context)

## 1. 技术栈 (Technology Stack)

- **核心框架:** 前端 Vue 3（`vue@^3.4.0`）+ Vue Router 4（`vue-router@^4.2.5`）；后端 Node.js 18+ + Express 4 + TypeScript 5
- **状态管理:** 当前工程未使用集中式状态管理库（如 Vuex/Pinia），以路由守卫、本地存储和服务模块管理登录态与会话信息
- **样式/UI库:** 自定义 CSS（如 `responsive.css`），未引入第三方 UI 组件库；导航和布局以语义化 HTML + 现代 CSS 实现
- **构建/工具:** 前端使用 Vite 5（`vite`）作为构建工具，Vitest 4 + @vue/test-utils 2 做单元测试；后端使用 TypeScript 编译（`tsc`）+ Jest 30 做单元测试；ESLint 9 + Prettier 3 + Husky + lint-staged 统一代码规范

## 2. 工程结构 (Project Structure)

- `src/main.js`: 前端入口文件，创建 Vue 应用，挂载 `App.vue`，注册路由，并通过 `setupGlobalErrorHandling` 配置全局错误处理和路由错误处理
- `src/App.vue`: 根组件，负责全局导航栏、布局，以及通过 `<ErrorBoundary>` 包裹路由视图，实现前端范围内的错误边界
- `src/router/index.js`: 前端路由配置，使用 `createRouter + createWebHistory`，结合 `loadView` 实现页面级懒加载，并通过守卫函数 `requireAuth`、`requireAdmin`、`redirectIfAuthenticated` 做访问控制
- `src/views`: 页面级组件目录，如 `Home.vue`、`SubmitWish.vue`、`WishDetail.vue`、`UserProfile.vue`、`Dashboard.vue`、`Login.vue`、`Register.vue`、`AdminPanel.vue`，一律使用单文件组件 (SFC) 组织模板、脚本和样式
- `src/components`: 复用型 UI/逻辑组件目录，如 `ProtectedRoute`、`ErrorBoundary`、`MyWishes`、`Favorites` 等；通常配合路由或业务页面使用，增强可复用性和可测试性
- `src/utils`: 前端工具函数目录，如 `errorHandler.js`（全局错误处理与上报）、`lazyLoad.js`（路由组件懒加载）；部分工具会在 `vite.config.js` 中配置为单独的打包 chunk
- `src/styles`: 全局样式目录，如 `responsive.css`，用于统一响应式布局和基础样式
- `src/test` / `src/**/__tests__`: 前端单元测试和组件测试目录（基于 Vitest 和 @vue/test-utils），如视图测试 `src/views/__tests__` 和路由守卫测试 `src/router/__tests__`
- `backend/src/index.ts`: 后端入口文件，创建 Express 应用，挂载跨域中间件、JSON 解析、统一日志中间件、健康检查与数据库连接检查路由，并注册各 API 路由和统一错误处理
- `backend/src/routes`: 后端路由层，包含 `auth.ts`、`wish.ts`、`interaction.ts`、`profile.ts` 等，主要负责 URL 到控制器的映射，以及与中间件（认证、权限、日志）绑定
- `backend/src/controllers`: 控制器层，如 `WishController.ts`、`WishCreateController.ts`、`InteractionController.ts`、`AuthController.ts`、`ProfileController.ts` 等，负责解析请求、调用对应服务、统一构造响应
- `backend/src/services`: 业务服务层，如 `WishService.ts`、`WishCreateService.ts`、`InteractionService.ts`、`CategoryService.ts`、`ProfileService.ts`、`AuthService.ts`、`CacheService.ts`，集中处理业务逻辑、权限校验与缓存策略
- `backend/src/models`: 数据模型层，如 `Wish.ts`、`User.ts`、`UserProfile.ts`、`Interaction.ts`，封装与数据库交互的结构定义和查询方法（如 `WishModel.findAll`、`WishModel.findById`）
- `backend/src/middleware`: 中间件层，如 `errorHandler.ts`（统一错误与 404 处理）、`auth.ts`（认证与权限控制）、`logger.ts`（日志与请求追踪）、`index.ts`（中间件聚合导出）
- `backend/src/config`: 配置与基础设施层，如 `index.ts`（通用配置）与 `database.ts`（数据库连接与 `testConnection`），用于管理环境变量和数据库连接
- `backend/tests`: 后端测试目录（Jest），包含愿望、互动、个人信息等模块的集成测试与服务测试
- `vite.config.js`: Vite 配置文件，配置 Vue 插件、开发服务器端口与自动打开浏览器，以及通过 `rollupOptions.manualChunks` 定义 `vue-vendor`、`utils` 等手动代码分割策略和构建输出命名规则
- `package.json` / `backend/package.json`: 分别管理前后端依赖、脚本和工具链配置（包括前端部署脚本，如使用 Cloudflare Wrangler 的 `"deploy"`、`"preview:cf"`）
- `database/scripts`: 与数据库相关的 Shell 脚本目录，用于备份和常用查询（如用户、愿望、统计信息）

## 3. 编码规范 (Coding Guidelines)

- **命名惯例:**
  - **组件/类名:** 使用 `PascalCase`，如前端组件 `UserProfile.vue`、`AdminPanel.vue`，后端类 `WishService`、`ProfileController`、`AppError`
  - **函数/变量:** 使用 `camelCase`，如 `getWishList`、`getWishDetail`、`initDefaultAdmin`、`setupGlobalErrorHandling`
  - **常量:** 使用 `SCREAMING_SNAKE_CASE` 或业务相关枚举/常量对象，如 `ErrorTypes.NETWORK_ERROR`、`CacheKeys.popularWishes`
- **类型规范:**
  - 前端目前以 JavaScript 为主，必要时通过 JSDoc 或明确的返回结构保持类型一致性；业务复杂度较高的逻辑优先放在后端
  - 后端必须使用 TypeScript 接口与类型定义请求参数和返回值，如 `GetWishListRequest`、`WishQueryOptions`、`WishQueryResult`、`WishStatus`、`JobType` 等
  - 面向外部接口的服务方法（Service）均应显式声明返回类型（如 `Promise<WishQueryResult>`、`Promise<Wish>`），错误通过抛出 `AppError` 或标准 `Error` 统一处理
- **异步处理:**
  - 前后端统一采用 `async/await` 处理异步逻辑，不推荐在新代码中使用链式 `.then().catch()` 风格
  - 错误处理推荐模式为：在业务层捕获非业务错误并转换为 `AppError`，在控制器或中间件层通过统一错误处理器返回标准化响应
- **样式写法:**
  - 前端 SFC 中使用 `<style>` 或 `<style scoped>` 编写组件局部样式；全局布局和响应式规则集中在 `src/styles/responsive.css`
  - 禁止在业务代码中杂糅行内样式，除非为简单且只读的演示用途；优先通过类名和 CSS 维护样式
- **注释与文档:**
  - 注释统一使用简体中文，UTF-8 编码，解释意图、约束和边界条件，而非简单翻译代码行为
  - 在修改既有函数实现时，应保留原有业务逻辑和注释，在此基础上补充或增强功能，而非完全重写

## 4. 核心架构模式 (Architectural Patterns)

- **前端数据流与页面结构:**
  - 数据流自上而下，`App.vue` 负责用户登录状态展示与导航，具体业务数据由各 `views` 页面通过服务模块（如 `authService`、愿望相关 API 模块）自行获取
  - 页面级组件通过 `router-view` 懒加载注入，`ProtectedRoute`、路由守卫等负责登录态与权限控制，`ErrorBoundary` 和全局 `errorHandler` 提供前端级别的错误隔离与降级恢复
- **后端分层模式:**
  - 路由层（`routes/*`）只负责 URL 映射和中间件绑定，不直接书写业务逻辑
  - 控制器层（`controllers/*`）负责解析请求参数、调用服务层、统一构造 HTTP 响应与状态码
  - 服务层（`services/*`）封装业务规则、权限控制与缓存策略，是主要业务承载层，如 `WishService.getWishList`、`WishService.getWishDetail`、`WishService.getPopularWishes` 等
  - 模型层（`models/*`）负责与数据库交互，提供 CRUD 和查询接口（如 `WishModel.findAll`、`WishModel.findById`），服务层不直接操作数据库连接
  - 中间件层（`middleware/*`）提供与业务无关的横切关注点，如日志、认证、错误和 404 处理，并通过聚合导出简化 `index.ts` 中的注册
- **异常处理:**
  - 后端使用自定义错误类 `AppError`（带有 `statusCode`、`code`、`isOperational` 字段）统一表示可预期业务错误，`errorHandler` 中间件根据错误类型返回结构化 JSON 响应
  - 未捕获的错误将以通用 `INTERNAL_SERVER_ERROR` 返回，在生产环境下隐藏具体错误信息，仅暴露“服务器内部错误”等友好提示
  - 前端通过 `errorHandler.js` 和 `ErrorBoundary` 捕获组件错误、路由错误、全局 JS 错误和未处理 Promise 拒绝，并在生产环境中具备错误上报能力
- **状态管理与权限控制:**
  - 登录态与权限信息通过前端 `authService` 配合后端 `/api/auth` 接口维护，路由守卫（`requireAuth`、`requireAdmin`、`redirectIfAuthenticated`）在路由进入前进行校验
  - 后端 `auth` 中间件在 API 层验证 JWT 或会话信息，并通过 `requireAdmin`、`optionalAuth` 等中间件细化权限控制规则
  - 愿望与互动接口在服务层根据 `userId` 与 `isAdmin` 参数细分访问权限（如只有管理员和提交者可查看草稿或下架愿望）
- **缓存与性能优化:**
  - 后端通过 `CacheService` 和 `lru-cache` 对热门查询（如 `wishList`、`popularWishes`、`latestWishes`、`wishDetail`）进行内存缓存，主要针对普通用户且不含用户特定权限的请求
  - 前端构建使用 Vite 的 `manualChunks` 将 Vue 相关依赖（`vue-vendor`）和工具函数模块（`utils`）分离打包，并在生产构建时使用 esbuild 压缩和移除 `console`、`debugger`，降低包体和提升加载速度

## 5. 最佳实践与禁忌 (Best Practices)

- ✅ **推荐做法 (PREFER):**
  - 在前端：将复杂逻辑和错误处理封装到专用的 `utils`、`services` 或组合式函数，对页面组件保持“数据展示 + 简单交互”的职责划分
  - 在后端：通过 Service 层统一封装与数据库模型的交互逻辑和业务规则，Controller 仅做参数解析与结果转发
  - 通过自定义 `AppError`（前后端各自实现）统一错误表达形式，并遵循统一的错误码和消息规范，方便前后端联调和监控
  - 所有新增异步逻辑优先采用 `async/await` 并配合 `try/catch` 或上抛给统一错误处理机制，避免散乱的 `.then().catch()`
  - 编写或修改代码后运行对应的测试（Vitest/Jest）与 `npm run lint`，保证格式化、类型和规则检查通过
- ❌ **禁止/避免 (AVOID):**
  - 避免在前端组件中直接使用低层次的 API 请求逻辑，应统一通过封装好的服务模块或 API 工具函数调用
  - 避免在 Controller 层直接操作数据库模型或编写复杂业务逻辑，必须通过 Service 层转发
  - 避免绕过 `AppError` 和统一错误处理中间件直接向客户端返回非标准 JSON 结构的错误响应
  - 避免随意在生产环境日志中输出详细的错误堆栈、数据库错误信息等敏感数据
  - 避免新增全局变量或隐式依赖，鼓励通过显式参数与依赖注入方式传递必要上下文

## 6. 代码范例 (Golden Snippets)

### 6.1 标准后端 Service + Controller 模板

```ts
// services/ExampleService.ts
import { AppError } from '../middleware/errorHandler'
import { ExampleModel, Example, ExampleQueryOptions } from '../models/Example'

/**
 * 示例服务：演示标准 Service 写法
 */
export class ExampleService {
  /**
   * 获取示例列表
   */
  static async getExampleList(options: ExampleQueryOptions): Promise<Example[]> {
    const { page = 1, pageSize = 10 } = options

    const queryOptions: ExampleQueryOptions = {
      ...options,
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100)
    }

    try {
      const result = await ExampleModel.findAll(queryOptions)
      return result
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('查询示例列表失败', 500, 'QUERY_EXAMPLE_LIST_FAILED')
    }
  }
}

export default ExampleService
```

```ts
// controllers/ExampleController.ts
import { Request, Response, NextFunction } from 'express'
import ExampleService from '../services/ExampleService'

/**
 * 示例控制器：演示 Controller 层标准写法
 */
export class ExampleController {
  static async getList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, pageSize, keyword } = req.query

      const result = await ExampleService.getExampleList({
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword: keyword ? String(keyword) : undefined
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
}
```

### 6.2 标准前端视图组件骨架

```vue
<template>
  <section class="page-container">
    <header class="page-header">
      <h2 class="page-title">示例页面标题</h2>
      <p class="page-subtitle">这里是对本页面功能的简要描述。</p>
    </header>

    <main class="page-content">
      <!-- 在此处渲染主要业务内容 -->
    </main>
  </section>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useErrorHandler } from '@/utils/errorHandler'

export default {
  name: 'ExampleView',
  setup() {
    const items = ref([])
    const loading = ref(false)
    const { handleError, getFriendlyMessage } = useErrorHandler()

    const loadData = async () => {
      loading.value = true
      try {
        // TODO: 调用后端 API 获取数据
        // const response = await exampleService.getList()
        // items.value = response.data
      } catch (error) {
        const friendlyMessage = getFriendlyMessage(error)
        handleError(error, { feature: 'ExampleView', action: 'loadData' })
        // 此处可以触发全局消息组件，展示 friendlyMessage
        console.error(friendlyMessage)
      } finally {
        loading.value = false
      }
    }

    onMounted(loadData)

    return {
      items,
      loading
    }
  }
}
</script>

<style scoped>
.page-container {
  max-width: 960px;
  margin: 2rem auto;
  padding: 1.5rem 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #666;
}
</style>
```
