#!/bin/bash
# 查看用户列表脚本

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-aiwishlist}

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
SELECT 
    id,
    name,
    email,
    role,
    job,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM users
ORDER BY created_at DESC;
EOF
