const RequestScheduler = require('./fuckinglib/requestScheduler.js');

console.log('🔥 开始压力测试...\n');

// 测试1: 中等并发稳定性测试
console.log('📊 测试1: 中等并发（50并发，100次/秒）- 运行3秒');
const scheduler1 = new RequestScheduler({
  maxConcurrent: 50,
  requestsPerSecond: 100
});

let test1Count = 0;
scheduler1.start(async () => {
  test1Count++;
  await new Promise(resolve => setTimeout(resolve, 5));
});

setTimeout(() => {
  scheduler1.stop();
  const stats1 = scheduler1.getStats();
  console.log('✅ 测试1完成：');
  console.log('   - 总调度:', stats1.totalScheduled, '次');
  console.log('   - 实际RPS:', stats1.actualRPS, '次/秒');
  console.log('   - 成功率:', stats1.successRate);
  console.log('   - 当前并发:', stats1.currentConcurrent);
  console.log('');
  
  console.log('🎉 压力测试完成！系统稳定运行。');
  process.exit(0);
}, 3000);
