#!/bin/bash

# AI工具需求愿望收集平台 - 数据库备份和恢复脚本
# 使用方法:
#   备份: ./backup.sh backup [备份文件名]
#   恢复: ./backup.sh restore <备份文件路径>
#   列出备份: ./backup.sh list
#   清理旧备份: ./backup.sh clean [保留天数，默认7天]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认配置（从环境变量读取，如果没有则使用默认值）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-aiwishlist}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# 检查MySQL客户端是否安装
check_mysql_client() {
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL客户端未安装。请先安装MySQL客户端。"
        exit 1
    fi

    if ! command -v mysqldump &> /dev/null; then
        log_error "mysqldump未安装。请先安装MySQL客户端。"
        exit 1
    fi
}

# 测试数据库连接
test_connection() {
    log_info "测试数据库连接..."
    
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -e "SELECT 1" "$DB_NAME" &> /dev/null
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" "$DB_NAME" &> /dev/null
    fi

    if [ $? -eq 0 ]; then
        log_info "数据库连接成功"
    else
        log_error "数据库连接失败。请检查数据库配置。"
        exit 1
    fi
}

# 备份数据库
backup_database() {
    local backup_file="$1"
    
    # 如果没有指定文件名，使用默认格式：aiwishlist_YYYYMMDD_HHMMSS.sql
    if [ -z "$backup_file" ]; then
        backup_file="aiwishlist_$(date '+%Y%m%d_%H%M%S').sql"
    fi
    
    # 确保文件名以.sql结尾
    if [[ ! "$backup_file" =~ \.sql$ ]]; then
        backup_file="${backup_file}.sql"
    fi
    
    local backup_path="$BACKUP_DIR/$backup_file"
    local compressed_path="${backup_path}.gz"
    
    log_info "开始备份数据库: $DB_NAME"
    log_info "备份文件: $backup_path"
    
    # 执行备份
    if [ -z "$DB_PASSWORD" ]; then
        mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            --add-drop-table \
            --default-character-set=utf8mb4 \
            "$DB_NAME" > "$backup_path"
    else
        mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            --add-drop-table \
            --default-character-set=utf8mb4 \
            "$DB_NAME" > "$backup_path"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "数据库备份成功"
        
        # 压缩备份文件
        log_info "压缩备份文件..."
        gzip -f "$backup_path"
        
        if [ $? -eq 0 ]; then
            log_info "备份文件已压缩: $compressed_path"
            log_info "备份文件大小: $(du -h "$compressed_path" | cut -f1)"
        else
            log_warn "压缩失败，但备份文件已保存: $backup_path"
        fi
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "请指定要恢复的备份文件路径"
        echo "使用方法: $0 restore <备份文件路径>"
        exit 1
    fi
    
    # 检查文件是否存在
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_warn "警告: 此操作将覆盖现有数据库 $DB_NAME"
    read -p "确认要继续吗? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "开始恢复数据库: $DB_NAME"
    log_info "备份文件: $backup_file"
    
    # 判断是否需要解压
    local sql_file="$backup_file"
    local need_decompress=false
    
    if [[ "$backup_file" =~ \.gz$ ]]; then
        need_decompress=true
        sql_file="${backup_file%.gz}"
        log_info "解压备份文件..."
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # 恢复数据库
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" < "$sql_file"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$sql_file"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "数据库恢复成功"
        
        # 清理临时解压文件
        if [ "$need_decompress" = true ] && [ -f "$sql_file" ]; then
            rm -f "$sql_file"
        fi
    else
        log_error "数据库恢复失败"
        
        # 清理临时解压文件
        if [ "$need_decompress" = true ] && [ -f "$sql_file" ]; then
            rm -f "$sql_file"
        fi
        
        exit 1
    fi
}

# 列出所有备份文件
list_backups() {
    log_info "备份文件列表:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_warn "没有找到备份文件"
        return
    fi
    
    echo "文件名 | 大小 | 修改时间"
    echo "----------------------------------------"
    
    for file in "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            size=$(du -h "$file" | cut -f1)
            mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1)
            echo "$filename | $size | $mtime"
        fi
    done
}

# 清理旧备份
clean_backups() {
    local days="${1:-$RETENTION_DAYS}"
    
    log_info "清理 $days 天前的备份文件..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_warn "备份目录不存在"
        return
    fi
    
    local count=0
    
    # macOS使用find的-mtime选项
    if [[ "$OSTYPE" == "darwin"* ]]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                rm -f "$file"
                count=$((count + 1))
                log_info "已删除: $(basename "$file")"
            fi
        done < <(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$days -o -name "*.sql" -mtime +$days)
    else
        # Linux使用find的-mtime选项
        find "$BACKUP_DIR" \( -name "*.sql.gz" -o -name "*.sql" \) -mtime +$days -delete -print | while read -r file; do
            count=$((count + 1))
            log_info "已删除: $(basename "$file")"
        done
    fi
    
    if [ $count -eq 0 ]; then
        log_info "没有需要清理的备份文件"
    else
        log_info "已清理 $count 个备份文件"
    fi
}

# 显示使用帮助
show_help() {
    echo "AI工具需求愿望收集平台 - 数据库备份和恢复脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 backup [备份文件名]          - 备份数据库"
    echo "  $0 restore <备份文件路径>       - 恢复数据库"
    echo "  $0 list                         - 列出所有备份文件"
    echo "  $0 clean [保留天数]             - 清理旧备份（默认保留7天）"
    echo "  $0 help                         - 显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DB_HOST          - 数据库主机（默认: localhost）"
    echo "  DB_PORT          - 数据库端口（默认: 3306）"
    echo "  DB_USER          - 数据库用户（默认: root）"
    echo "  DB_PASSWORD      - 数据库密码"
    echo "  DB_NAME          - 数据库名称（默认: aiwishlist）"
    echo "  BACKUP_DIR       - 备份目录（默认: database/backups）"
    echo "  RETENTION_DAYS   - 备份保留天数（默认: 7）"
    echo ""
    echo "示例:"
    echo "  # 备份数据库"
    echo "  $0 backup"
    echo "  $0 backup my_backup"
    echo ""
    echo "  # 恢复数据库"
    echo "  $0 restore database/backups/aiwishlist_20260128_120000.sql.gz"
    echo ""
    echo "  # 列出备份"
    echo "  $0 list"
    echo ""
    echo "  # 清理30天前的备份"
    echo "  $0 clean 30"
}

# 主函数
main() {
    local command="${1:-help}"
    
    case "$command" in
        backup)
            check_mysql_client
            test_connection
            backup_database "$2"
            ;;
        restore)
            check_mysql_client
            test_connection
            restore_database "$2"
            ;;
        list)
            list_backups
            ;;
        clean)
            clean_backups "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
