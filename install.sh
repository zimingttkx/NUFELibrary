#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "   图书馆自动预约系统 - 安装依赖"
echo "========================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[提示] 未检测到 Node.js，正在自动安装...${NC}"
    echo ""

    # 检测操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux系统
        echo -e "${BLUE}检测到 Linux 系统${NC}"

        # 检查是否有apt（Debian/Ubuntu）
        if command -v apt &> /dev/null; then
            echo "使用 apt 安装 Node.js..."
            sudo apt update
            sudo apt install -y curl
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt install -y nodejs

        # 检查是否有yum（CentOS/RHEL）
        elif command -v yum &> /dev/null; then
            echo "使用 yum 安装 Node.js..."
            sudo yum install -y curl
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo yum install -y nodejs

        # 检查是否有dnf（Fedora）
        elif command -v dnf &> /dev/null; then
            echo "使用 dnf 安装 Node.js..."
            sudo dnf install -y curl
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo dnf install -y nodejs
        else
            echo -e "${YELLOW}未检测到包管理器，尝试使用 nvm 安装...${NC}"
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install --lts
        fi

    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS系统
        echo -e "${BLUE}检测到 macOS 系统${NC}"

        # 检查是否有Homebrew
        if command -v brew &> /dev/null; then
            echo "使用 Homebrew 安装 Node.js..."
            brew install node
        else
            echo -e "${YELLOW}未检测到 Homebrew，正在安装...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node
        fi
    else
        echo -e "${RED}无法识别的操作系统: $OSTYPE${NC}"
        echo "请手动安装 Node.js: https://nodejs.org/"
        exit 1
    fi

    # 检查安装是否成功
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js 安装失败！${NC}"
        echo "请手动安装 Node.js: https://nodejs.org/"
        echo "或使用 nvm: https://github.com/nvm-sh/nvm"
        exit 1
    fi

    echo -e "${GREEN}Node.js 安装成功！${NC}"
fi

echo -e "${GREEN}检测到 Node.js 版本:${NC}"
node --version
echo ""

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[错误] Node.js 已安装但未检测到 npm${NC}"
    echo "这是异常情况，请重新安装 Node.js"
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
