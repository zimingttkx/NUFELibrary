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

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[提示] 未检测到 Node.js，正在运行安装脚本...${NC}"
    echo ""
    bash "$SCRIPT_DIR/install.sh"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] Node.js 安装失败${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}请重新运行 ./start.sh 启动项目${NC}"
    exit 0
fi

# 获取本机IP地址
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
    else
        # Linux
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "127.0.0.1")
    fi
    echo "$LOCAL_IP"
}

LOCAL_IP=$(get_local_ip)
echo -e "${GREEN}检测到本机IP: ${LOCAL_IP}${NC}"
echo ""

# 检查nodeServer是否已安装依赖
if [ ! -d "$SCRIPT_DIR/nodeServer/node_modules" ]; then
    echo -e "${YELLOW}[提示] 后端依赖未安装，正在自动安装...${NC}"
    echo ""
    bash "$SCRIPT_DIR/install.sh"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 依赖安装失败${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}依赖安装完成，继续启动...${NC}"
    echo ""
fi

# 检查vue是否已安装依赖
if [ ! -d "$SCRIPT_DIR/vue/node_modules" ]; then
    echo -e "${YELLOW}[提示] 前端依赖未安装，正在自动安装...${NC}"
    echo ""
    bash "$SCRIPT_DIR/install.sh"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 依赖安装失败${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}依赖安装完成，继续启动...${NC}"
    echo ""
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
echo -e "${YELLOW}后端服务:${NC} http://${LOCAL_IP}:8899"
echo -e "${YELLOW}前端服务:${NC} http://${LOCAL_IP}:8080"
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
echo "请在浏览器中访问: http://${LOCAL_IP}:8080"
echo ""
echo "提示:"
echo "- 查看后端日志: tail -f logs/backend.log"
echo "- 查看前端日志: tail -f logs/frontend.log"
echo "- 停止服务: ./stop.sh"
echo "========================================"

# 尝试自动打开浏览器
if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://${LOCAL_IP}:8080" &> /dev/null &
elif command -v open &> /dev/null; then
    # macOS
    open "http://${LOCAL_IP}:8080" &> /dev/null &
fi
