@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 项目打包脚本
REM 用于创建可分发的压缩包

REM 配置
set VERSION=1.0.0
set PROJECT_NAME=NFUELibrary
set OUTPUT_DIR=dist
set TEMP_DIR=%OUTPUT_DIR%\temp

echo ========================================
echo    项目打包脚本
echo ========================================
echo.
echo 项目名称: %PROJECT_NAME%
echo 版本号: v%VERSION%
echo.

REM 清理之前的输出
echo [1/4] 清理旧的打包文件...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"
mkdir "%TEMP_DIR%"
mkdir "%TEMP_DIR%\%PROJECT_NAME%"

REM 复制项目文件
echo [2/4] 复制项目文件...
echo 正在复制，请稍候...

REM 复制启动脚本
copy "*.bat" "%TEMP_DIR%\%PROJECT_NAME%\" >nul
copy "*.sh" "%TEMP_DIR%\%PROJECT_NAME%\" >nul

REM 复制文档
copy "*.md" "%TEMP_DIR%\%PROJECT_NAME%\" >nul

REM 复制源代码目录（排除node_modules）
echo 复制后端源码...
xcopy /E /I /Y "nodeServer" "%TEMP_DIR%\%PROJECT_NAME%\nodeServer" /EXCLUDE:pack_exclude.txt >nul

echo 复制前端源码...
xcopy /E /I /Y "vue" "%TEMP_DIR%\%PROJECT_NAME%\vue" /EXCLUDE:pack_exclude.txt >nul

REM 复制其他必要文件
if exist ".env.example" copy ".env.example" "%TEMP_DIR%\%PROJECT_NAME%\" >nul
if exist "package.json" copy "package.json" "%TEMP_DIR%\%PROJECT_NAME%\" >nul

REM 创建排除文件列表（临时）
echo node_modules> pack_exclude.txt
echo .git>> pack_exclude.txt
echo logs>> pack_exclude.txt
echo .idea>> pack_exclude.txt
echo .vscode>> pack_exclude.txt
echo dist>> pack_exclude.txt
echo *.log>> pack_exclude.txt

REM 创建压缩包
echo [3/4] 创建压缩包...
cd "%TEMP_DIR%"
powershell -Command "Compress-Archive -Path '%PROJECT_NAME%' -DestinationPath '..\%PROJECT_NAME%-v%VERSION%.zip' -Force"
cd ..\..

REM 清理临时文件
echo [4/4] 清理临时文件...
rmdir /s /q "%TEMP_DIR%"
del pack_exclude.txt >nul 2>&1

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 输出文件:
dir "%OUTPUT_DIR%\%PROJECT_NAME%-v%VERSION%.zip" | find "%PROJECT_NAME%"
echo.
echo 输出目录: %OUTPUT_DIR%\
echo.
echo 下一步:
echo 1. 在全新环境测试压缩包
echo 2. 确认启动脚本正常工作
echo 3. 发布到目标平台
echo.
echo 详细说明请查看: 打包发布说明.md
echo ========================================
pause
