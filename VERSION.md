# 版本信息 Version Information

## macOS 稳定版本 v1.0.0-macos

**发布日期**: 2025-11-25

---

## 系统要求 System Requirements

### 操作系统
- macOS 26.1 或更高版本
- 内核版本: Darwin 25.1.0 或更高

### 运行环境
- Node.js: v14.0.0 及以上（推荐 v25.2.1）
- npm: 建议 v8.0.0 及以上
- Python: 3.x（可选）

---

## 测试环境信息 Test Environment

此版本已在以下环境中完成测试并确认稳定运行：

### 硬件配置
- **设备型号**: MacBook Air (MacBookAir10,1)
- **处理器**: Apple Silicon M1
- **内存**: 16 GB
- **系统版本**: macOS 26.1 (Build 25B78)
- **内核版本**: Darwin 25.1.0

### 软件环境
- **Node.js**: v25.2.1
- **npm**: 11.6.2
- **Python**: 3.13.5

---

## 主要依赖版本 Dependencies

### 后端 (Node Server)
- koa: ^2.13.4
- koa-router: ^12.0.0
- axios: ^1.4.0
- ws: ^8.13.0
- croner: ^6.0.3
- koa2-cors: ^2.0.6

### 前端 (Vue)
- Vue: 2.x
- @vue/cli

---

## 功能特性 Features

- 支持跨平台一键启动脚本
- 自动化图书馆座位预约
- 定时任务调度
- WebSocket 实时通信
- 完整的前后端分离架构
- 支持 Docker 容器化部署

---

## 安装说明 Installation

### 快速启动（推荐）
```bash
chmod +x install.sh start.sh
./install.sh
./start.sh
```

### 手动安装
请参考 README.md 中的详细部署说明

---

## 已知问题 Known Issues

- 无重大已知问题

---

## 版本历史 Version History

### v1.0.0-macos (2025-11-25)
- 首个macOS稳定版本发布
- 添加跨平台一键启动脚本
- 完成macOS环境完整测试
- 修复启动脚本动态IP地址问题

---

## 技术支持 Support

如遇到问题，请：
1. 查看 README.md 中的部署说明
2. 访问项目 GitHub Issues 页面反馈问题
3. 确保系统环境符合上述要求

---

## 许可证 License

MIT License - 详见 LICENSE 文件
