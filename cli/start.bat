@echo off
REM 图书馆座位预约CLI版 - 启动脚本 (Windows)

echo 正在启动图书馆座位预约系统 (CLI版)...

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist node_modules (
    echo 首次运行，正在安装依赖...
    call npm install
)

REM 启动程序
node cli.js

pause
