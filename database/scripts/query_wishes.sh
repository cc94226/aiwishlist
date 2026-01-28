#!/bin/bash

# 愿望信息查询脚本
# 用途：查看愿望详细信息

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
STATUS=${2:-published}
SORT=${3:-likes}  # likes 或 created_at

echo -e "${BLUE}💡 愿望信息查询${NC}"
echo "=================================="
echo ""

if [ "$SORT" = "likes" ]; then
    ORDER_BY="w.likes DESC"
    SORT_DESC="点赞数"
else
    ORDER_BY="w.created_at DESC"
    SORT_DESC="创建时间"
fi

echo -e "${GREEN}查询状态: $STATUS | 排序: $SORT_DESC | 限制: $LIMIT${NC}"
echo ""

$MYSQL_CMD -e "
SELECT 
    w.id,
    LEFT(w.title, 30) AS title,
    w.job,
    w.submitter,
    w.status,
    w.likes,
    COUNT(DISTINCT c.id) AS comments_count,
    w.created_at
FROM wishes w
LEFT JOIN comments c ON c.wish_id = w.id
WHERE w.status = '$STATUS'
GROUP BY w.id
ORDER BY $ORDER_BY
LIMIT $LIMIT;
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo -e "${GREEN}岗位统计：${NC}"
echo ""
$MYSQL_CMD -e "
SELECT 
    job,
    COUNT(*) AS total_count,
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_count
FROM wishes
GROUP BY job
ORDER BY total_count DESC;
" 2>/dev/null

echo ""
echo -e "${GREEN}✅ 查询完成${NC}"
echo ""
echo "用法: $0 [LIMIT] [STATUS] [SORT]"
echo "示例: $0 20 published likes     # 查看20个已发布愿望，按点赞数排序"
echo "示例: $0 10 draft created_at     # 查看10个草稿愿望，按创建时间排序"
