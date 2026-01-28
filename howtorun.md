# 如何运行和使用 AI 工具需求愿望收集平台

## 📋 项目简介

AI工具需求愿望收集平台是一个全岗位AI工具需求收集和分享平台。用户可以按职业分类浏览愿望、提交新愿望、点赞收藏、评论互动，管理员可以管理所有愿望。

## 🛠️ 环境要求

### 前端开发环境

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 后端开发环境（可选，如需使用后端API）

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 7.0（可选，用于缓存）

### Docker部署（推荐）

- Docker >= 20.10
- Docker Compose >= 2.0

## 🚀 快速开始

### 方式一：仅前端运行（使用localStorage，无需后端）

这是最简单的运行方式，适合快速体验功能。

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务器

```bash
npm run dev
```

#### 3. 访问应用

打开浏览器访问：`http://localhost:5173`

#### 4. 默认账户

系统会自动初始化一个默认管理员账户：

- **邮箱**: `admin@example.com`
- **密码**: `admin123`

### 方式二：完整前后端运行（使用MySQL数据库）

#### 1. 配置数据库

确保MySQL服务已启动，创建数据库：

```sql
CREATE DATABASE aiwishlist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. 初始化数据库表结构

执行数据库迁移脚本：

```bash
mysql -u root -p aiwishlist < database/migrations/001_create_tables.sql
```

#### 3. 配置后端环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件，设置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=aiwishlist
PORT=3001
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

#### 4. 安装后端依赖

```bash
cd backend
npm install
```

#### 5. 启动后端服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

后端服务将在 `http://localhost:3001` 启动。

#### 6. 启动前端服务

在项目根目录：

```bash
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

### 方式三：Docker部署（推荐生产环境）

#### 1. 配置环境变量

创建 `.env` 文件（可选，使用默认值）：

```env
DB_PASSWORD=your_secure_password
DB_NAME=aiwishlist
DB_USER=appuser
JWT_SECRET=your_jwt_secret_change_in_production
BACKEND_PORT=3001
FRONTEND_PORT=80
```

#### 2. 启动所有服务

```bash
docker-compose up -d
```

#### 3. 查看服务状态

```bash
docker-compose ps
```

#### 4. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

#### 5. 停止服务

```bash
docker-compose down
```

更多Docker部署详情请参考 `README.docker.md`。

## 📖 功能使用指南

### 1. 用户注册和登录

#### 注册新用户

1. 点击导航栏的"注册"链接
2. 填写注册信息：
   - 姓名（必填）
   - 邮箱（必填，用于登录）
   - 密码（必填，至少6位）
   - 确认密码（必填）
   - 岗位（可选，用于岗位匹配）
3. 点击"注册"按钮

#### 登录

1. 点击导航栏的"登录"链接
2. 输入邮箱和密码
3. 可选择"记住我"选项
4. 点击"登录"按钮

**默认管理员账户**：

- 邮箱：`admin@example.com`
- 密码：`admin123`

### 2. 浏览愿望列表

#### 访问首页

访问 `http://localhost:5173` 或点击导航栏的"首页"链接。

#### 功能说明

- **岗位筛选**：点击岗位下拉框，选择特定岗位查看该岗位的愿望
- **排序方式**：
  - 最新：按创建时间降序
  - 最旧：按创建时间升序
  - 点赞数：按点赞数降序
- **愿望卡片**：显示愿望标题、描述、提交者、岗位、日期、点赞数、评论数
- **查看详情**：点击愿望卡片或"查看详情"按钮

### 3. 提交新愿望

#### 访问提交页面

1. 点击导航栏的"提交愿望"链接
2. 或访问 `http://localhost:5173/submit`

#### 填写愿望信息

- **愿望名称**（必填）：愿望的标题
- **需求描述**（必填）：详细描述你的需求
- **提交者岗位**（必填）：选择你的岗位类型
- **提交者姓名**（必填）：你的姓名

#### 提交选项

- **保存为草稿**：保存但不发布，只有你自己和管理员可以看到
- **提交愿望**：正式发布愿望，所有用户都可以看到

#### 权限说明

- 普通用户只能编辑或删除自己创建的**草稿状态**的愿望
- 管理员可以编辑、下架、删除所有愿望

### 4. 查看愿望详情

#### 访问详情页

点击愿望卡片或"查看详情"按钮。

#### 功能说明

- **愿望信息**：显示完整的愿望信息（标题、描述、提交者、岗位、日期、状态）
- **岗位匹配分析**：如果已登录并设置了岗位，会显示匹配度分析
  - 高度匹配（90%+）：绿色显示
  - 中度匹配（70%+）：黄色显示
  - 低度匹配（50%+）：橙色显示
  - 不匹配（<50%）：灰色显示
- **点赞功能**：点击"点赞"按钮为愿望点赞（需要登录）
- **收藏功能**：点击"收藏"按钮收藏愿望（需要登录）
- **评论功能**：
  - 在评论框输入评论内容
  - 点击"发表评论"按钮
  - 可以查看所有评论列表
  - 可以编辑或删除自己的评论（需要登录）
- **编辑/删除**：根据权限显示编辑和删除按钮

### 5. 个人中心

#### 访问个人中心

1. 登录后点击导航栏的"用户信息"链接
2. 或访问 `http://localhost:5173/profile`

#### 功能说明

- **个人信息**：查看和编辑个人信息
  - 姓名
  - 邮箱
  - 岗位（用于岗位匹配分析）
- **退出登录**：点击"退出"按钮

### 6. 用户仪表板

#### 访问仪表板

1. 登录后点击导航栏的"仪表板"链接
2. 或访问 `http://localhost:5173/dashboard`

#### 功能说明

- **统计信息**：
  - 我提交的愿望数量
  - 我收藏的愿望数量
  - 我获得的点赞总数
  - 我收到的评论总数
- **我的愿望列表**：显示最近10个提交的愿望
- **收藏的愿望列表**：显示最近10个收藏的愿望
- **快速操作**：快速链接到常用功能

### 7. 管理员面板

#### 访问管理员面板

1. 使用管理员账户登录
2. 点击导航栏的"管理面板"链接
3. 或访问 `http://localhost:5173/admin`

#### 功能说明

- **愿望管理**：
  - 查看所有愿望（包括草稿、已发布、已下架）
  - 编辑任何愿望
  - 下架愿望（将已发布改为已下架）
  - 删除任何愿望
- **权限说明**：
  - 管理员可以操作所有愿望
  - 普通用户只能编辑/删除自己的草稿

## 🔧 开发命令

### 前端命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 运行测试（UI模式）
npm run test:ui

# 运行测试（覆盖率）
npm run test:coverage

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 后端命令

```bash
cd backend

# 启动开发服务器（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 运行测试（覆盖率）
npm run test:coverage

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 📁 项目结构

```
aiwishlist/
├── src/                    # 前端源代码
│   ├── components/         # Vue组件
│   ├── views/              # 页面视图
│   ├── router/             # 路由配置
│   ├── services/           # 业务服务
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── backend/                # 后端源代码
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由定义
│   │   └── config/         # 配置文件
│   └── tests/              # 测试文件
├── database/               # 数据库相关
│   ├── migrations/         # 数据库迁移脚本
│   └── scripts/            # 数据库脚本
├── shared/                 # 共享类型定义
│   └── types/              # TypeScript类型
└── docker-compose.yml      # Docker配置
```

## 🔐 默认账户

### 管理员账户（自动初始化）

- **邮箱**: `admin@example.com`
- **密码**: `admin123`
- **角色**: 管理员
- **权限**: 可以管理所有愿望

### 创建新管理员

如果需要创建新的管理员账户，可以通过以下方式：

1. **使用注册功能**：注册后手动修改数据库中的角色字段为 `admin`
2. **直接操作数据库**：在MySQL中执行：

```sql
INSERT INTO users (id, name, email, password, role, job_type, created_at, updated_at)
VALUES (
  UUID(),
  '管理员姓名',
  'admin@example.com',
  '$2b$10$...', -- bcrypt加密后的密码
  'admin',
  'developer',
  NOW(),
  NOW()
);
```

## 🐛 常见问题

### 1. 前端无法启动

**问题**: `npm run dev` 报错

**解决方案**:

- 确保Node.js版本 >= 18.0.0
- 删除 `node_modules` 和 `package-lock.json`，重新安装：
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 2. 后端无法连接数据库

**问题**: 后端启动时报数据库连接错误

**解决方案**:

- 检查MySQL服务是否启动
- 检查 `backend/.env` 文件中的数据库配置是否正确
- 确保数据库已创建：`CREATE DATABASE aiwishlist;`
- 确保已执行数据库迁移脚本

### 3. Docker容器无法启动

**问题**: `docker-compose up` 失败

**解决方案**:

- 检查Docker和Docker Compose版本是否符合要求
- 检查端口是否被占用（3306, 3001, 80）
- 查看容器日志：`docker-compose logs`
- 尝试重建容器：`docker-compose up -d --build`

### 4. 登录后无法访问管理面板

**问题**: 提示权限不足

**解决方案**:

- 确保使用管理员账户登录（`admin@example.com` / `admin123`）
- 检查用户角色是否为 `admin`
- 清除浏览器缓存和localStorage，重新登录

### 5. 愿望列表为空

**问题**: 首页没有显示愿望

**解决方案**:

- 检查是否有初始数据（使用localStorage模式会自动初始化示例数据）
- 如果使用后端API，检查数据库是否有数据
- 检查筛选条件是否过于严格

### 6. 岗位匹配分析不显示

**问题**: 愿望详情页没有显示匹配度

**解决方案**:

- 确保已登录
- 在个人中心设置你的岗位信息
- 确保愿望的岗位字段不为空

## 📝 API文档（后端）

如果使用后端API，主要API端点如下：

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）
- `PUT /api/auth/profile` - 更新用户信息（需要认证）
- `PUT /api/auth/password` - 修改密码（需要认证）

### 愿望相关

- `GET /api/wishes` - 获取愿望列表（支持分页、筛选、排序）
- `GET /api/wishes/:id` - 获取愿望详情
- `POST /api/wishes` - 创建新愿望（需要认证）
- `PUT /api/wishes/:id` - 更新愿望（需要认证）
- `DELETE /api/wishes/:id` - 删除愿望（需要认证）
- `POST /api/wishes/:id/publish` - 发布愿望（需要认证）
- `POST /api/wishes/:id/archive` - 下架愿望（需要管理员权限）

### 互动相关

- `POST /api/interactions/like` - 点赞愿望（需要认证）
- `POST /api/interactions/unlike` - 取消点赞（需要认证）
- `POST /api/interactions/favorite` - 收藏愿望（需要认证）
- `POST /api/interactions/unfavorite` - 取消收藏（需要认证）
- `POST /api/interactions/comments` - 创建评论（需要认证）
- `PUT /api/interactions/comments/:id` - 更新评论（需要认证）
- `DELETE /api/interactions/comments/:id` - 删除评论（需要认证）

### 个人中心相关

- `GET /api/profile/me` - 获取当前用户资料（需要认证）
- `GET /api/profile/:userId` - 获取指定用户资料（需要认证）
- `GET /api/profile/:userId/wishes` - 获取用户愿望列表（需要认证）
- `GET /api/profile/:userId/favorites` - 获取用户收藏列表（需要认证）

详细API文档请参考后端代码中的控制器和路由定义。

## 🎯 下一步

- 查看 `README.docker.md` 了解Docker部署详情
- 查看 `database/scripts/backup.sh` 了解数据库备份和恢复
- 查看后端测试文件了解API使用示例
- 查看前端组件代码了解功能实现细节

## 📞 获取帮助

如果遇到问题，请：

1. 查看本文档的"常见问题"部分
2. 查看项目代码注释
3. 查看Git提交历史了解功能实现
4. 检查浏览器控制台和服务器日志

---

**祝使用愉快！** 🎉
