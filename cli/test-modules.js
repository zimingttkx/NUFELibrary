// 测试所有模块是否能正常加载

console.log('测试CLI模块加载...\n');

try {
  console.log('1. 测试config模块...');
  const config = require('./lib/config');
  console.log('   ✓ config模块加载成功');

  console.log('2. 测试http模块...');
  const http = require('./lib/http');
  console.log('   ✓ http模块加载成功');

  console.log('3. 测试cookie模块...');
  const cookie = require('./lib/cookie');
  console.log('   ✓ cookie模块加载成功');

  console.log('4. 测试reserve模块...');
  const reserve = require('./lib/reserve');
  console.log('   ✓ reserve模块加载成功');

  console.log('5. 测试websocket模块...');
  const websocket = require('./lib/websocket');
  console.log('   ✓ websocket模块加载成功');

  console.log('6. 测试scheduler模块...');
  const scheduler = require('./lib/scheduler');
  console.log('   ✓ scheduler模块加载成功');

  console.log('\n✅ 所有模块加载成功！');
  console.log('\n可以使用以下命令启动程序：');
  console.log('  npm start');
  console.log('  或');
  console.log('  node cli.js');

  process.exit(0);
} catch (error) {
  console.error('\n❌ 模块加载失败：', error.message);
  console.error(error.stack);
  process.exit(1);
}
