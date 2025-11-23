#!/bin/bash

# 项目打包脚本
# 用于创建可分发的压缩包

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
VERSION="1.0.0"
PROJECT_NAME="NFUELibrary"
OUTPUT_DIR="dist"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TEMP_DIR="${OUTPUT_DIR}/temp"

echo "========================================"
echo "   项目打包脚本"
echo "========================================"
echo ""
echo -e "${BLUE}项目名称:${NC} ${PROJECT_NAME}"
echo -e "${BLUE}版本号:${NC} v${VERSION}"
echo ""

# 询问用户选择压缩格式
echo "请选择压缩格式:"
echo "1) tar.gz (推荐 Linux/Mac)"
echo "2) zip (推荐 Windows)"
echo "3) 两种格式都创建"
read -p "请输入选项 (1-3): " format_choice

# 清理之前的输出
echo ""
echo -e "${YELLOW}[1/5] 清理旧的打包文件...${NC}"
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${TEMP_DIR}"

# 复制项目文件
echo -e "${YELLOW}[2/5] 复制项目文件...${NC}"
rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  --exclude='.idea' \
  --exclude='.vscode' \
  --exclude='dist' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  "${SCRIPT_DIR}/" "${TEMP_DIR}/${PROJECT_NAME}/"

# 确保脚本有执行权限
echo -e "${YELLOW}[3/5] 设置脚本执行权限...${NC}"
chmod +x "${TEMP_DIR}/${PROJECT_NAME}/"*.sh
chmod +x "${TEMP_DIR}/${PROJECT_NAME}/双击启动.sh"
chmod +x "${TEMP_DIR}/${PROJECT_NAME}/start.sh"
chmod +x "${TEMP_DIR}/${PROJECT_NAME}/install.sh"
chmod +x "${TEMP_DIR}/${PROJECT_NAME}/stop.sh"

# 创建压缩包
echo -e "${YELLOW}[4/5] 创建压缩包...${NC}"
cd "${OUTPUT_DIR}/temp"

case $format_choice in
  1)
    echo "创建 tar.gz 格式..."
    tar -czf "../${PROJECT_NAME}-v${VERSION}.tar.gz" "${PROJECT_NAME}/"
    ;;
  2)
    echo "创建 zip 格式..."
    zip -r "../${PROJECT_NAME}-v${VERSION}.zip" "${PROJECT_NAME}/"
    ;;
  3)
    echo "创建 tar.gz 格式..."
    tar -czf "../${PROJECT_NAME}-v${VERSION}.tar.gz" "${PROJECT_NAME}/"
    echo "创建 zip 格式..."
    zip -r "../${PROJECT_NAME}-v${VERSION}.zip" "${PROJECT_NAME}/"
    ;;
  *)
    echo -e "${RED}无效的选项，默认创建 tar.gz 格式${NC}"
    tar -czf "../${PROJECT_NAME}-v${VERSION}.tar.gz" "${PROJECT_NAME}/"
    ;;
esac

cd "${SCRIPT_DIR}"

# 清理临时文件
echo -e "${YELLOW}[5/5] 清理临时文件...${NC}"
rm -rf "${TEMP_DIR}"

echo ""
echo "========================================"
echo -e "${GREEN}✅ 打包完成！${NC}"
echo "========================================"
echo ""
echo "输出文件:"

if [ -f "${OUTPUT_DIR}/${PROJECT_NAME}-v${VERSION}.tar.gz" ]; then
  SIZE=$(du -h "${OUTPUT_DIR}/${PROJECT_NAME}-v${VERSION}.tar.gz" | cut -f1)
  echo -e "  📦 ${PROJECT_NAME}-v${VERSION}.tar.gz (${SIZE})"
fi

if [ -f "${OUTPUT_DIR}/${PROJECT_NAME}-v${VERSION}.zip" ]; then
  SIZE=$(du -h "${OUTPUT_DIR}/${PROJECT_NAME}-v${VERSION}.zip" | cut -f1)
  echo -e "  📦 ${PROJECT_NAME}-v${VERSION}.zip (${SIZE})"
fi

echo ""
echo "输出目录: ${OUTPUT_DIR}/"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 在全新环境测试压缩包"
echo "2. 确认启动脚本正常工作"
echo "3. 发布到目标平台"
echo ""
echo "详细说明请查看: 打包发布说明.md"
echo "========================================"
