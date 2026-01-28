#!/bin/bash

# 数据库统计查询脚本
# 用途：快速查看数据库各表的统计信息

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

echo -e "${BLUE}📊 数据库统计信息${NC}"
echo "=================================="
echo ""

# 构建MySQL命令
if [ -z "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER $DB_NAME"
else
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
fi

# 查询各表记录数
echo -e "${GREEN}各表记录数：${NC}"
$MYSQL_CMD -e "
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
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo -e "${GREEN}用户统计：${NC}"
$MYSQL_CMD -e "
SELECT 
    role,
    COUNT(*) AS count
FROM users
GROUP BY role;
" 2>/dev/null

echo ""
echo -e "${GREEN}愿望状态统计：${NC}"
$MYSQL_CMD -e "
SELECT 
    status,
    COUNT(*) AS count
FROM wishes
GROUP BY status;
" 2>/dev/null

echo ""
echo -e "${GREEN}岗位统计（愿望）：${NC}"
$MYSQL_CMD -e "
SELECT 
    job,
    COUNT(*) AS count
FROM wishes
GROUP BY job
ORDER BY count DESC;
" 2>/dev/null

echo ""
echo -e "${GREEN}热门愿望TOP 5：${NC}"
$MYSQL_CMD -e "
SELECT 
    title,
    job,
    submitter,
    likes,
    created_at
FROM wishes
WHERE status = 'published'
ORDER BY likes DESC
LIMIT 5;
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ 统计完成${NC}"
