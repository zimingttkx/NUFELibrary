# 图书馆座位自动预约系统

梓铭祝你天天开心 🎉

## 🚀 快速启动

### 方式一：一键启动（推荐）⭐

#### Windows 平台

1. **安装依赖**：双击运行 `install.bat`
2. **启动项目**：双击运行 `start.bat`
3. **停止服务**：双击运行 `stop.bat`

#### Linux/Mac 平台

```bash
# 1. 添加执行权限（首次使用）
chmod +x install.sh start.sh stop.sh

# 2. 安装依赖
./install.sh

# 3. 启动项目
./start.sh

# 4. 停止服务
./stop.sh
```

✅ 后端服务运行在: http://127.0.0.1:8899
✅ 前端服务运行在: http://localhost:8080

**注意**：首次启动时，前端编译需要约 40-60 秒，浏览器会在编译完成后自动打开。如果页面显示"无网络连接"，请等待前端编译完成后刷新页面。

**详细使用说明**：请查看 [一键启动说明.md](./一键启动说明.md)

---

### 方式二：手动启动

#### 1. 启动后端服务
```bash
cd nodeServer
npm run dev
```
✅ 后端服务运行在: http://127.0.0.1:8899

#### 2. 启动前端服务
```bash
cd vue
npm run serve
```
✅ 前端服务运行在: http://localhost:8080

#### 3. 访问应用
在浏览器打开: **http://localhost:8080**

---

## 📋 功能特性

### ✨ 核心功能
- 🎫 **Cookie管理**: 支持扫码登录和手动输入
- 💺 **座位配置**: 灵活的座位选择和备选座位管理
- ⚡ **自动预约**: 19:59:55自动启动，极速抢座
- 👀 **实时查看**: 查看所有图书馆的座位状态
- 🔄 **多座位轮询**: 当前座位满时自动切换备选座位
- 🛡️ **反防刷**: 自动刷新页面和SERVERID

### 🎯 技术亮点
- **极速排队**: WebSocket + 100ms心跳，每秒10次
- **并发请求**: 3个并发请求，150ms周期
- **智能切换**: 自动多座位轮询
- **定时任务**: Cron自动化预约

---

## 🧪 运行测试

### 后端测试
```bash
cd nodeServer
npm test                  # 运行测试
npm run test:coverage     # 生成覆盖率报告
```

### 前端测试
```bash
cd vue
npm test                  # 运行测试
npm run test:coverage     # 生成覆盖率报告
```

### 测试结果
- ✅ 后端: 5/5 通过
- ✅ 前端: 12/12 通过
- 📊 总计: 17/17 通过 (100%)

---

## 📖 使用指南

### 首次使用

1. **获取Cookie**
   - 点击"预约管理"
   - 选择"扫码获取Cookie"或"手动输入Cookie"
   - 按提示完成Cookie设置

2. **刷新图书馆列表**
   - 点击"刷新场馆列表"按钮
   - 等待加载完成

3. **配置座位**
   - 从下拉列表选择图书馆
   - 输入座位号
   - 点击"修改座位"保存

4. **测试预约**
   - 点击"测试预约"验证配置
   - 系统会自动预约并取消

5. **添加备选座位**（可选）
   - 选择其他座位作为备选
   - 点击"添加备选座位"
   - 系统会在主座位满时自动切换

### 自动预约

系统会在以下时间自动运行:
- **19:45** - 发送Cookie刷新提醒
- **19:59:55** - 启动自动预约
- **20:05:00** - 关闭自动预约

---

## 📂 项目结构

```
NFUELibrary/
├── nodeServer/              # 后端服务
│   ├── index.js            # 服务入口
│   ├── .env                # 环境配置
│   ├── router/             # API路由 (22个端点)
│   ├── fuckinglib/         # 核心业务逻辑
│   │   ├── index.js        # 控制器 (16个函数)
│   │   ├── http.js         # HTTP配置
│   │   ├── websocket.js    # WebSocket连接
│   │   ├── myCooke.js      # 数据管理
│   │   └── data.json       # 运行时数据
│   └── __tests__/          # 单元测试
│
├── vue/                    # 前端应用
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   │   ├── Home.vue
│   │   │   ├── ReservationManage.vue
│   │   │   └── SeatView.vue
│   │   ├── router/         # 路由配置
│   │   └── components/     # 公共组件
│   └── tests/unit/         # 单元测试
│
├── TEST_SUMMARY.md         # 测试总结
├── TESTING.md              # 测试指南
└── PROJECT_STATUS.md       # 项目状态
```

---

## 🔧 配置说明

### 后端配置 (nodeServer/.env)
```bash
# 服务器设置
HOST=http://127.0.0.1
DEFAULT_NODE_PORT=8899

# 定时任务 (Cron格式)
NOTINCE_TIME_CRON=45 19 * * *      # 提醒时间
START_TIME_CRON=55 59 19 * * *     # 启动时间
KILL_TIME_CRON=0 5 20 * * *        # 停止时间
```

---

## 📡 API端点

### Cookie管理
- `POST /lib/setCookie` - 设置Cookie
- `POST /lib/setCookieByCode` - 扫码获取Cookie
- `GET /lib/verifyCookie` - 验证Cookie

### 座位管理
- `POST /lib/changeSeat` - 修改座位
- `POST /lib/addSeat` - 添加备选座位
- `POST /lib/removeSeat` - 删除备选座位
- `GET /lib/getSeatList` - 获取备选座位列表

### 预约操作
- `POST /lib/manualReserve` - 手动预约
- `GET /lib/testReserveAndCancel` - 测试预约
- `POST /lib/startContinuousReserve` - 启动自动预约

### 数据查询
- `GET /lib/getLibList` - 获取图书馆列表
- `GET /lib/getLibSeatStatus` - 获取座位状态
- `GET /lib/getAllLibsStatus` - 获取所有图书馆状态

---

## 🛠️ 技术栈

### 后端
- Node.js + Koa 2.13.4
- Axios 1.4.0
- WebSocket (ws 8.13.0)
- Croner 6.0.3 (定时任务)
- Jest 30.2.0 (测试)

### 前端
- Vue 2.6.14
- Vue Router 3.6.5
- Element-UI 2.15.14
- Axios 1.6.5
- Jest + Vue Test Utils (测试)

---

## ⚠️ 常见问题

### Q: 测试预约失败？
A: 检查Cookie是否有效，尝试重新获取Cookie

### Q: 自动预约没有启动？
A: 检查系统时间，确保在19:59:55-20:05:00之间

### Q: 座位已满怎么办？
A: 添加备选座位，系统会自动切换

### Q: Cookie多久过期？
A: 通常24小时，建议每天更新

---

## 📞 支持

- 📖 [测试文档](./TESTING.md)
- 📊 [项目状态](./PROJECT_STATUS.md)
- 📝 [测试总结](./TEST_SUMMARY.md)

---

## 📄 许可证

ISC

---

**开发者**: SCY
**最后更新**: 2025-11-22
**版本**: 1.0.0

梓铭祝你天天开心！🎉
