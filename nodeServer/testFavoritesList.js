// 测试收藏列表显示功能
const axios = require("axios");

async function testFavoritesList() {
  try {
    console.log("=== 测试收藏列表显示功能 ===\n");

    // 测试获取收藏列表
    console.log("1. 获取收藏列表...");
    const response = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeats");

    console.log("响应码:", response.data.code);
    console.log("响应消息:", response.data.msg);
    console.log("\n收藏列表详情:");

    if (response.data.code === 0) {
      const favorites = response.data.data.favorites;
      console.log(`✓ 成功获取 ${favorites.length} 个收藏座位\n`);

      if (favorites.length > 0) {
        console.log("收藏座位列表:");
        favorites.forEach((favorite, index) => {
          console.log(`  ${index + 1}. 座位 ${favorite.seatName}号`);
          console.log(`     图书馆: ${favorite.libName}`);
          console.log(`     楼层: ${favorite.libFloor}`);
          console.log(`     ID: ${favorite.id}`);
          console.log(`     座位键: ${favorite.seatKey}`);
          console.log("");
        });
      } else {
        console.log("  暂无收藏座位");
      }

      console.log("\n✓ 收藏列表显示功能测试通过！");
    } else {
      console.log("✗ 获取收藏列表失败");
    }

  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    if (error.response) {
      console.error("响应:", error.response.data);
    }
  }
}

testFavoritesList();
