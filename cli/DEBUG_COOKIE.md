# Cookie获取问题排查指南

## 问题描述
扫码后显示"Cookie获取成功但验证失败"

## 调试步骤

### 1. 查看详细日志

现在程序会输出详细的调试信息：

```
正在使用code获取Cookie: 081xxxxx...

  请求URL: http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%2F%2...
  响应状态: 302
  获取到 2 个cookie
  Cookie1: Authorization=Bearer%20xxx...
  Cookie2: SERVERID=xxx...
  包含Authorization: true
  包含SERVERID: true

获取到的完整Cookie (xxx字符):
  Authorization=Bearer%20xxx; SERVERID=xxx...

正在验证Cookie...
  发送验证请求...
  验证响应状态: 200
  ✓ userAuth存在，Cookie有效
  可用图书馆数量: 13

✓ Cookie获取成功并验证通过！
Cookie已保存到配置文件
```

### 2. 常见问题诊断

#### 问题A：只获取到1个cookie
```
获取到 1 个cookie
⚠️ 只获取到1个cookie: xxx...
```
**原因**：code已过期或无效
**解决**：重新扫码获取新的code

#### 问题B：缺少Authorization字段
```
包含Authorization: false
包含SERVERID: true
Cookie中缺少Authorization字段，code可能无效或已过期
```
**原因**：code已被使用或过期
**解决**：重新扫码，确保立即使用新的code

#### 问题C：验证时userAuth不存在
```
验证响应状态: 200
✗ userAuth不存在，Cookie无效
```
**可能原因**：
1. Cookie格式不正确
2. 网络请求被拦截
3. 服务器返回了错误

**排查**：
- 检查Cookie是否包含完整的Authorization和SERVERID
- 查看是否有API错误信息输出
- 尝试手动输入相同的Cookie验证

#### 问题D：网络错误
```
验证出错: timeout of 5000ms exceeded
响应状态: undefined
```
**原因**：网络超时或无法连接到服务器
**解决**：检查网络连接，重试

### 3. 手动测试Cookie

如果扫码获取失败，可以尝试：

1. **使用抓包工具手动获取Cookie**
   ```bash
   # 使用HttpCanary等工具抓包
   # 复制完整Cookie值
   # 在CLI中选择"手动输入Cookie"
   ```

2. **对比Cookie格式**

   正确的Cookie格式应该包含：
   ```
   Authorization=Bearer%20eyJ0eXAiOiJKV1QiLCJhbGc...; SERVERID=xxx
   ```

   必须包含两部分：
   - `Authorization=Bearer%20...` （JWT token）
   - `SERVERID=...` （服务器ID）

3. **验证Cookie有效期**

   Cookie通常有效期为24小时，如果过期需要重新获取。

### 4. 测试工具

使用提供的测试脚本验证Cookie获取：

```bash
cd cli

# 测试完整的cookie获取流程（需要有效的code）
node test-cookie.js <你的code>

# 例如：
node test-cookie.js 081Q7CGa1nMDIK0FKfJa1EeJ041Q7CGh
```

测试脚本会输出：
- 请求URL
- 响应状态
- Cookie内容
- 是否包含Authorization和SERVERID
- 验证结果

### 5. 与原项目对比

CLI版本和nodeServer版本使用相同的逻辑：

| 组件 | CLI版本 | nodeServer版本 | 状态 |
|------|---------|----------------|------|
| auth URL | ✅ 相同 | ✅ 相同 | 一致 |
| cookie提取 | ✅ cookies[1] + cookies[0] | ✅ cookies[1] + cookies[0] | 一致 |
| 验证查询 | ✅ libLayout | ✅ libLayout | 一致 |

### 6. 常见错误代码

如果看到错误提示：

- **"Cookie不包含关键身份信息"** → code过期，重新扫码
- **"Cookie中缺少Authorization字段"** → code无效，重新扫码
- **"无法从链接中提取code参数"** → 链接不完整，复制完整链接
- **"验证出错: timeout"** → 网络问题，检查连接

### 7. 最佳实践

1. **立即使用code**：扫码后立即复制链接并使用，不要等待
2. **完整链接**：确保复制了包含`code=`参数的完整链接
3. **一次使用**：一个code只能使用一次，不要重复使用
4. **网络稳定**：确保网络连接稳定

### 8. 如果问题仍然存在

请提供以下信息：

1. 完整的调试日志输出
2. Cookie的格式（前50个字符）
3. 验证响应的详细信息
4. 是否能用相同的Cookie在Web版本正常使用

---

**提示**：现在程序会输出非常详细的调试信息，请运行一次扫码获取，然后把所有输出发给我，我可以帮你分析问题所在。
