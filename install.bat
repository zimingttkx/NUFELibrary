@echo off
chcp 65001 >nul
echo ========================================
echo    图书馆自动预约系统 - 安装依赖
echo ========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo 检测到 Node.js 版本:
node --version
echo.

REM 检查npm是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

echo 检测到 npm 版本:
npm --version
echo.

echo ========================================
echo [1/2] 安装后端依赖...
echo ========================================
cd /d "%~dp0nodeServer"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo.
echo 后端依赖安装完成！
echo.

echo ========================================
echo [2/2] 安装前端依赖...
echo ========================================
cd /d "%~dp0vue"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo.
echo 前端依赖安装完成！
echo.

cd /d "%~dp0"

echo ========================================
echo 所有依赖安装完成！
echo.
echo 下一步: 运行 start.bat 启动项目
echo ========================================
pause
