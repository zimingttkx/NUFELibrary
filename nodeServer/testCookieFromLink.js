// 测试从链接获取Cookie
const axios = require("axios");

async function testCookieFromLink() {
  try {
    console.log("=== 测试从链接获取Cookie ===\n");

    const testUrl = "http://wechat.v2.traceint.com/index.php/graphql/?operationName=index&query=query%7BuserAuth%7BtongJi%7Brank%7D%7D%7D&code=081JYsGa1mvsIK0vhpJa16uO3W0JYsGl&state=1";

    console.log("测试链接:", testUrl);
    console.log("\n正在调用API...\n");

    const response = await axios.post("http://127.0.0.1:8899/lib/setCookieByCode", {
      codeOrUrl: testUrl
    });

    console.log("响应状态码:", response.status);
    console.log("响应数据:", JSON.stringify(response.data, null, 2));

    if (response.data.code === 0) {
      console.log("\n✓ Cookie获取成功!");
      console.log("Cookie:", response.data.cookie);
    } else {
      console.log("\n✗ Cookie获取失败");
      console.log("错误信息:", response.data.msg);
    }

  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    if (error.response) {
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCookieFromLink();
