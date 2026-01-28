#!/bin/bash

# 用户信息查询脚本
# 用途：查看用户详细信息

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 从环境变量或默认值获取数据库配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-aiwishlist}

# 检查MySQL客户端是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL客户端未安装，请先安装MySQL客户端"
    exit 1
fi

# 构建MySQL命令
if [ -z "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER $DB_NAME"
else
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
fi

# 解析命令行参数
LIMIT=${1:-10}
ROLE=${2:-}

echo -e "${BLUE}👥 用户信息查询${NC}"
echo "=================================="
echo ""

if [ -n "$ROLE" ]; then
    echo -e "${GREEN}查询角色: $ROLE${NC}"
    echo ""
    $MYSQL_CMD -e "
    SELECT 
        id,
        name,
        email,
        role,
        job,
        created_at
    FROM users
    WHERE role = '$ROLE'
    ORDER BY created_at DESC
    LIMIT $LIMIT;
    " 2>/dev/null
else
    echo -e "${GREEN}所有用户（最近 $LIMIT 条）：${NC}"
    echo ""
    $MYSQL_CMD -e "
    SELECT 
        id,
        name,
        email,
        role,
        job,
        created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $LIMIT;
    " 2>/dev/null
fi

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo -e "${GREEN}用户统计（包含互动数据）：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.job,
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
ORDER BY wishes_count DESC
LIMIT 10;
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ 查询完成${NC}"
echo ""
echo "用法: $0 [LIMIT] [ROLE]"
echo "示例: $0 20 admin  # 查看最近20个管理员用户"
