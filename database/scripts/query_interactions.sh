#!/bin/bash

# 互动数据查询脚本
# 用途：查看点赞、收藏、评论等互动数据

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

LIMIT=${1:-10}

echo -e "${BLUE}💬 互动数据查询${NC}"
echo "=================================="
echo ""

echo -e "${GREEN}愿望互动统计（TOP $LIMIT）：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    w.id AS wish_id,
    LEFT(w.title, 30) AS title,
    w.likes AS total_likes,
    COUNT(DISTINCT l.id) AS likes_count,
    COUNT(DISTINCT f.id) AS favorites_count,
    COUNT(DISTINCT c.id) AS comments_count
FROM wishes w
LEFT JOIN likes l ON l.wish_id = w.id
LEFT JOIN favorites f ON f.wish_id = w.id
LEFT JOIN comments c ON c.wish_id = w.id
WHERE w.status = 'published'
GROUP BY w.id
ORDER BY w.likes DESC
LIMIT $LIMIT;
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo -e "${GREEN}用户互动统计（TOP $LIMIT）：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT w.id) AS wishes_submitted,
    COUNT(DISTINCT c.id) AS comments_made,
    COUNT(DISTINCT l.id) AS likes_given,
    COUNT(DISTINCT f.id) AS favorites_made
FROM users u
LEFT JOIN wishes w ON w.submitter_id = u.id
LEFT JOIN comments c ON c.author_id = u.id
LEFT JOIN likes l ON l.user_id = u.id
LEFT JOIN favorites f ON f.user_id = u.id
GROUP BY u.id
ORDER BY wishes_submitted DESC, likes_given DESC
LIMIT $LIMIT;
" 2>/dev/null

echo ""
echo -e "${GREEN}最新评论（最近 $LIMIT 条）：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    c.id,
    LEFT(w.title, 30) AS wish_title,
    c.author,
    LEFT(c.content, 50) AS content,
    c.created_at
FROM comments c
LEFT JOIN wishes w ON w.id = c.wish_id
ORDER BY c.created_at DESC
LIMIT $LIMIT;
" 2>/dev/null

echo ""
echo -e "${GREEN}数据一致性检查：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    '点赞数不一致' AS check_type,
    COUNT(*) AS issue_count
FROM (
    SELECT 
        w.id,
        w.likes AS stored_likes,
        COUNT(l.id) AS actual_likes
    FROM wishes w
    LEFT JOIN likes l ON l.wish_id = w.id
    GROUP BY w.id
    HAVING stored_likes != actual_likes
) AS diff;
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ 查询完成${NC}"
echo ""
echo "用法: $0 [LIMIT]"
echo "示例: $0 20  # 查看TOP 20的互动数据"
