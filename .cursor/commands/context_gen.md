# Role

你是一位拥有 20 年经验的架构师和技术负责人，擅长快速梳理陌生代码仓库的架构模式、编码规范和工程上下文。

# Task

请扫描并分析我当前提供的代码库（包括配置文件、目录结构、核心业务代码），目标是生成或更新一份名为`./proj-context/PROJECT_CONTEXT.md`的工程上下文文档。
这份文档将作为后续 AI 编程助手的“行动指南”，确保 AI 生成的代码完全符合本工程的风格和规范。

# Analysis Dimensions (请从以下维度深度分析)

1.  **Tech Stack & Versions (技术栈):**
    - 识别语言、框架、核心依赖库及其主要版本。
    - 识别构建工具和包管理器。

2.  **Project Structure (工程结构):**
    - 分析文件夹层级含义 (e.g., `/features` vs `/components`)。
    - 识别核心入口文件和路由模式。

3.  **Coding Conventions (编码规范):**
    - **命名风格:** PascalCase, camelCase, snake_case 的具体应用场景。
    - **类型规范:** 接口定义、泛型使用习惯。
    - **组件/类结构:** 函数式 vs 类式，分层代码标准写法。
    - **样式方案:** CSS Modules, Tailwind, Styled-components 等。

4.  **Key Architectural Patterns (核心架构模式):**
    - 数据流向、状态管理模式。
    - 统一的错误处理与日志机制。
    - API 请求封装方式。

5.  **"Don'ts" & Constraints (禁忌与约束):**
    - 识别代码中明显避免的模式 (e.g., "禁止直接操作 DOM", "Controller 层禁止写业务逻辑")。
    - 偏好的库 (e.g., "优先使用 dayjs 而不是 moment")。

# Output Format (请严格按照此 Markdown 模板输出)

```markdown
# 工程上下文与 AI 编码规范 (Project Context)

## 1. 技术栈 (Technology Stack)

- **核心框架:** [语言/框架及版本，如 Vue 3.3, Spring Boot 3.1]
- **状态管理:** [如 Pinia, Redux, 暂无]
- **样式/UI库:** [如 Tailwind CSS, Ant Design]
- **构建/工具:** [如 Vite, Maven, pnpm]

## 2. 工程结构 (Project Structure)

- `src/api`: [描述该目录用途，如：统一存放 Axios 请求封装]
- `src/components`: [描述该目录用途，如：公共 UI 组件]
- `src/views`: [描述该目录用途，如：页面级组件]
- [其他关键目录]: [描述]

## 3. 编码规范 (Coding Guidelines)

- **命名惯例:**
  - 组件/类名: `PascalCase` (如 `UserProfile.vue`)
  - 函数/变量: `camelCase` (如 `getUserInfo`)
  - 常量: `SCREAMING_SNAKE_CASE` (如 `MAX_COUNT`)
- **类型规范:** [如：必须使用 TypeScript Interface 定义 Props]
- **异步处理:** [如：统一使用 async/await，禁止链式 .then]
- **样式写法:** [如：必须使用 Scoped CSS，禁止行内样式]

## 4. 核心架构模式 (Architectural Patterns)

- **数据获取:** [描述请求链路，如：View -> Store Action -> API Service]
- **异常处理:** [描述全局错误拦截策略]
- **状态管理:** [描述 Store 的拆分与使用规则]

## 5. 最佳实践与禁忌 (Best Practices)

- ✅ **推荐做法 (PREFER):**
  - [例如：使用 Composition API 而不是 Options API]
  - [例如：使用 Lodash-es 按需加载]
- ❌ **禁止/避免 (AVOID):**
  - [例如：禁止在组件中直接调用 axios，必须通过 api 层]
  - [例如：禁止使用 `any` 类型]

## 6. 代码范例 (Golden Snippets)

_(请根据工程代码风格，生成 1-2 个标准的“完美代码骨架”，供 AI 后续参考。例如一个标准的 Vue 组件模板或 Java Service 模板)_
```

# Output Goal

请将生成的Markdown内容存入`/proj-context/PROJECT_CONTEXT.md`文件中。
