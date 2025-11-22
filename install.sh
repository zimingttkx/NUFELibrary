#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "   图书馆自动预约系统 - 安装依赖"
echo "========================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 Node.js，请先安装 Node.js${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}检测到 Node.js 版本:${NC}"
node --version
echo ""

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[错误] 未检测到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}检测到 npm 版本:${NC}"
npm --version
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================"
echo "[1/2] 安装后端依赖..."
echo "========================================"
cd "$SCRIPT_DIR/nodeServer"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 后端依赖安装失败${NC}"
    exit 1
fi
echo ""
echo -e "${GREEN}后端依赖安装完成！${NC}"
echo ""

echo "========================================"
echo "[2/2] 安装前端依赖..."
echo "========================================"
cd "$SCRIPT_DIR/vue"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 前端依赖安装失败${NC}"
    exit 1
fi
echo ""
echo -e "${GREEN}前端依赖安装完成！${NC}"
echo ""

cd "$SCRIPT_DIR"

echo "========================================"
echo -e "${GREEN}所有依赖安装完成！${NC}"
echo ""
echo "下一步: 运行 ./start.sh 启动项目"
echo "========================================"
