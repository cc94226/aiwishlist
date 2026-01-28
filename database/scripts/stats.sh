#!/bin/bash
# 数据库统计信息查看脚本

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-aiwishlist}

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
SELECT 
    '用户总数' as '统计项',
    COUNT(*) as '数量'
FROM users
UNION ALL
SELECT 
    '愿望总数',
    COUNT(*)
FROM wishes
UNION ALL
SELECT 
    '已发布愿望',
    COUNT(*)
FROM wishes
WHERE status = 'published'
UNION ALL
SELECT 
    '评论总数',
    COUNT(*)
FROM comments
UNION ALL
SELECT 
    '点赞总数',
    COUNT(*)
FROM likes
UNION ALL
SELECT 
    '收藏总数',
    COUNT(*)
FROM favorites;
EOF
