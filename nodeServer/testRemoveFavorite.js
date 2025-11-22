// 测试删除收藏座位功能
const axios = require("axios");

async function testRemoveFavorite() {
  try {
    console.log("=== 测试删除收藏座位 ===\n");

    // 1. 获取当前收藏列表
    console.log("1. 获取当前收藏列表...");
    const favoritesResponse = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeats");
    if (favoritesResponse.data.code === 0) {
      const favorites = favoritesResponse.data.data.favorites;
      console.log(`✓ 当前收藏 ${favorites.length} 个座位`);
      favorites.forEach(f => {
        console.log(`  - ID: ${f.id}, 座位: ${f.seatName}号 (${f.libName})`);
      });

      if (favorites.length === 0) {
        console.log("\n没有收藏座位可以删除");
        return;
      }

      // 2. 删除第一个收藏
      const toDelete = favorites[favorites.length - 1]; // 删除最后一个
      console.log(`\n2. 删除收藏座位: ${toDelete.seatName}号 (ID: ${toDelete.id})`);
      const deleteResponse = await axios.post("http://127.0.0.1:8899/lib/removeFavoriteSeat", {
        id: toDelete.id
      });

      if (deleteResponse.data.code === 0) {
        console.log("✓ 删除成功!", deleteResponse.data.msg);
      } else {
        console.log("✗ 删除失败:", deleteResponse.data.msg);
      }

      // 3. 验证删除结果
      console.log("\n3. 验证删除结果...");
      const finalResponse = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeats");
      if (finalResponse.data.code === 0) {
        const remaining = finalResponse.data.data.favorites;
        console.log(`✓ 当前收藏 ${remaining.length} 个座位`);
        remaining.forEach(f => {
          console.log(`  - ${f.seatName}号 (${f.libName})`);
        });

        if (!remaining.find(f => f.id === toDelete.id)) {
          console.log(`\n✓ 确认座位 ${toDelete.seatName}号 已被删除`);
        } else {
          console.log(`\n✗ 座位 ${toDelete.seatName}号 仍然存在`);
        }
      }
    }

  } catch (error) {
    console.error("错误:", error.message);
    if (error.response) {
      console.error("响应:", error.response.data);
    }
  }
}

testRemoveFavorite();
