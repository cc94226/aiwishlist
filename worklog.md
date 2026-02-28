2026-02-27 修复 pre-push ESLint 报错 - 清理后端中间件与模型的未使用变量、前端 Favorites 组件未使用导入，并通过 npm run lint - backend/src/middleware/errorHandler.ts, backend/src/middleware/auth.ts, backend/src/models/User.ts, backend/src/services/AuthService.ts, src/components/Favorites.vue
2026-02-27 配置 Cloudflare 部署 - 添加 wrangler.jsonc、在 package.json 中新增 deploy 与 preview:cf 脚本并引入 wrangler 作为开发依赖，避免远程部署时重复交互与依赖冲突 - package.json, wrangler.jsonc, proj-context/PROJECT_CONTEXT.md
2026-02-28 同步 package-lock.json - 本地执行 npm install 将 wrangler 及传递依赖写入 lock 文件，使 CI 的 npm ci 与 package.json 一致 - package-lock.json
2026-02-28 修复 lint-staged 提交失败 - 移除 _.{ts,tsx} 通配，仅保留 backend/src/\*\*/_.{ts,tsx}，避免对 node_modules 内 ts 文件执行 prettier 导致 No matching files - package.json
