// 测试Cookie状态检查功能
const axios = require("axios");

async function testCookieStatus() {
  try {
    console.log("=== 测试Cookie状态检查功能 ===\n");

    // 1. 检查Cookie状态
    console.log("1. 检查Cookie状态...");
    const statusResponse = await axios.get("http://127.0.0.1:8899/lib/getCookieStatus");

    console.log("响应码:", statusResponse.data.code);
    console.log("响应消息:", statusResponse.data.msg);
    console.log("\nCookie状态详情:");
    console.log(JSON.stringify(statusResponse.data.data, null, 2));

    if (statusResponse.data.code === 0) {
      const status = statusResponse.data.data;
      console.log("\n分析:");
      console.log(`  - 是否有Token: ${status.hasToken ? '✓' : '✗'}`);
      console.log(`  - 是否过期: ${status.expired ? '是' : '否'}`);
      console.log(`  - 是否有效: ${status.valid ? '✓' : '✗'}`);
      if (status.expiry) {
        console.log(`  - 过期时间: ${status.expiry}`);
      }
      console.log(`  - 检查时间: ${status.checkedAt}`);

      if (status.apiValidation) {
        console.log("\nAPI验证结果:");
        console.log(`  - 验证通过: ${status.apiValidation.valid ? '✓' : '✗'}`);
        console.log(`  - 原因: ${status.apiValidation.reason}`);
        if (status.apiValidation.userId) {
          console.log(`  - 用户ID: ${status.apiValidation.userId}`);
        }
      }
    }

    // 2. 测试验证Cookie API
    console.log("\n\n2. 测试验证Cookie API...");
    try {
      const validateResponse = await axios.post("http://127.0.0.1:8899/lib/validateCookie");
      console.log("验证响应:", validateResponse.data);
    } catch (error) {
      console.log("验证失败:", error.response?.data || error.message);
    }

    // 3. 测试收藏座位状态查询（需要有效Cookie）
    console.log("\n\n3. 测试收藏座位状态查询...");
    try {
      const favStatusResponse = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeatsStatus");
      if (favStatusResponse.data.code === 0) {
        console.log("✓ 收藏座位状态查询成功");
        const seats = favStatusResponse.data.data.seats;
        console.log(`  查询到 ${seats.length} 个座位的状态`);
        seats.forEach(s => {
          console.log(`  - ${s.seatName}号: ${s.status} ${s.error ? `(错误: ${s.error})` : ''}`);
        });
      } else {
        console.log("✗ 收藏座位状态查询失败:", favStatusResponse.data.msg);
      }
    } catch (error) {
      console.log("✗ 查询失败:", error.response?.data || error.message);
    }

  } catch (error) {
    console.error("错误:", error.message);
    if (error.response) {
      console.error("响应:", error.response.data);
    }
  }
}

testCookieStatus();
