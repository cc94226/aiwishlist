# 数据库信息文档

本文档提供AI工具需求愿望收集平台的数据库信息，以及如何在命令行中查看和管理数据库数据。

## 📋 目录

- [数据库基本信息](#数据库基本信息)
- [数据库连接配置](#数据库连接配置)
- [表结构说明](#表结构说明)
- [命令行查询脚本](#命令行查询脚本)
- [常用SQL查询命令](#常用sql查询命令)
- [数据库管理脚本](#数据库管理脚本)

---

## 数据库基本信息

### 数据库名称
- **数据库名**: `aiwishlist`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **数据库类型**: MySQL 8.0+

### 数据库表列表

| 表名 | 说明 | 记录数查询 |
|------|------|-----------|
| `users` | 用户表 | `SELECT COUNT(*) FROM users;` |
| `wishes` | 愿望表 | `SELECT COUNT(*) FROM wishes;` |
| `comments` | 评论表 | `SELECT COUNT(*) FROM comments;` |
| `likes` | 点赞表 | `SELECT COUNT(*) FROM likes;` |
| `favorites` | 收藏表 | `SELECT COUNT(*) FROM favorites;` |

---

## 数据库连接配置

### 环境变量配置

数据库连接信息通过环境变量配置，默认值如下：

```bash
DB_HOST=localhost          # 数据库主机地址
DB_PORT=3306              # 数据库端口
DB_USER=root              # 数据库用户名
DB_PASSWORD=              # 数据库密码（需要设置）
DB_NAME=aiwishlist        # 数据库名称
```

### 设置环境变量

**方式1：使用 .env 文件（推荐）**

在 `backend/` 目录下创建 `.env` 文件：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，设置数据库密码等信息
```

**方式2：直接在命令行设置**

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=aiwishlist
```

**方式3：在命令中临时设置**

```bash
DB_PASSWORD=your_password mysql -h localhost -u root aiwishlist
```

---

## 表结构说明

### 1. users（用户表）

存储用户基本信息，包括管理员和普通用户。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | VARCHAR(36) | 用户ID（UUID） | PRIMARY KEY |
| `name` | VARCHAR(100) | 用户姓名 | NOT NULL |
| `email` | VARCHAR(255) | 用户邮箱 | UNIQUE, NOT NULL |
| `password` | VARCHAR(255) | 密码（bcrypt加密） | NOT NULL |
| `role` | ENUM | 用户角色：admin/user | DEFAULT 'user' |
| `job` | ENUM | 用户岗位 | NULL |
| `created_at` | DATETIME | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**岗位枚举值**: `开发`, `设计`, `产品`, `运营`, `行政`, `测试`, `人事`, `财务`

**查询示例**:
```sql
-- 查看所有用户
SELECT id, name, email, role, job, created_at FROM users;

-- 查看管理员用户
SELECT * FROM users WHERE role = 'admin';

-- 查看某个岗位的用户
SELECT * FROM users WHERE job = '开发';
```

### 2. wishes（愿望表）

存储用户提交的愿望信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | VARCHAR(36) | 愿望ID（UUID） | PRIMARY KEY |
| `title` | VARCHAR(200) | 愿望名称 | NOT NULL |
| `description` | TEXT | 需求描述 | NOT NULL |
| `job` | ENUM | 提交者岗位 | NOT NULL |
| `submitter` | VARCHAR(100) | 提交者姓名 | NOT NULL |
| `submitter_id` | VARCHAR(36) | 提交者ID | FOREIGN KEY → users.id |
| `status` | ENUM | 状态：draft/published/archived | DEFAULT 'draft' |
| `likes` | INT | 点赞数（冗余字段） | DEFAULT 0 |
| `created_at` | DATETIME | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**状态枚举值**: 
- `draft`: 草稿
- `published`: 已发布
- `archived`: 已归档

**查询示例**:
```sql
-- 查看所有已发布的愿望
SELECT * FROM wishes WHERE status = 'published' ORDER BY created_at DESC;

-- 查看热门愿望（按点赞数排序）
SELECT title, job, submitter, likes, created_at 
FROM wishes 
WHERE status = 'published' 
ORDER BY likes DESC 
LIMIT 10;

-- 查看某个岗位的愿望
SELECT * FROM wishes WHERE job = '开发' AND status = 'published';
```

### 3. comments（评论表）

存储用户对愿望的评论。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | VARCHAR(36) | 评论ID（UUID） | PRIMARY KEY |
| `wish_id` | VARCHAR(36) | 愿望ID | FOREIGN KEY → wishes.id |
| `author` | VARCHAR(100) | 评论作者 | NOT NULL |
| `author_id` | VARCHAR(36) | 评论作者ID | FOREIGN KEY → users.id |
| `content` | TEXT | 评论内容 | NOT NULL |
| `created_at` | DATETIME | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**查询示例**:
```sql
-- 查看某个愿望的所有评论
SELECT c.*, w.title AS wish_title 
FROM comments c
JOIN wishes w ON c.wish_id = w.id
WHERE c.wish_id = '愿望ID'
ORDER BY c.created_at DESC;

-- 查看某个用户的所有评论
SELECT * FROM comments WHERE author_id = '用户ID';
```

### 4. likes（点赞表）

存储用户对愿望的点赞关系（多对多关系表）。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | VARCHAR(36) | 点赞记录ID（UUID） | PRIMARY KEY |
| `wish_id` | VARCHAR(36) | 愿望ID | FOREIGN KEY → wishes.id |
| `user_id` | VARCHAR(36) | 用户ID | FOREIGN KEY → users.id |
| `created_at` | DATETIME | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

**唯一约束**: (`wish_id`, `user_id`) - 确保每个用户对每个愿望只能点赞一次

**查询示例**:
```sql
-- 查看某个愿望的所有点赞用户
SELECT u.name, u.email, l.created_at 
FROM likes l
JOIN users u ON l.user_id = u.id
WHERE l.wish_id = '愿望ID';

-- 查看某个用户点赞的所有愿望
SELECT w.title, w.job, l.created_at 
FROM likes l
JOIN wishes w ON l.wish_id = w.id
WHERE l.user_id = '用户ID';
```

### 5. favorites（收藏表）

存储用户对愿望的收藏关系（多对多关系表）。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `id` | VARCHAR(36) | 收藏记录ID（UUID） | PRIMARY KEY |
| `wish_id` | VARCHAR(36) | 愿望ID | FOREIGN KEY → wishes.id |
| `user_id` | VARCHAR(36) | 用户ID | FOREIGN KEY → users.id |
| `created_at` | DATETIME | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

**唯一约束**: (`wish_id`, `user_id`) - 确保每个用户对每个愿望只能收藏一次

**查询示例**:
```sql
-- 查看某个用户的收藏列表
SELECT w.title, w.job, w.description, f.created_at 
FROM favorites f
JOIN wishes w ON f.wish_id = w.id
WHERE f.user_id = '用户ID'
ORDER BY f.created_at DESC;
```

---

## 命令行查询脚本

项目提供了多个便捷的Shell脚本，用于快速查询数据库信息。

### 脚本位置

所有脚本位于 `database/scripts/` 目录下：

- `query_users.sh` - 查询用户信息
- `query_stats.sh` - 查询数据库统计信息
- `query_wishes.sh` - 查询愿望信息
- `query_interactions.sh` - 查询互动数据
- `backup.sh` - 数据库备份和恢复

### 使用前准备

1. **设置脚本执行权限**:
```bash
chmod +x database/scripts/*.sh
```

2. **配置数据库连接信息**（设置环境变量或使用 .env 文件）

### 1. query_users.sh - 用户信息查询脚本

**功能**: 查看用户详细信息和统计

**用法**:
```bash
# 查看最近10个用户（默认）
./database/scripts/query_users.sh

# 查看最近20个用户
./database/scripts/query_users.sh 20

# 查看所有管理员用户
./database/scripts/query_users.sh 10 admin

# 查看所有普通用户
./database/scripts/query_users.sh 10 user
```

**输出内容**:
- 用户基本信息（ID、姓名、邮箱、角色、岗位、创建时间）
- 用户统计信息（愿望数、评论数、点赞数、收藏数）

**示例输出**:
```
👥 用户信息查询
==================================

所有用户（最近 10 条）：
+--------------------------------------+--------+-------------------+--------+--------+---------------------+
| id                                   | name   | email             | role   | job    | created_at          |
+--------------------------------------+--------+-------------------+--------+--------+---------------------+
| 00000000-0000-0000-0000-000000000001 | 管理员 | admin@example.com | admin  | 开发   | 2026-01-28 10:00:00 |
+--------------------------------------+--------+-------------------+--------+--------+---------------------+

用户统计（包含互动数据）：
+--------------------------------------+--------+-------------------+--------+--------+---------------+----------------+-------------+----------------+
| id                                   | name   | email             | role   | job    | wishes_count | comments_count | likes_given | favorites_count |
+--------------------------------------+--------+-------------------+--------+--------+---------------+----------------+-------------+----------------+
```

### 2. query_stats.sh - 数据库统计查询脚本

**功能**: 快速查看数据库各表的统计信息

**用法**:
```bash
./database/scripts/query_stats.sh
```

**输出内容**:
- 各表记录数统计
- 用户角色统计
- 愿望状态统计
- 岗位统计（愿望）
- 热门愿望TOP 5

**示例输出**:
```
📊 数据库统计信息
==================================

各表记录数：
+------------+-------+
| table_name | count |
+------------+-------+
| users      |    10 |
| wishes     |    25 |
| comments   |    50 |
| likes      |    30 |
| favorites  |    15 |
+------------+-------+

用户统计：
+-------+-------+
| role  | count |
+-------+-------+
| admin |     1 |
| user  |     9 |
+-------+-------+

愿望状态统计：
+-----------+-------+
| status    | count |
+-----------+-------+
| draft     |     5 |
| published |    18 |
| archived  |     2 |
+-----------+-------+

热门愿望TOP 5：
+------------------+--------+-----------+-------+---------------------+
| title            | job    | submitter | likes | created_at          |
+------------------+--------+-----------+-------+---------------------+
| AI代码生成工具   | 开发   | 张三      |    15 | 2026-01-28 10:00:00 |
+------------------+--------+-----------+-------+---------------------+
```

### 3. backup.sh - 数据库备份和恢复脚本

**功能**: 数据库备份、恢复、清理等管理操作

**用法**:
```bash
# 备份数据库
./database/scripts/backup.sh backup [备份文件名（可选）]

# 恢复数据库
./database/scripts/backup.sh restore <备份文件路径>

# 列出所有备份文件
./database/scripts/backup.sh list

# 清理旧备份（默认保留7天）
./database/scripts/backup.sh clean [保留天数]
```

**示例**:
```bash
# 创建备份
./database/scripts/backup.sh backup

# 创建指定名称的备份
./database/scripts/backup.sh backup my_backup_20260128

# 恢复备份
./database/scripts/backup.sh restore backups/aiwishlist_20260128_120000.sql.gz

# 列出所有备份
./database/scripts/backup.sh list

# 清理7天前的备份
./database/scripts/backup.sh clean 7
```

### 4. query_wishes.sh - 愿望信息查询脚本

**功能**: 查看愿望详细信息和统计

**用法**:
```bash
# 查看最近10个已发布的愿望（按点赞数排序，默认）
./database/scripts/query_wishes.sh

# 查看20个已发布的愿望（按点赞数排序）
./database/scripts/query_wishes.sh 20 published likes

# 查看10个草稿愿望（按创建时间排序）
./database/scripts/query_wishes.sh 10 draft created_at

# 查看所有已归档的愿望
./database/scripts/query_wishes.sh 50 archived likes
```

**参数说明**:
- `LIMIT`: 显示的愿望数量（默认：10）
- `STATUS`: 筛选状态（默认：published，可选：draft、published、archived）
- `SORT`: 排序方式（默认：likes，可选：likes 或 created_at）

**输出内容**:
- 愿望基本信息（ID、标题、岗位、提交者、状态、点赞数、评论数、创建时间）
- 岗位统计（各岗位的愿望总数、已发布数、草稿数、已归档数）

**示例输出**:
```
💡 愿望信息查询
==================================

查询状态: published | 排序: 点赞数 | 限制: 10

+--------------------------------------+------------------------------+--------+-----------+--------+-------+----------------+---------------------+
| id                                   | title                        | job    | submitter | status | likes | comments_count | created_at          |
+--------------------------------------+------------------------------+--------+-----------+--------+-------+----------------+---------------------+
| 00000000-0000-0000-0000-000000000001 | AI代码生成工具               | 开发   | 张三      | published | 15 | 5 | 2026-01-28 10:00:00 |
+--------------------------------------+------------------------------+--------+-----------+--------+-------+----------------+---------------------+

岗位统计：
+--------+-------------+----------------+------------+---------------+
| job    | total_count | published_count | draft_count | archived_count |
+--------+-------------+----------------+------------+---------------+
| 开发   | 10          | 8              | 1          | 1             |
+--------+-------------+----------------+------------+---------------+
```

### 5. query_interactions.sh - 互动数据查询脚本

**功能**: 查看点赞、收藏、评论等互动数据

**用法**:
```bash
# 查看TOP 10的互动数据（默认）
./database/scripts/query_interactions.sh

# 查看TOP 20的互动数据
./database/scripts/query_interactions.sh 20
```

**参数说明**:
- `LIMIT`: 显示的数据数量（默认：10）

**输出内容**:
- 愿望互动统计（愿望ID、标题、点赞数、收藏数、评论数）
- 用户互动统计（用户ID、姓名、邮箱、提交的愿望数、评论数、点赞数、收藏数）
- 最新评论（评论ID、愿望标题、作者、内容、创建时间）
- 数据一致性检查（检查点赞数是否一致）

**示例输出**:
```
💬 互动数据查询
==================================

愿望互动统计（TOP 10）：
+--------------------------------------+------------------------------+-------------+------------------+----------------+
| wish_id                              | title                        | total_likes | favorites_count | comments_count |
+--------------------------------------+------------------------------+-------------+------------------+----------------+
| 00000000-0000-0000-0000-000000000001 | AI代码生成工具               | 15          | 8                | 5              |
+--------------------------------------+------------------------------+-------------+------------------+----------------+

用户互动统计（TOP 10）：
+--------------------------------------+--------+-------------------+---------------+----------------+-------------+----------------+
| id                                   | name   | email             | wishes_submitted | comments_made | likes_given | favorites_made |
+--------------------------------------+--------+-------------------+---------------+----------------+-------------+----------------+
| 00000000-0000-0000-0000-000000000001 | 管理员 | admin@example.com | 5              | 10            | 20          | 8              |
+--------------------------------------+--------+-------------------+---------------+----------------+-------------+----------------+

最新评论（最近 10 条）：
+--------------------------------------+------------------------------+--------+--------------------------------------------------+---------------------+
| id                                   | wish_title                   | author | content                                          | created_at          |
+--------------------------------------+------------------------------+--------+--------------------------------------------------+---------------------+
| 00000000-0000-0000-0000-000000000001 | AI代码生成工具               | 张三   | 这个工具很有用！                                 | 2026-01-28 10:00:00 |
+--------------------------------------+------------------------------+--------+--------------------------------------------------+---------------------+

数据一致性检查：
+------------------+-------------+
| check_type       | issue_count |
+------------------+-------------+
| 点赞数不一致     | 0           |
+------------------+-------------+
```

### 脚本使用技巧

1. **组合使用环境变量**:
   ```bash
   # 一次性设置所有环境变量并运行脚本
   DB_HOST=localhost DB_USER=root DB_PASSWORD=pass DB_NAME=aiwishlist ./database/scripts/query_stats.sh
   ```

2. **将输出保存到文件**:
   ```bash
   ./database/scripts/query_stats.sh > stats.txt
   ./database/scripts/query_users.sh 50 > users.txt
   ```

3. **在脚本中使用管道**:
   ```bash
   # 只查看用户数量
   ./database/scripts/query_stats.sh | grep "users"
   
   # 查看热门愿望标题
   ./database/scripts/query_stats.sh | grep -A 5 "热门愿望"
   ```

4. **定时执行**:
   ```bash
   # 使用cron定时执行统计脚本
   # 编辑crontab: crontab -e
   # 添加：0 9 * * * /path/to/database/scripts/query_stats.sh >> /path/to/logs/stats.log
   ```

### 故障排查

如果脚本执行失败，请检查：

1. **MySQL客户端是否安装**:
   ```bash
   which mysql
   # 如果未安装，请安装MySQL客户端
   # macOS: brew install mysql-client
   # Ubuntu: sudo apt-get install mysql-client
   ```

2. **数据库连接信息是否正确**:
   ```bash
   # 测试数据库连接
   mysql -h localhost -u root -p aiwishlist -e "SELECT 1;"
   ```

3. **脚本权限**:
   ```bash
   # 确保脚本有执行权限
   chmod +x database/scripts/*.sh
   ```

4. **数据库是否存在**:
   ```bash
   mysql -h localhost -u root -p -e "SHOW DATABASES LIKE 'aiwishlist';"
   ```

---

## 常用SQL查询命令

### 快速统计查询

```sql
-- 查看数据库基本信息
SELECT DATABASE() AS current_database;
SELECT VERSION() AS mysql_version;

-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESCRIBE users;
DESCRIBE wishes;
DESCRIBE comments;
DESCRIBE likes;
DESCRIBE favorites;

-- 查看表记录数
SELECT 
    'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'wishes', COUNT(*) FROM wishes
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'likes', COUNT(*) FROM likes
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites;
```

### 用户相关查询

```sql
-- 查看所有用户（不包含密码）
SELECT id, name, email, role, job, created_at FROM users;

-- 查看管理员用户
SELECT * FROM users WHERE role = 'admin';

-- 查看某个岗位的用户
SELECT * FROM users WHERE job = '开发';

-- 查看用户及其提交的愿望数
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(w.id) AS wishes_count
FROM users u
LEFT JOIN wishes w ON w.submitter_id = u.id
GROUP BY u.id
ORDER BY wishes_count DESC;
```

### 愿望相关查询

```sql
-- 查看所有已发布的愿望
SELECT * FROM wishes WHERE status = 'published' ORDER BY created_at DESC;

-- 查看热门愿望（按点赞数排序）
SELECT 
    id,
    title,
    job,
    submitter,
    likes,
    created_at
FROM wishes
WHERE status = 'published'
ORDER BY likes DESC
LIMIT 10;

-- 查看某个岗位的愿望
SELECT * FROM wishes WHERE job = '开发' AND status = 'published';

-- 查看某个用户的愿望
SELECT * FROM wishes WHERE submitter_id = '用户ID';

-- 查看愿望及其评论数
SELECT 
    w.id,
    w.title,
    w.likes,
    COUNT(c.id) AS comments_count
FROM wishes w
LEFT JOIN comments c ON c.wish_id = w.id
WHERE w.status = 'published'
GROUP BY w.id
ORDER BY w.likes DESC;
```

### 互动数据查询

```sql
-- 查看某个愿望的所有评论
SELECT 
    c.id,
    c.author,
    c.content,
    c.created_at
FROM comments c
WHERE c.wish_id = '愿望ID'
ORDER BY c.created_at DESC;

-- 查看某个用户的所有评论
SELECT 
    c.id,
    w.title AS wish_title,
    c.content,
    c.created_at
FROM comments c
JOIN wishes w ON c.wish_id = w.id
WHERE c.author_id = '用户ID'
ORDER BY c.created_at DESC;

-- 查看某个用户的收藏列表
SELECT 
    w.id,
    w.title,
    w.job,
    w.description,
    f.created_at AS favorited_at
FROM favorites f
JOIN wishes w ON f.wish_id = w.id
WHERE f.user_id = '用户ID'
ORDER BY f.created_at DESC;

-- 查看某个愿望的点赞用户
SELECT 
    u.name,
    u.email,
    l.created_at
FROM likes l
JOIN users u ON l.user_id = u.id
WHERE l.wish_id = '愿望ID';
```

### 统计分析查询

```sql
-- 用户统计（包含互动数据）
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT w.id) AS wishes_count,
    COUNT(DISTINCT c.id) AS comments_count,
    COUNT(DISTINCT l.id) AS likes_given,
    COUNT(DISTINCT f.id) AS favorites_count
FROM users u
LEFT JOIN wishes w ON w.submitter_id = u.id
LEFT JOIN comments c ON c.author_id = u.id
LEFT JOIN likes l ON l.user_id = u.id
LEFT JOIN favorites f ON f.user_id = u.id
GROUP BY u.id
ORDER BY wishes_count DESC;

-- 愿望状态统计
SELECT 
    status,
    COUNT(*) AS count
FROM wishes
GROUP BY status;

-- 岗位统计（愿望）
SELECT 
    job,
    COUNT(*) AS count
FROM wishes
WHERE status = 'published'
GROUP BY job
ORDER BY count DESC;

-- 热门愿望TOP 10
SELECT 
    title,
    job,
    submitter,
    likes,
    (SELECT COUNT(*) FROM comments WHERE wish_id = w.id) AS comments_count,
    created_at
FROM wishes w
WHERE status = 'published'
ORDER BY likes DESC
LIMIT 10;
```

---

## 数据库管理脚本

### 直接使用MySQL客户端

**连接数据库**:
```bash
# 方式1：使用环境变量
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME

# 方式2：直接指定参数
mysql -h localhost -P 3306 -u root -p aiwishlist

# 方式3：交互式输入密码（更安全）
mysql -h localhost -u root -p aiwishlist
```

**执行SQL文件**:
```bash
# 执行迁移文件
mysql -h localhost -u root -p aiwishlist < database/migrations/001_create_tables.sql

# 执行SQL查询文件
mysql -h localhost -u root -p aiwishlist < query.sql
```

**在MySQL命令行中执行查询**:
```bash
mysql -h localhost -u root -p aiwishlist -e "SELECT COUNT(*) FROM users;"
```

### 使用项目提供的脚本

所有脚本都支持通过环境变量配置数据库连接信息，也可以直接在脚本中修改默认值。

**设置环境变量后使用**:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=aiwishlist

# 然后直接运行脚本
./database/scripts/query_stats.sh
```

---

## 快速参考

### 常用命令速查

```bash
# 1. 查看数据库统计信息
./database/scripts/query_stats.sh

# 2. 查看用户信息
./database/scripts/query_users.sh 20

# 3. 备份数据库
./database/scripts/backup.sh backup

# 4. 恢复数据库
./database/scripts/backup.sh restore backups/aiwishlist_20260128_120000.sql.gz

# 5. 直接连接数据库
mysql -h localhost -u root -p aiwishlist

# 6. 执行SQL查询
mysql -h localhost -u root -p aiwishlist -e "SELECT COUNT(*) FROM wishes;"
```

### 环境变量速查

```bash
# 设置数据库连接信息
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=aiwishlist

# 设置备份目录（可选）
export BACKUP_DIR=/path/to/backups
export RETENTION_DAYS=7
```

---

## 注意事项

1. **密码安全**: 
   - 不要在命令行中直接暴露密码（使用 `-p` 参数会提示输入密码）
   - 建议使用 `.env` 文件存储敏感信息，并确保 `.env` 文件已添加到 `.gitignore`

2. **权限问题**:
   - 确保数据库用户有足够的权限执行查询操作
   - 备份和恢复操作需要相应的数据库权限

3. **字符编码**:
   - 数据库使用 `utf8mb4` 字符集，支持emoji和特殊字符
   - 确保MySQL客户端也使用正确的字符集

4. **触发器**:
   - `wishes` 表的 `likes` 字段由触发器自动维护
   - 直接修改 `likes` 表时，`wishes.likes` 会自动更新

5. **外键约束**:
   - 删除用户时，相关的外键字段会设置为 NULL（ON DELETE SET NULL）
   - 删除愿望时，相关的评论、点赞、收藏会自动删除（ON DELETE CASCADE）

---

## 故障排查

### 连接失败

```bash
# 检查MySQL服务是否运行
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# 检查端口是否开放
netstat -an | grep 3306

# 测试连接
mysql -h localhost -u root -p -e "SELECT 1;"
```

### 权限问题

```bash
# 检查用户权限
mysql -u root -p -e "SHOW GRANTS FOR 'your_user'@'localhost';"

# 授予权限（示例）
mysql -u root -p -e "GRANT ALL PRIVILEGES ON aiwishlist.* TO 'your_user'@'localhost';"
```

### 脚本执行失败

```bash
# 检查脚本权限
ls -l database/scripts/*.sh

# 添加执行权限
chmod +x database/scripts/*.sh

# 检查脚本语法
bash -n database/scripts/query_stats.sh
```

---

## 更多信息

- 数据库迁移文件: `database/migrations/001_create_tables.sql`
- 数据库配置: `backend/src/config/database.ts`
- 环境变量示例: `backend/.env.example`
- 项目运行文档: `howtorun.md`

---

**最后更新**: 2026-01-28
