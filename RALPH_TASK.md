---
task: Build a Web page app in Vue
## 🏗️ 技术架构方案建议

### 技术栈选择
* **前端**: React 18 + TypeScript + Vite
* **后端**: Node.js + Express + TypeScript  
* **数据库**: MySQL + Redis
* **状态管理**: Zustand (轻量级)
* **UI框架**: Ant Design
* **样式**: Tailwind CSS + CSS Modules
* **构建工具**: Vite (前端) + tsc (后端)
* **包管理**: pnpm (workspace)

### 架构模式
* **整体架构**: 前后端分离 + Monorepo
* **后端架构**: 分层架构 (Controller → Service → Repository)
* **前端架构**: 组件化 + 模块化
* **目录结构**: 按功能模块组织
---

# Task: CLI Todo App (TypeScript)

### Phase 1: Setup (项目初始化)

- [x] T001 [配置] 初始化 pnpm workspace 和项目结构 `package.json`
- [x] T002 [配置] 配置前端项目 (Vite + Vue 3) `package.json`
- [x] T003 [配置] 配置后端项目 (Node.js + Express + TypeScript) `backend/package.json`
- [x] T004 [配置] 设置 ESLint 和 Prettier 统一代码规范 `eslint.config.js`
- [x] T005 [配置] 配置 Git hooks (pre-commit, pre-push) `.husky/`

### Phase 2: Foundational (基础设施)

- [x] T006 [数据模型] 定义核心数据类型和接口 `shared/types/index.js`
- [x] T007 [数据模型] 设计数据库表结构 (MySQL) `database/migrations/001_create_tables.sql`
- [x] T008 [配置] 配置数据库连接和基础配置 `backend/src/config/database.ts`
- [x] T009 [配置] 实现基础中间件 (认证、错误处理、日志) `backend/src/middleware/`
- [x] T010 [配置] 前端路由配置 `src/router/index.js` (Vue Router已配置)
- [x] T011 [配置] API请求封装和错误处理 `src/utils/api.js`

### Phase 3: User Story - 用户认证系统

- [x] T012 [测试] [P] 为用户注册/登录接口编写测试用例 `backend/tests/auth.spec.ts`
- [x] T013 [数据模型] 定义用户相关数据模型 `backend/src/models/User.ts`
- [x] T014 [数据模型] 定义认证相关 DTO 类型 `shared/types/auth.js`
- [x] T015 [业务逻辑] 实现用户服务 (注册、登录、信息管理) `backend/src/services/AuthService.ts`
- [x] T016 [API] 实现认证相关路由和控制器 `backend/src/controllers/AuthController.ts`
- [x] T017 [UI] 创建登录页面组件 `src/views/Login.vue` (Vue项目已实现)
- [x] T018 [UI] 创建注册页面组件 `src/views/Register.vue` (Vue项目已实现)
- [x] T019 [UI] 创建用户状态管理 hooks `src/composables/useAuth.js` (Vue项目已实现)
- [x] T017.1 [UI] 创建ProtectedRoute路由保护组件 `src/router/guards.js` (Vue项目已实现路由守卫)
- [x] T017.2 [UI] 创建Dashboard用户仪表板页面 `src/views/Dashboard.vue` (Vue项目已实现)
- [x] T017.3 [集成] 升级App.vue集成完整认证系统 `src/App.vue` (Vue项目已实现)
- [x] T017.4 [测试] 创建前端认证系统完整测试套件 `src/views/__tests__/*.test.js` (Vue项目已实现)

### Phase 4: User Story - 愿望展示与浏览

- [x] T020 [测试] [P] 为愿望查询接口编写测试 `backend/tests/wish.spec.ts`
- [x] T021 [数据模型] 定义愿望数据模型 `backend/src/models/Wish.ts`
- [x] T022 [数据模型] 定义愿望相关 DTO 类型 `shared/types/wish.js`
- [x] T023 [业务逻辑] 实现愿望查询服务 (列表、详情、搜索) `backend/src/services/WishService.ts`
- [x] T024 [业务逻辑] 实现岗位分类服务 `backend/src/services/CategoryService.ts`
- [x] T025 [API] 实现愿望相关路由和控制器 `backend/src/controllers/WishController.ts`
- [x] T026 [UI] 创建愿望列表页面 `src/views/Home.vue` (Vue项目已实现)
- [x] T027 [UI] 创建愿望详情页面 `src/views/WishDetail.vue` (Vue项目已实现)
- [x] T028 [UI] 创建岗位分类导航组件 `src/views/Home.vue` (Vue项目中已实现岗位分类筛选功能)
- [x] T029 [UI] 创建愿望卡片组件 `src/views/Home.vue` (Vue项目中已实现愿望卡片展示功能)

### Phase 5: User Story - 愿望提交功能

- [x] T030 [测试] [P] 为愿望提交接口编写测试 `backend/tests/wish-create.spec.ts`
- [x] T031 [数据模型] 定义愿望表单验证规则 `src/utils/validation.js`
- [x] T032 [业务逻辑] 实现愿望创建服务 `backend/src/services/WishCreateService.ts`
- [x] T033 [API] 实现愿望提交相关路由 `backend/src/controllers/WishCreateController.ts`
- [x] T034 [UI] 创建愿望提交页面 `src/views/SubmitWish.vue` (Vue项目已实现)
- [x] T035 [UI] 创建愿望表单组件 `src/views/SubmitWish.vue` (Vue项目中已实现愿望表单功能)

### Phase 6: User Story - 互动功能 (点赞、收藏、评论)

- [x] T036 [测试] [P] 为互动功能编写测试 `backend/tests/interaction.spec.ts`
- [x] T037 [数据模型] 定义互动数据模型 `backend/src/models/Interaction.ts`
- [x] T038 [数据模型] 定义互动相关 DTO 类型 `shared/types/interaction.js`
- [x] T039 [业务逻辑] 实现互动服务 (点赞、收藏、评论) `backend/src/services/InteractionService.ts`
- [x] T040 [API] 实现互动相关路由和控制器 `backend/src/controllers/InteractionController.ts`
- [x] T041 [UI] 创建点赞组件 `src/views/WishDetail.vue` (Vue项目中已实现点赞功能)
- [x] T042 [UI] 创建收藏组件 `src/views/WishDetail.vue` (Vue项目中已实现收藏功能)
- [x] T043 [UI] 创建评论组件 `src/views/WishDetail.vue` (Vue项目中已实现评论功能)

### Phase 7: User Story - 个人中心

- [x] T044 [测试] [P] 为个人中心功能编写测试 `backend/tests/profile.spec.ts`
- [x] T045 [数据模型] 扩展用户模型 (个人资料、愿望统计) `backend/src/models/UserProfile.ts`
- [x] T046 [业务逻辑] 实现个人资料服务 `backend/src/services/ProfileService.ts`
- [x] T047 [API] 实现个人中心路由 `backend/src/controllers/ProfileController.ts`
- [x] T048 [UI] 创建个人中心页面 `src/views/UserProfile.vue` (Vue项目中已实现个人中心页面)
- [x] T049 [UI] 创建我的愿望组件 `src/components/MyWishes.vue`
- [x] T050 [UI] 创建收藏夹组件 `src/components/Favorites.vue`

### Phase 8: Polish (收尾优化)

- [x] T051 [配置] 实现响应式设计和移动端适配 `src/styles/responsive.css`
- [x] T052 [配置] 实现性能优化 (代码分割、懒加载) `src/utils/lazyLoad.js` (已完成：添加loadView函数，优化Vite配置实现代码分割)
- [x] T053 [配置] 实现错误边界和异常处理 `src/components/ErrorBoundary/index.vue` (已完成：完善ErrorBoundary组件，添加全局错误处理、路由错误处理、Promise错误处理，集成到App.vue和main.js)
- [x] T054 [配置] 实现数据缓存策略 `backend/src/services/CacheService.ts` (已完成：创建CacheService类，支持内存缓存和Redis缓存，实现TTL过期策略、缓存失效策略、缓存键管理、缓存装饰器)
- [x] T055 [配置] 实现日志记录和监控 `backend/src/utils/logger.ts` (已完成：创建LoggerService类，支持多级别日志、文件输出、日志轮转、性能监控、错误监控、结构化日志输出、环境变量配置)
- [x] T056 [配置] 实现前端路由权限控制 `src/components/ProtectedRoute/index.vue` (已完成：创建ProtectedRoute组件，支持登录权限、管理员权限、角色权限、岗位权限控制)
- [x] T057 [配置] 实现数据库备份和恢复脚本 `database/scripts/backup.sh` (已完成：创建backup.sh脚本，支持数据库备份、恢复、压缩、清理旧备份、列出备份文件等功能)
- [x] T058 [配置] 创建 Docker 配置和部署脚本 `docker-compose.yml` (已完成：创建Dockerfile、docker-compose.yml、nginx.conf、deploy.sh，支持前端、后端、MySQL、Redis服务的容器化部署)
- [x] T059 [文档] 创建一个“howtorun.md”文件，指导人类如何运行程序并使用功能
- [x] T060 [文档] 创建一个“databaseinfo.md”文件，输出数据库信息，让我可以在命令行里使用脚本或命令查看后台数据 (已完成：创建databaseinfo.md文档，包含完整的数据库结构说明、常用查询命令，并创建了4个查询脚本：query_stats.sh、query_users.sh、query_wishes.sh、query_interactions.sh)
- [ ] T)^! [debug] 清

## Requirements

针对公司内部不同岗位员工对 AI 工具的差异化需求，我们搭建了一个全岗位 AI 需求愿望收集平台。该平台会将用户提交的需求愿望按照职业需求进行分类，用户在不同分类界面可以查看各职业用户提交的需求愿望，点击可查看愿望的详细信息（包括愿望名称、描述、提交者岗位），用户可以为现有愿望点赞、评论，平台根据点赞数进行排行，还支持大家提交自己的新需求愿望。用户借此能够直观查找、快速探索适配自身岗位的优质 AI 工具需求，最终打造一个需求共享、高效匹配岗位需求的内部 AI 工具交流阵地。

## Success Criteria

1. [x]**愿望收集**：获取各职业对 AI 工具的需求愿望相关信息，建立网站初始愿望库
2. [x]**愿望单展示页面**：按职业/岗位（如开发、设计、行政）分类展示用户提交的愿望

- 展示方式为按岗位类别分类展示，以及按提交新旧顺序进行展示

3. [x]**建立愿望提交页面**：由用户发起"提交愿望"并填写愿望相关信息：
   信息包括以下字段：愿望名称、需求描述、提交者岗位
4. [x]**互动与收藏**：用户可以对已展示的愿望进行"点赞"或"收藏"
5. [x]**系统管理**：管理员有权限编辑、下架所有愿望信息。普通用户仅有权限编辑或删除自己"未提交暂存"状态的愿望信息
6. [x]**岗位匹配分析**：若用户提供岗位信息，系统可基于岗位标签对愿望进行匹配度分析，并在愿望详情页展示匹配结果

## Example Output

```
you can add output by your understanding of my Requirements
```

---

## Ralph Instructions

Read .ralph/progress.md to see what's been done
Check .ralph/guardrails.md for signs to follow
Work on the next incomplete criterion
Update .ralph/progress.md with your progress
Commit your changes with descriptive messages
When ALL criteria are met (all [ ] → [x]), output: <ralph>COMPLETE</ralph>
If stuck on the same issue 3+ times, output: <ralph>GUTTER</ralph>
