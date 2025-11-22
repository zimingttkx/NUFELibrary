#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "   图书馆自动预约系统 - 一键启动"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 检查nodeServer是否已安装依赖
if [ ! -d "$SCRIPT_DIR/nodeServer/node_modules" ]; then
    echo -e "${RED}[错误] 后端依赖未安装，请先运行 ./install.sh${NC}"
    exit 1
fi

# 检查vue是否已安装依赖
if [ ! -d "$SCRIPT_DIR/vue/node_modules" ]; then
    echo -e "${RED}[错误] 前端依赖未安装，请先运行 ./install.sh${NC}"
    exit 1
fi

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"

# 启动后端服务
echo -e "${BLUE}[1/2] 启动后端服务器 (端口: 8899)...${NC}"
cd "$SCRIPT_DIR/nodeServer"
nohup node index.js > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"
echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 启动前端服务
echo -e "${BLUE}[2/2] 启动前端开发服务器 (端口: 8080)...${NC}"
cd "$SCRIPT_DIR/vue"
nohup npm run serve > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"
echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}服务启动成功！${NC}"
echo ""
echo -e "${YELLOW}后端服务:${NC} http://localhost:8899"
echo -e "${YELLOW}前端服务:${NC} http://localhost:8080"
echo ""
echo -e "${YELLOW}进程信息:${NC}"
echo "  后端 PID: $BACKEND_PID"
echo "  前端 PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo "  后端: logs/backend.log"
echo "  前端: logs/frontend.log"
echo "========================================"
echo ""
echo "等待前端服务编译完成(约30-60秒)..."
echo "您可以运行以下命令查看前端编译状态:"
echo -e "${BLUE}  tail -f logs/frontend.log${NC}"
echo ""

# 等待前端编译
sleep 40

echo ""
echo "========================================"
echo -e "${GREEN}前端服务应该已准备就绪${NC}"
echo ""
echo "请在浏览器中访问: http://localhost:8080"
echo ""
echo "提示:"
echo "- 查看后端日志: tail -f logs/backend.log"
echo "- 查看前端日志: tail -f logs/frontend.log"
echo "- 停止服务: ./stop.sh"
echo "========================================"

# 尝试自动打开浏览器
if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:8080 &> /dev/null &
elif command -v open &> /dev/null; then
    # macOS
    open http://localhost:8080 &> /dev/null &
fi
