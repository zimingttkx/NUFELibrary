// 测试添加收藏座位功能
const axios = require("axios");

async function testAddFavorite() {
  try {
    console.log("=== 测试添加收藏座位 ===\n");

    // 1. 先获取图书馆列表
    console.log("1. 获取图书馆列表...");
    const libListResponse = await axios.get("http://127.0.0.1:8899/lib/getLibList");
    if (libListResponse.data.code === 0) {
      const libs = libListResponse.data.data.libList;
      console.log(`✓ 成功获取 ${libs.length} 个图书馆`);
      console.log("  前3个图书馆:", libs.slice(0, 3).map(l => `${l.lib_floor} - ${l.lib_name}`));
    }

    // 2. 获取一个图书馆的座位列表
    const testLibId = 429; // 一楼东区东一
    console.log(`\n2. 获取图书馆 ${testLibId} 的座位列表...`);
    const seatsResponse = await axios.get("http://127.0.0.1:8899/lib/getLibSeats", {
      params: { libId: testLibId }
    });

    if (seatsResponse.data.code === 0) {
      const layout = seatsResponse.data.data.layout;
      console.log(`✓ 成功获取座位布局，共 ${layout.length} 个区域`);

      // 找到第一个有可用座位的区域
      let testSeat = null;
      for (const area of layout) {
        const availableSeat = area.seats.find(s => s.status === 0);
        if (availableSeat) {
          testSeat = {
            area: area.name,
            ...availableSeat
          };
          break;
        }
      }

      if (testSeat) {
        console.log(`  找到可用座位: ${testSeat.name}号 (区域: ${testSeat.area}, key: ${testSeat.key})`);
      } else {
        console.log("  ✗ 未找到可用座位");
      }
    } else {
      console.log("✗ 获取座位失败:", seatsResponse.data.msg);
    }

    // 3. 检查当前收藏列表
    console.log("\n3. 检查当前收藏列表...");
    const favoritesResponse = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeats");
    if (favoritesResponse.data.code === 0) {
      const favorites = favoritesResponse.data.data.favorites;
      console.log(`✓ 当前收藏 ${favorites.length} 个座位`);
      favorites.forEach(f => {
        console.log(`  - ${f.seatName}号 (${f.libName})`);
      });
    }

    // 4. 测试添加一个新的收藏（座位181）
    console.log("\n4. 测试添加收藏座位 181号...");
    const addResponse = await axios.post("http://127.0.0.1:8899/lib/addFavoriteSeat", {
      libId: 429,
      libName: "一楼东区东一",
      libFloor: "1楼",
      seatKey: "25,15", // 座位181的key
      seatName: "181"
    });

    if (addResponse.data.code === 0) {
      console.log("✓ 添加成功!");
      console.log("  返回数据:", addResponse.data.data);
    } else {
      console.log("✗ 添加失败:", addResponse.data.msg);
    }

    // 5. 再次检查收藏列表
    console.log("\n5. 验证添加结果...");
    const finalResponse = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeats");
    if (finalResponse.data.code === 0) {
      const favorites = finalResponse.data.data.favorites;
      console.log(`✓ 当前收藏 ${favorites.length} 个座位`);
      favorites.forEach(f => {
        console.log(`  - ${f.seatName}号 (${f.libName})`);
      });
    }

  } catch (error) {
    console.error("错误:", error.message);
    if (error.response) {
      console.error("响应:", error.response.data);
    }
  }
}

testAddFavorite();
