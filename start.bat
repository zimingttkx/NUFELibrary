@echo off
chcp 65001 >nul
echo ========================================
echo    图书馆自动预约系统 - 一键启动
echo ========================================
echo.

REM 检查nodeServer是否已安装依赖
if not exist "nodeServer\node_modules\" (
    echo [错误] 后端依赖未安装，请先运行 install.bat
    pause
    exit /b 1
)

REM 检查vue是否已安装依赖
if not exist "vue\node_modules\" (
    echo [错误] 前端依赖未安装，请先运行 install.bat
    pause
    exit /b 1
)

echo [1/2] 启动后端服务器 (端口: 8899)...
start "图书馆后端服务" cmd /k "cd /d %~dp0nodeServer && node index.js"

REM 等待3秒让后端先启动
echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端开发服务器 (端口: 8080)...
start "图书馆前端服务" cmd /k "cd /d %~dp0vue && npm run serve"

echo.
echo ========================================
echo 正在启动服务...
echo.
echo 后端服务: http://localhost:8899
echo 前端服务: http://localhost:8080
echo.
echo 两个服务窗口已打开，请不要关闭
echo ========================================
echo.
echo 等待前端服务编译完成(约30-60秒)...
echo 请观察"图书馆前端服务"窗口，
echo 看到"Compiled successfully"后即可访问
echo.

REM 等待前端编译（根据机器性能调整时间）
timeout /t 40 /nobreak

echo.
echo 正在打开浏览器...
start http://localhost:8080

echo.
echo ========================================
echo 提示:
echo - 如果页面未加载，请等待前端编译完成后刷新
echo - 查看"图书馆前端服务"窗口确认编译状态
echo - 关闭服务请运行 stop.bat
echo ========================================
pause
