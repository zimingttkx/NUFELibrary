#!/bin/bash

# 图书馆座位预约CLI版 - 启动脚本 (Linux/Mac)

echo "正在启动图书馆座位预约系统 (CLI版)..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误：未检测到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装依赖..."
    npm install
fi

# 启动程序
node cli.js
