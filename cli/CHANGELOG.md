# 图书馆座位预约 CLI版 - 更新日志

## [1.0.0] - 2025-12-07

### ✅ 已完成

#### 核心功能
- ✅ **Cookie管理**
  - 手动输入Cookie（抓包获取）
  - 扫码获取Cookie（扫描二维码） - **已修复**
  - Cookie自动验证和状态检查

- ✅ **明日预约**
  - 自动获取图书馆列表
  - 智能查找座位key
  - WebSocket排队系统
  - 定时任务自动预约（19:59:55启动）
  - 反防刷机制（700ms轮询间隔）

#### 架构设计
- ✅ 交互式菜单系统（基于inquirer）
- ✅ 配置持久化（config.json）
- ✅ 跨平台支持（Windows/Linux/Mac）
- ✅ 启动脚本（start.sh / start.bat）
- ✅ 完整文档（README.md + QUICKSTART.md）

### 🔧 修复

#### v1.0.0-fix1 (2025-12-07)
**修复扫码获取Cookie功能**

**问题描述：**
扫码后输入的链接无法正常解析为Cookie信息

**根本原因：**
1. 使用了错误的auth URL
   - 旧：`${DOMAIN}/index.php/auth/oauth/callback?code=${code}&state=`
   - 新：`http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%2F%2Fweb.traceint.com%2Fweb%2Findex.html&code=${code}&state=1`

2. Cookie提取方式不正确
   - 旧：查找Authorization和SERVERID
   - 新：直接取cookies[1]和cookies[0]

**修复内容：**
- 添加`extractCodeFromUrl`函数提取code参数
- 添加正确的`getCookieByCode`函数
- 使用正确的auth URL和cookie提取逻辑
- 与nodeServer实现保持一致

**影响范围：**
- cli/lib/cookie.js:43-144

**测试状态：**
- ✅ 模块加载测试通过
- ⏳ 需要实际扫码测试验证

### 📝 技术细节

#### Cookie获取流程
1. **扫码** → 获取包含code参数的跳转链接
2. **提取code** → extractCodeFromUrl解析链接
3. **请求auth URL** → 使用code换取Cookie
4. **提取Cookie** → 从set-cookie头获取
5. **验证** → 调用verifyCookie确认有效性

#### 正确的Cookie格式
```
Authorization=Bearer%20xxx; SERVERID=xxx
```

### 🎯 后续计划

- [ ] 实际扫码测试验证修复效果
- [ ] 添加更详细的错误提示
- [ ] 优化用户体验（进度条、彩色输出）
- [ ] 添加日志系统

### 📊 项目统计

- **代码文件**: 8个核心模块
- **依赖包**: 6个（inquirer, axios, chalk, croner, ws, ora, qrcode-terminal）
- **文档**: 3个（README, QUICKSTART, CHANGELOG）
- **脚本**: 2个（start.sh, start.bat）
- **总代码行数**: ~800行

---

**开发者**: SCY
**版本**: 1.0.0
**最后更新**: 2025-12-07 23:00
