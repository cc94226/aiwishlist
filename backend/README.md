# 后端服务

AI工具需求愿望收集平台的后端服务，基于 Node.js + Express + TypeScript。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4.x
- **语言**: TypeScript 5.x
- **构建工具**: TypeScript Compiler (tsc)

## 快速开始

### 安装依赖

```bash
cd backend
npm install
```

### 开发模式

```bash
npm run dev
```

使用 `tsx watch` 自动重新编译和重启服务。

### 构建

```bash
npm run build
```

### 生产模式

```bash
npm start
```

## 项目结构

```
backend/
├── src/              # 源代码目录
│   ├── index.ts      # 应用入口文件
│   ├── config/       # 配置文件
│   ├── controllers/  # 控制器层
│   ├── services/     # 服务层
│   ├── models/       # 数据模型层
│   ├── middleware/   # 中间件
│   └── routes/       # 路由定义
├── dist/             # 编译输出目录
├── package.json      # 项目配置
└── tsconfig.json     # TypeScript配置
```

## API端点

- `GET /health` - 健康检查
- `GET /api` - API信息

## 环境变量

创建 `.env` 文件：

```env
PORT=3001
NODE_ENV=development
```
