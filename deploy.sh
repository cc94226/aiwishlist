#!/bin/bash

# Docker部署脚本
# 用于构建和部署AI愿望收集平台

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查Docker和Docker Compose
check_docker() {
    log_step "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_info "Docker环境检查通过"
}

# 检查环境变量文件
check_env_file() {
    log_step "检查环境变量文件..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "环境变量文件不存在，创建示例文件..."
        create_env_example
        log_warn "请编辑 .env 文件设置正确的配置"
        exit 1
    fi
    
    log_info "环境变量文件检查通过"
}

# 创建环境变量示例文件
create_env_example() {
    cat > "$ENV_FILE.example" << EOF
# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=your-secure-password
DB_NAME=aiwishlist

# Redis配置
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 服务端口
BACKEND_PORT=3000
FRONTEND_PORT=80

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=true
LOG_DIR=/app/logs

# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=300
EOF
    log_info "已创建环境变量示例文件: $ENV_FILE.example"
}

# 构建镜像
build_images() {
    log_step "构建Docker镜像..."
    
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        log_info "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_info "服务启动成功"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_step "停止服务..."
    
    docker-compose down
    
    log_info "服务已停止"
}

# 重启服务
restart_services() {
    log_step "重启服务..."
    
    docker-compose restart
    
    log_info "服务已重启"
}

# 查看日志
view_logs() {
    local service="$1"
    
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# 查看服务状态
status() {
    log_step "查看服务状态..."
    
    docker-compose ps
}

# 清理资源
cleanup() {
    log_step "清理Docker资源..."
    
    read -p "确认要删除所有容器、镜像和卷吗? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log_info "操作已取消"
        return
    fi
    
    docker-compose down -v --rmi all
    
    log_info "清理完成"
}

# 备份数据库
backup_database() {
    log_step "备份数据库..."
    
    docker-compose exec mysql mysqldump -u"${DB_USER:-appuser}" -p"${DB_PASSWORD:-apppassword}" "${DB_NAME:-aiwishlist}" > "backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "数据库备份完成"
}

# 显示使用说明
show_usage() {
    cat << EOF
Docker部署脚本

用法:
    $0 [命令] [选项]

命令:
    build               构建Docker镜像
    start               启动所有服务
    stop                停止所有服务
    restart             重启所有服务
    logs [服务名]        查看日志（可选服务名：frontend, backend, mysql, redis）
    status              查看服务状态
    backup              备份数据库
    cleanup             清理所有Docker资源
    help                显示此帮助信息

示例:
    # 构建并启动服务
    $0 build
    $0 start

    # 查看后端日志
    $0 logs backend

    # 查看服务状态
    $0 status

    # 备份数据库
    $0 backup

    # 停止服务
    $0 stop

    # 清理资源
    $0 cleanup
EOF
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    COMMAND="$1"
    shift
    
    check_docker
    
    case "$COMMAND" in
        build)
            check_env_file
            build_images
            ;;
        start)
            check_env_file
            start_services
            log_info "服务已启动，访问 http://localhost:${FRONTEND_PORT:-80} 查看应用"
            ;;
        stop)
            stop_services
            ;;
        restart)
            check_env_file
            restart_services
            ;;
        logs)
            view_logs "$@"
            ;;
        status)
            status
            ;;
        backup)
            check_env_file
            backup_database
            ;;
        cleanup)
            cleanup
            ;;
        help)
            show_usage
            ;;
        *)
            log_error "未知命令: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
