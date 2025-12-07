# CLI版本 v1.0.1 - Cookie调试增强版

## 更新内容

### 调试功能增强 (2025-12-07 23:30)

**新增详细调试日志**

在Cookie获取过程中，程序现在会输出：

1. **code提取阶段**
   - 提取的code值（前20字符）

2. **Cookie获取阶段**
   - 请求URL（前80字符）
   - HTTP响应状态
   - 获取到的cookie数量
   - Cookie1内容（前30字符）
   - Cookie2内容（前30字符）
   - 是否包含Authorization
   - 是否包含SERVERID
   - 完整Cookie长度

3. **验证阶段**
   - 验证请求状态
   - userAuth是否存在
   - 可用图书馆数量
   - 错误详情（如果有）

**改进错误提示**

当验证失败时，会显示可能的原因：
- code已过期（code有效期很短）
- code已被使用过（一个code只能用一次）
- 网络问题导致验证失败

**使用方法**

```bash
cd cli
npm start

# 选择"扫码获取Cookie"
# 按照提示扫码并粘贴链接
# 查看详细的调试输出
```

**输出示例**

成功的情况：
```
正在使用code获取Cookie: 081Q7CGa1nMDIK0F...

  请求URL: http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%...
  响应状态: 302
  获取到 2 个cookie
  Cookie1: Authorization=Bearer%20eyJ0...
  Cookie2: SERVERID=a1b2c3d4e5f6...
  包含Authorization: true
  包含SERVERID: true

获取到的完整Cookie (189字符):
  Authorization=Bearer%20eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...; SERVERID=a1b2c3d4...

正在验证Cookie...
  Cookie为空，无法验证
  发送验证请求...
  验证响应状态: 200
  ✓ userAuth存在，Cookie有效
  可用图书馆数量: 13

✓ Cookie获取成功并验证通过！
Cookie已保存到配置文件
```

失败的情况：
```
正在使用code获取Cookie: 081Q7CGa1nMDIK0F...

  请求URL: http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%...
  响应状态: 302
  获取到 1 个cookie
  ⚠️ 只获取到1个cookie: SERVERID=xxx...

✗ Cookie获取成功但验证失败
可能原因：
  1. code已过期（code有效期很短）
  2. code已被使用过（一个code只能用一次）
  3. 网络问题导致验证失败

请重新扫码获取新的code
```

## 修复的问题

1. ✅ 添加Cookie格式检查（必须包含Authorization）
2. ✅ 添加详细的调试输出
3. ✅ 改进错误提示信息
4. ✅ 验证过程可视化

## 下一步

如果仍然遇到问题：
1. 查看完整的调试输出
2. 参考 [DEBUG_COOKIE.md](./DEBUG_COOKIE.md)
3. 使用测试脚本: `node test-cookie.js <code>`

---

**版本**: 1.0.1
**日期**: 2025-12-07
**状态**: 稳定版
