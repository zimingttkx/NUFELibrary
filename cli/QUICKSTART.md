# 图书馆座位预约 - CLI版本快速上手指南

## 🎯 一分钟快速开始

### 1. 进入CLI目录并安装依赖
```bash
cd cli
npm install
```

### 2. 启动程序
```bash
npm start
# 或者直接运行
node cli.js
# Linux/Mac可使用
./start.sh
# Windows可双击
start.bat
```

### 3. 按照提示操作
1. 选择"🔑 设置Cookie" → 选择获取方式（手动输入或扫码）
2. 选择"💺 配置座位" → 选择图书馆 → 输入座位号
3. 选择"🧪 测试预约" → 验证配置是否正确
4. 选择"⚡ 启动自动预约" → 确认启动

## 📱 获取Cookie的两种方式

### 方式1：手动输入Cookie（推荐Android用户）

1. 安装抓包工具 **HttpCanary**（Android）
2. 在明日预约开放前1小时内，打开"我去图书馆"公众号
3. 开启抓包，随便点击一个功能
4. 找到请求头中的Cookie（包含Authorization和SERVERID）
5. 复制完整Cookie值，粘贴到CLI中

**Cookie格式示例：**
```
Authorization=Bearer%20xxx; SERVERID=xxx
```

### 方式2：扫码获取Cookie（推荐所有用户）✅

1. 在CLI中选择"扫码获取Cookie"
2. 终端会显示二维码和链接
3. 使用微信扫描终端显示的二维码
4. 扫码后浏览器会跳转到一个新链接
5. **复制完整的跳转链接**（包含code参数）
6. 粘贴到CLI中，程序会自动提取code并获取Cookie

**链接格式示例：**
```
https://wechat.v2.traceint.com/index.php/reserve/index/id/2179.html?code=081xxxxx&state=
```

**重要提示：**
- ⚠️ code有效期很短（通常几分钟），获取后立即使用
- ✅ 复制完整链接，不要只复制code部分
- ✅ 确保链接中包含`code=`参数
- ❌ 不要多次使用同一个code（一个code只能用一次）

**常见问题：**
- 如果提示"Cookie不包含关键身份信息"：code已过期，请重新扫码
- 如果提示"无法从链接中提取code参数"：检查链接是否完整
- 如果提示"Cookie获取成功但验证失败"：code可能已被使用，重新扫码

## ⏰ 自动预约时间表

程序启动自动预约后，将按以下时间自动执行：

| 时间 | 动作 | 说明 |
|------|------|------|
| 19:45 | 发送提醒 | 提醒检查Cookie是否有效 |
| 19:59:55 | 启动预约 | 建立WebSocket连接，开始轮询预约 |
| 20:05:00 | 停止预约 | 自动停止轮询（如未成功） |

**注意：**
- 预约成功后会自动停止
- 请保持程序运行，不要关闭终端

## 🔧 高级用法

### 后台运行（Linux/Mac）

使用nohup后台运行：
```bash
nohup node cli.js > output.log 2>&1 &
```

使用PM2管理进程：
```bash
npm install -g pm2
pm2 start cli.js --name library-reserve
pm2 logs library-reserve  # 查看日志
pm2 stop library-reserve  # 停止
pm2 restart library-reserve  # 重启
```

### Windows后台运行

创建VBS脚本（隐藏窗口运行）：

**run-hidden.vbs:**
```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\path\to\cli && node cli.js", 0
Set WshShell = Nothing
```

双击VBS文件即可后台运行。

## 🎨 界面预览

```
╔════════════════════════════════════════╗
║   📚 图书馆座位自动预约系统 (CLI版)   ║
╚════════════════════════════════════════╝

【当前配置】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cookie状态: ✓ 已设置
座位信息: ✓ 一楼东区东一 - 179号
自动预约: ✓ 已启动
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请选择操作：
> 🔑 设置Cookie
  💺 配置座位
  🧪 测试预约
  ⚡ 启动自动预约
  🛑 停止自动预约
  📊 查看完整状态
  ───────────────
  ❌ 退出程序
```

## 💡 常见问题快速解答

**Q: Cookie多久过期？**
A: 通常24小时，建议每天更新一次。

**Q: 怎么知道预约成功了？**
A: 终端会显示"🎉【成功】预约成功！"，程序会自动停止。

**Q: 可以同时预约多个座位吗？**
A: CLI版本只支持单座位预约。需要多座位请使用Web版本。

**Q: 程序崩溃了怎么办？**
A: 检查Cookie是否有效，重新启动程序即可。

**Q: 如何查看配置？**
A: 选择"📊 查看完整状态"或直接查看`config.json`文件。

## 📁 项目文件说明

```
cli/
├── cli.js              # 启动入口
├── index.js            # 交互式主程序
├── config.json         # 配置文件（保存Cookie和座位信息）
├── package.json        # 依赖配置
├── lib/                # 核心模块
│   ├── config.js       # 配置管理
│   ├── cookie.js       # Cookie获取和验证
│   ├── reserve.js      # 预约逻辑
│   ├── scheduler.js    # 定时任务
│   ├── websocket.js    # WebSocket排队
│   └── http.js         # HTTP请求配置
├── start.sh            # Linux/Mac启动脚本
├── start.bat           # Windows启动脚本
└── README.md           # 详细说明
```

## 🚀 下一步

1. ✅ 安装依赖完成
2. ✅ 启动程序
3. ⏳ 设置Cookie
4. ⏳ 配置座位
5. ⏳ 启动自动预约

开始使用：`npm start`

---

**需要帮助？** 查看 [完整README](./README.md) 或提交 [Issue](https://github.com/A164759920/I_Goto_Library/issues)
