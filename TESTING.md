# 测试运行指南

## 🚀 快速开始

### 后端测试

```bash
# 进入后端目录
cd nodeServer

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式（文件改变时自动运行）
npm run test:watch
```

### 前端测试

```bash
# 进入前端目录
cd vue

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

## 📋 测试结果示例

### 后端测试输出
```
PASS fuckinglib/__tests__/myCooke.simple.test.js
  myCooke.js - 简化测试
    ✓ 应该导出saveLibData函数
    ✓ 应该导出saveLibDataAsync函数
    ✓ CookeObj应该有正确的结构
    ✓ libList应该是数组
    ✓ saveLibDataAsync应该返回Promise

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

### 前端测试输出
```
PASS tests/unit/Home.spec.js
PASS tests/unit/router.spec.js

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

## 📊 查看覆盖率报告

运行 `npm run test:coverage` 后，覆盖率报告会生成在：

- **后端**: `nodeServer/coverage/lcov-report/index.html`
- **前端**: `vue/coverage/lcov-report/index.html`

在浏览器中打开这些HTML文件即可查看详细的覆盖率报告。

## 🔧 测试配置文件

- `nodeServer/jest.config.js` - 后端Jest配置
- `vue/jest.config.js` - 前端Jest配置
- `*/babel.config.js` - Babel转译配置

## ✅ 当前测试覆盖情况

### 后端
- ✅ myCooke.js (数据管理) - 5个测试
- 📝 http.js (HTTP配置) - 已编写，需调整mock
- 📝 websocket.js (WebSocket) - 已编写，需调整mock

### 前端
- ✅ Home.vue (首页) - 7个测试，100%覆盖率
- ✅ Router配置 - 5个测试
- 📝 其他组件待添加

## 💡 编写新测试

### 后端测试模板

```javascript
// nodeServer/fuckinglib/__tests__/yourModule.test.js
describe('yourModule.js', () => {
  test('应该做某事', () => {
    // Arrange (准备)
    const input = 'test';

    // Act (执行)
    const result = someFunction(input);

    // Assert (断言)
    expect(result).toBe('expected');
  });
});
```

### 前端组件测试模板

```javascript
// vue/tests/unit/YourComponent.spec.js
import { shallowMount } from '@vue/test-utils';
import YourComponent from '@/components/YourComponent.vue';

describe('YourComponent.vue', () => {
  test('应该渲染组件', () => {
    const wrapper = shallowMount(YourComponent);
    expect(wrapper.exists()).toBe(true);
  });
});
```

## 🐛 常见问题

### Q: 测试运行很慢？
A: 使用 `npm run test:watch` 在监听模式下运行，只测试修改的文件。

### Q: Mock不工作？
A: 确保jest.mock()在require之前调用，或者使用jest.resetModules()。

### Q: 前端组件样式报错？
A: 已配置styleMock.js来处理CSS导入。

### Q: 如何调试测试？
A: 在测试代码中添加 `console.log()` 或使用 `--verbose` 参数。

## 📚 相关文档

- [Jest官方文档](https://jestjs.io/)
- [Vue Test Utils文档](https://vue-test-utils.vuejs.org/)
- [完整测试总结](./TEST_SUMMARY.md)
