// 详细测试Cookie验证错误
const axios = require("axios");

async function testDetail() {
  try {
    console.log("=== 详细测试Cookie验证 ===\n");

    // 测试验证Cookie API
    const validateResponse = await axios.post("http://127.0.0.1:8899/lib/validateCookie");
    console.log("完整响应:");
    console.log(JSON.stringify(validateResponse.data, null, 2));

    if (validateResponse.data.data.graphqlErrors) {
      console.log("\nGraphQL错误详情:");
      validateResponse.data.data.graphqlErrors.forEach((err, idx) => {
        console.log(`  错误 ${idx + 1}:`, JSON.stringify(err, null, 2));
      });
    }

  } catch (error) {
    console.error("错误:", error.message);
    if (error.response) {
      console.error("响应:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDetail();
