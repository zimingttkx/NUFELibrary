#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "   图书馆自动预约系统 - 停止服务"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "正在停止所有相关进程..."
echo ""

# 停止后端服务
echo -e "${YELLOW}[1/2] 停止后端服务...${NC}"
if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}  后端服务已停止 (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}  后端服务未运行${NC}"
    fi
    rm -f "$SCRIPT_DIR/logs/backend.pid"
else
    echo -e "${YELLOW}  未找到后端服务 PID 文件${NC}"
fi

# 额外检查并停止所有 node index.js 进程
pkill -f "node index.js" 2>/dev/null && echo -e "${GREEN}  已停止额外的后端进程${NC}"

# 停止前端服务
echo -e "${YELLOW}[2/2] 停止前端服务...${NC}"
if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        # 杀死整个进程树（包括子进程）
        pkill -P $FRONTEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}  前端服务已停止 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}  前端服务未运行${NC}"
    fi
    rm -f "$SCRIPT_DIR/logs/frontend.pid"
else
    echo -e "${YELLOW}  未找到前端服务 PID 文件${NC}"
fi

# 额外检查并停止所有 npm run serve 相关进程
pkill -f "vue-cli-service serve" 2>/dev/null && echo -e "${GREEN}  已停止额外的前端进程${NC}"

# 额外检查端口占用并清理
echo ""
echo "检查端口占用情况..."

# 检查 8899 端口
PORT_8899_PID=$(lsof -ti:8899 2>/dev/null)
if [ ! -z "$PORT_8899_PID" ]; then
    kill -9 $PORT_8899_PID 2>/dev/null
    echo -e "${GREEN}  已释放 8899 端口${NC}"
fi

# 检查 8080 端口
PORT_8080_PID=$(lsof -ti:8080 2>/dev/null)
if [ ! -z "$PORT_8080_PID" ]; then
    kill -9 $PORT_8080_PID 2>/dev/null
    echo -e "${GREEN}  已释放 8080 端口${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}所有服务已停止${NC}"
echo "========================================"
