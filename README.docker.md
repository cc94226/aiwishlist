# Docker部署指南

## 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

## 快速开始

### 1. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件，设置数据库密码、JWT密钥等配置。

### 2. 启动服务

#### 生产环境

```bash
docker-compose up -d
```

#### 开发环境

```bash
docker-compose -f docker-compose.dev.yml up
```

### 3. 查看服务状态

```bash
docker-compose ps
```

### 4. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 5. 停止服务

```bash
docker-compose down
```

### 6. 清理数据（谨慎操作）

```bash
# 停止并删除容器、网络和卷
docker-compose down -v
```

## 服务说明

### MySQL数据库

- 端口: 3306
- 数据持久化: `mysql_data` volume
- 初始化脚本: `database/migrations/001_create_tables.sql`

### 后端API服务

- 端口: 3001
- 健康检查: http://localhost:3001/health
- 日志目录: `backend/logs`

### 前端Web服务

- 端口: 3000 (生产环境) / 5173 (开发环境)
- 静态文件: nginx服务
- API代理: `/api` 路径代理到后端服务

## 数据库操作

### 备份数据库

```bash
# 进入MySQL容器
docker-compose exec mysql bash

# 执行备份脚本
./database/scripts/backup.sh backup
```

### 恢复数据库

```bash
./database/scripts/backup.sh restore <backup_file.sql.gz>
```

## 构建镜像

### 构建所有镜像

```bash
docker-compose build
```

### 构建特定服务

```bash
docker-compose build backend
docker-compose build frontend
```

## 环境变量

主要环境变量说明：

- `DB_PASSWORD`: 数据库root密码
- `DB_NAME`: 数据库名称
- `JWT_SECRET`: JWT密钥（生产环境必须修改）
- `NODE_ENV`: 环境模式（production/development）
- `PORT`: 后端服务端口
- `FRONTEND_PORT`: 前端服务端口

## 故障排查

### 查看容器日志

```bash
docker-compose logs backend
```

### 进入容器调试

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入MySQL容器
docker-compose exec mysql bash
```

### 重启服务

```bash
docker-compose restart backend
```

### 重建服务

```bash
docker-compose up -d --build backend
```

## 生产环境部署建议

1. **修改默认密码**: 确保修改所有默认密码和密钥
2. **配置HTTPS**: 使用nginx反向代理配置SSL证书
3. **数据备份**: 定期备份数据库
4. **监控告警**: 配置日志监控和告警
5. **资源限制**: 在docker-compose.yml中配置资源限制
6. **网络安全**: 配置防火墙规则，只开放必要端口
