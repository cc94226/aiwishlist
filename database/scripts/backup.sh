#!/bin/bash

# 数据库备份和恢复脚本
# 用于备份和恢复MySQL数据库

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
elif [ -f backend/.env ]; then
  export $(cat backend/.env | grep -v '^#' | xargs)
fi

# 数据库配置（从环境变量读取，如果没有则使用默认值）
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-aiwishlist}

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-./database/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 显示使用说明
show_usage() {
  echo "使用方法:"
  echo "  $0 backup              - 备份数据库"
  echo "  $0 restore <file>     - 从备份文件恢复数据库"
  echo "  $0 list               - 列出所有备份文件"
  echo "  $0 clean [days]       - 清理指定天数之前的备份（默认30天）"
  echo ""
  echo "环境变量:"
  echo "  DB_HOST              - 数据库主机（默认: localhost）"
  echo "  DB_PORT              - 数据库端口（默认: 3306）"
  echo "  DB_USER              - 数据库用户（默认: root）"
  echo "  DB_PASSWORD          - 数据库密码"
  echo "  DB_NAME              - 数据库名称（默认: aiwishlist）"
  echo "  BACKUP_DIR           - 备份目录（默认: ./database/backups）"
}

# 检查mysqldump命令是否存在
check_mysqldump() {
  if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}错误: mysqldump 命令未找到${NC}"
    echo "请安装 MySQL 客户端工具"
    exit 1
  fi
}

# 检查mysql命令是否存在
check_mysql() {
  if ! command -v mysql &> /dev/null; then
    echo -e "${RED}错误: mysql 命令未找到${NC}"
    echo "请安装 MySQL 客户端工具"
    exit 1
  fi
}

# 备份数据库
backup_database() {
  check_mysqldump

  echo -e "${YELLOW}开始备份数据库...${NC}"
  echo "数据库: $DB_NAME"
  echo "主机: $DB_HOST:$DB_PORT"
  echo "用户: $DB_USER"

  BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
  BACKUP_FILE_GZ="$BACKUP_FILE.gz"

  # 执行备份
  if [ -z "$DB_PASSWORD" ]; then
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
      --single-transaction \
      --routines \
      --triggers \
      --events \
      "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null
  else
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
      --single-transaction \
      --routines \
      --triggers \
      --events \
      "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    # 压缩备份文件
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}备份成功: $BACKUP_FILE_GZ${NC}"
    
    # 显示备份文件大小
    FILE_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    echo "备份文件大小: $FILE_SIZE"
  else
    echo -e "${RED}备份失败${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
  fi
}

# 恢复数据库
restore_database() {
  check_mysql

  if [ -z "$1" ]; then
    echo -e "${RED}错误: 请指定备份文件${NC}"
    show_usage
    exit 1
  fi

  BACKUP_FILE="$1"

  # 检查文件是否存在
  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}错误: 备份文件不存在: $BACKUP_FILE${NC}"
    exit 1
  fi

  # 如果是压缩文件，先解压
  TEMP_FILE=""
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    TEMP_FILE="${BACKUP_FILE%.gz}"
    echo -e "${YELLOW}解压备份文件...${NC}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
  fi

  echo -e "${YELLOW}开始恢复数据库...${NC}"
  echo "数据库: $DB_NAME"
  echo "备份文件: $1"

  # 确认操作
  read -p "此操作将覆盖现有数据，是否继续? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 0
  fi

  # 执行恢复
  if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$BACKUP_FILE" 2>/dev/null
  else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$BACKUP_FILE" 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}恢复成功${NC}"
  else
    echo -e "${RED}恢复失败${NC}"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
  fi

  # 清理临时文件
  [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
}

# 列出所有备份文件
list_backups() {
  echo -e "${YELLOW}备份文件列表:${NC}"
  echo ""

  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    echo "没有找到备份文件"
    return
  fi

  echo "文件名                          大小        修改时间"
  echo "------------------------------------------------------------"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{printf "%-30s %8s %s %s %s\n", $9, $5, $6, $7, $8}' | sed "s|$BACKUP_DIR/||g"
}

# 清理旧备份
clean_backups() {
  DAYS=${1:-30}
  
  echo -e "${YELLOW}清理 $DAYS 天前的备份文件...${NC}"

  if [ ! -d "$BACKUP_DIR" ]; then
    echo "备份目录不存在"
    return
  fi

  # 查找并删除旧文件
  find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$DAYS -delete

  echo -e "${GREEN}清理完成${NC}"
}

# 主函数
main() {
  case "$1" in
    backup)
      backup_database
      ;;
    restore)
      restore_database "$2"
      ;;
    list)
      list_backups
      ;;
    clean)
      clean_backups "$2"
      ;;
    *)
      show_usage
      exit 1
      ;;
  esac
}

# 执行主函数
main "$@"
