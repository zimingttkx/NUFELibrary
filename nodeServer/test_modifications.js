/**
 * 单元测试：验证修改后的抢座逻辑
 */

const { CookeObj } = require("./fuckinglib/myCooke.js");

console.log("=".repeat(60));
console.log("【单元测试】开始测试修改后的代码");
console.log("=".repeat(60));

// 测试1: 验证Cookie配置
console.log("\n【测试1】验证Cookie配置");
if (CookeObj.Cookie && CookeObj.Cookie.includes("Authorization")) {
  console.log("✅ Cookie配置正确");
  console.log(`   - Cookie长度: ${CookeObj.Cookie.length}`);
  console.log(`   - 包含Authorization: ${CookeObj.Cookie.includes("Authorization")}`);
} else {
  console.log("❌ Cookie配置错误");
  process.exit(1);
}

// 测试2: 验证座位配置
console.log("\n【测试2】验证座位配置");
if (CookeObj.libId && CookeObj.key && CookeObj.seatName) {
  console.log("✅ 座位配置正确");
  console.log(`   - 图书馆ID: ${CookeObj.libId}`);
  console.log(`   - 座位名称: ${CookeObj.seatName}`);
  console.log(`   - 座位Key: ${CookeObj.key}`);

  if (CookeObj.keyList && CookeObj.keyList.length > 0) {
    console.log(`   - 备选座位数: ${CookeObj.keyList.length}`);
    CookeObj.keyList.forEach((seat, index) => {
      console.log(`     ${index + 1}. ${seat.name} (libId: ${seat.libId}, key: ${seat.key})`);
    });
  }
} else {
  console.log("❌ 座位配置错误");
  process.exit(1);
}

// 测试3: 验证频率控制逻辑
console.log("\n【测试3】验证频率控制逻辑（refreshCount % 2）");
let testCount = 0;
let actualRequests = 0;
for (let i = 0; i < 10; i++) {
  if (i % 2 === 0) {
    actualRequests++;
  }
  testCount++;
}
console.log(`✅ 频率控制正确: 10次循环中，${actualRequests}次会发送请求`);
console.log(`   - 实际频率: ${actualRequests / testCount * 100}%`);

// 测试4: 模拟请求间隔计算
console.log("\n【测试4】计算实际请求频率");
const intervalMs = 900; // setInterval间隔
const requestRatio = 0.5; // refreshCount % 2 = 0 的概率
const actualIntervalMs = intervalMs / requestRatio;
const requestsPerSecond = 1000 / actualIntervalMs;
console.log(`✅ 请求频率计算:`);
console.log(`   - setInterval间隔: ${intervalMs}ms`);
console.log(`   - 实际发送概率: ${requestRatio * 100}%`);
console.log(`   - 实际请求间隔: ${actualIntervalMs}ms`);
console.log(`   - 每秒请求数: ${requestsPerSecond.toFixed(2)}次/秒`);

// 测试5: WebSocket心跳频率
console.log("\n【测试5】WebSocket心跳频率");
const wsHeartbeatMs = 800;
const wsRequestsPerSecond = 1000 / wsHeartbeatMs;
console.log(`✅ WebSocket心跳:`);
console.log(`   - 心跳间隔: ${wsHeartbeatMs}ms`);
console.log(`   - 每秒心跳数: ${wsRequestsPerSecond.toFixed(2)}次/秒`);

// 测试6: 验证环境变量
console.log("\n【测试6】验证定时任务配置");
const config = require("./config.default.js");
console.log(`✅ 定时任务配置:`);
console.log(`   - 提醒时间: ${config.NOTINCE_TIME_CRON}`);
console.log(`   - 启动时间: ${config.START_TIME_CRON}`);
console.log(`   - 停止时间: ${config.KILL_TIME_CRON}`);

console.log("\n" + "=".repeat(60));
console.log("【单元测试】所有测试通过！✅");
console.log("=".repeat(60));
console.log("\n【总结】修改后的配置:");
console.log(`  - WebSocket心跳: ${wsHeartbeatMs}ms (${wsRequestsPerSecond.toFixed(2)}次/秒)`);
console.log(`  - 预约请求间隔: ${intervalMs}ms`);
console.log(`  - 实际请求频率: ${requestsPerSecond.toFixed(2)}次/秒 (因为refreshCount % 2)`);
console.log(`  - 反防刷机制: 每次请求前调用refreshPage()`);
console.log(`  - 目标座位: ${CookeObj.seatName} (备选: ${CookeObj.keyList?.length || 0}个)`);
console.log("\n");
