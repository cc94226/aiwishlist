#!/bin/bash
# 查看愿望列表脚本

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-aiwishlist}

STATUS=${1:-published}  # 默认查看已发布的愿望

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
SELECT 
    id, 
    title, 
    job, 
    submitter, 
    status, 
    likes, 
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM wishes 
WHERE status = '$STATUS'
ORDER BY likes DESC, created_at DESC
LIMIT 20;
EOF
