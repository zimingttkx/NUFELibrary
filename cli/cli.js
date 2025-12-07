#!/usr/bin/env node

// 检查Node版本
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0]);

if (majorVersion < 14) {
  console.error('错误：需要 Node.js 14 或更高版本');
  console.error(`当前版本：${nodeVersion}`);
  process.exit(1);
}

// 启动主程序
require('./index.js');
