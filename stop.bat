@echo off
chcp 65001 >nul
echo ========================================
echo    图书馆自动预约系统 - 停止服务
echo ========================================
echo.

echo 正在停止所有相关进程...
echo.

REM 停止Node.js进程（后端服务）
echo [1/2] 停止后端服务...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8899 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo   后端服务已停止 (PID: %%a)
    )
)

REM 停止Vue开发服务器
echo [2/2] 停止前端服务...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo   前端服务已停止 (PID: %%a)
    )
)

echo.
echo ========================================
echo 所有服务已停止
echo ========================================
echo.
pause
