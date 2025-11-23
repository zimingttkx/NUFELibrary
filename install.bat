@echo off
chcp 65001 >nul
echo ========================================
echo    图书馆自动预约系统 - 安装依赖
echo ========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 未检测到 Node.js，正在自动安装...
    echo.

    REM 检查是否有winget（Windows 10/11自带）
    where winget >nul 2>&1
    if %errorlevel% equ 0 (
        echo 使用 winget 安装 Node.js LTS...
        winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
        if %errorlevel% neq 0 (
            echo [警告] winget 安装失败，尝试使用 Chocolatey...
            goto :try_choco
        )
        echo Node.js 安装完成！请重新运行此脚本。
        echo 如果命令未找到，请关闭并重新打开命令提示符。
        pause
        exit /b 0
    )

    :try_choco
    REM 检查是否有Chocolatey
    where choco >nul 2>&1
    if %errorlevel% equ 0 (
        echo 使用 Chocolatey 安装 Node.js...
        choco install nodejs-lts -y
        if %errorlevel% neq 0 (
            goto :manual_install
        )
        echo Node.js 安装完成！请重新运行此脚本。
        echo 如果命令未找到，请关闭并重新打开命令提示符。
        pause
        exit /b 0
    )

    :manual_install
    echo.
    echo ========================================
    echo 无法自动安装 Node.js
    echo ========================================
    echo.
    echo 请手动安装 Node.js:
    echo 1. 访问: https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 安装完成后重新运行此脚本
    echo.
    echo 或者安装包管理器后重试:
    echo - winget: Windows 10/11 自带，更新系统即可
    echo - Chocolatey: https://chocolatey.org/install
    echo ========================================
    start https://nodejs.org/
    pause
    exit /b 1
)

echo 检测到 Node.js 版本:
node --version
echo.

REM 检查npm是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 已安装但未检测到 npm
    echo 这是异常情况，请重新安装 Node.js
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
