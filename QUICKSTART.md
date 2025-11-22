# 快速启动指南

## 📦 一分钟上手

### Windows 用户

```batch
# 1️⃣ 首次使用：双击 install.bat（只需一次）
# 2️⃣ 启动项目：双击 start.bat
# 3️⃣ 停止服务：双击 stop.bat
```

### Linux/Mac 用户

```bash
# 0️⃣ 首次添加权限（只需一次）
chmod +x *.sh

# 1️⃣ 安装依赖（只需一次）
./install.sh

# 2️⃣ 启动项目
./start.sh

# 3️⃣ 停止服务
./stop.sh
```

---

## 🌐 访问地址

启动成功后访问：

- **前端页面**：http://localhost:8080
- **后端API**：http://localhost:8899
- **局域网访问**：http://你的IP:8080

---

## ⏱️ 首次启动时间

- **安装依赖**：3-5 分钟（仅首次）
- **后端启动**：3 秒
- **前端编译**：40-60 秒（首次较慢，后续 30 秒左右）

**注意**：如果浏览器打开时显示"无网络连接"，请等待前端编译完成后刷新页面。

---

## 🎯 使用流程

### 1️⃣ 获取 Cookie

访问 http://localhost:8080，点击"预约管理" → "扫码获取Cookie"

### 2️⃣ 刷新场馆列表

点击"刷新场馆列表"按钮，等待加载完成

### 3️⃣ 选择座位

- 选择图书馆
- 输入座位号
- 点击"修改座位"

### 4️⃣ 测试预约

点击"测试预约"验证配置是否正确

### 5️⃣ 自动预约

系统会在 **19:59:55** 自动启动预约

---

## ❗ 常见问题速查

| 问题 | 解决方案 |
|------|----------|
| 浏览器显示"无网络连接" | 等待前端编译完成（看到"Compiled successfully"）后刷新 |
| 端口被占用 | 运行 stop.bat/stop.sh 后重新启动 |
| 脚本闪退（Windows） | 右键"以管理员身份运行" |
| Permission denied（Linux/Mac） | 运行 `chmod +x *.sh` |
| 依赖安装失败 | 检查网络，尝试切换 npm 镜像源 |

---

## 📂 脚本文件说明

| 文件 | 平台 | 功能 |
|------|------|------|
| install.bat | Windows | 安装所有依赖 |
| start.bat | Windows | 启动前后端服务 |
| stop.bat | Windows | 停止所有服务 |
| install.sh | Linux/Mac | 安装所有依赖 |
| start.sh | Linux/Mac | 启动前后端服务（后台运行） |
| stop.sh | Linux/Mac | 停止所有服务 |

---

## 🔧 调试技巧

### Windows

查看服务窗口输出：
- "图书馆后端服务"窗口 → 后端日志
- "图书馆前端服务"窗口 → 前端编译状态

### Linux/Mac

```bash
# 查看日志
tail -f logs/backend.log    # 后端日志
tail -f logs/frontend.log   # 前端日志

# 查看进程
ps aux | grep node

# 查看端口
lsof -i :8899  # 后端
lsof -i :8080  # 前端
```

---

## 📖 更多文档

- **详细使用说明**：[一键启动说明.md](./一键启动说明.md)
- **完整项目文档**：[README_CN.md](./README_CN.md)
- **测试文档**：[TESTING.md](./TESTING.md)
- **项目状态**：[PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## 🚀 高级用法

### 修改等待时间（如果编译很慢）

**Windows**: 编辑 `start.bat`，找到并修改
```batch
timeout /t 40 /nobreak
```

**Linux/Mac**: 编辑 `start.sh`，找到并修改
```bash
sleep 40
```

### 后台运行（Linux/Mac）

Linux/Mac 脚本默认使用 `nohup` 后台运行，关闭终端不影响服务。

### 切换 npm 镜像源（加速安装）

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 恢复官方源
npm config set registry https://registry.npmjs.org
```

---

**最后更新**: 2025-11-22
**版本**: 2.0.0

开始使用吧！🎉
