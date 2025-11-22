/**
 * 修复问题的综合测试
 * 测试三个主要修复：
 * 1. 收藏座位状态显示和预订功能
 * 2. 楼层占用情况数据加载
 */

const axios = require('axios');

const DOMAIN = 'http://127.0.0.1:8899';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function addTestResult(name, passed, message) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  testResults.details.push({ name, passed, message });
}

async function testCookieStatus() {
  console.log('\n========== 测试 Cookie 状态 ==========');
  try {
    const res = await axios.get(`${DOMAIN}/lib/getCookieStatus`);
    if (res.data.code === 0 && res.data.data) {
      addTestResult('Cookie状态检查', true,
        `Cookie${res.data.data.valid ? '有效' : '无效'}`);
      return res.data.data.valid;
    } else {
      addTestResult('Cookie状态检查', false, '无法获取Cookie状态');
      return false;
    }
  } catch (error) {
    addTestResult('Cookie状态检查', false, error.message);
    return false;
  }
}

async function testGetFavoriteSeats() {
  console.log('\n========== 测试 获取收藏座位列表 ==========');
  try {
    const res = await axios.get(`${DOMAIN}/lib/getFavoriteSeats`);
    if (res.data.code === 0) {
      const favorites = res.data.data.favorites || [];
      addTestResult('获取收藏列表', true,
        `成功获取${favorites.length}个收藏座位`);
      return favorites;
    } else {
      addTestResult('获取收藏列表', false, res.data.msg || '获取失败');
      return [];
    }
  } catch (error) {
    addTestResult('获取收藏列表', false, error.message);
    return [];
  }
}

async function testGetFavoriteSeatsStatus() {
  console.log('\n========== 测试 获取收藏座位状态 ==========');
  try {
    const res = await axios.get(`${DOMAIN}/lib/getFavoriteSeatsStatus`);
    if (res.data.code === 0) {
      const seats = res.data.data.seats || [];

      // 检查每个座位的状态
      let allHaveStatus = true;
      let unknownCount = 0;
      let availableCount = 0;
      let reservedCount = 0;
      let occupiedCount = 0;

      seats.forEach(seat => {
        if (!seat.status || seat.status === 'unknown') {
          unknownCount++;
          allHaveStatus = false;
        } else if (seat.status === 'available') {
          availableCount++;
        } else if (seat.status === 'reserved') {
          reservedCount++;
        } else if (seat.status === 'occupied') {
          occupiedCount++;
        }
      });

      console.log(`   状态统计: 空闲${availableCount}, 已预约${reservedCount}, 使用中${occupiedCount}, 未知${unknownCount}`);

      if (seats.length === 0) {
        addTestResult('座位状态查询', true, '没有收藏座位（这是正常的）');
      } else if (unknownCount === seats.length) {
        addTestResult('座位状态查询', false,
          `所有${seats.length}个座位状态都是未知 - 这是BUG！`);
      } else if (unknownCount > 0) {
        addTestResult('座位状态查询', false,
          `${unknownCount}/${seats.length}个座位状态未知`);
      } else {
        addTestResult('座位状态查询', true,
          `所有${seats.length}个座位状态正常`);
      }

      return seats;
    } else {
      addTestResult('座位状态查询', false, res.data.msg || '查询失败');
      return [];
    }
  } catch (error) {
    addTestResult('座位状态查询', false, error.message);
    return [];
  }
}

async function testFloorOccupancy() {
  console.log('\n========== 测试 楼层占用情况 ==========');
  try {
    const res = await axios.get(`${DOMAIN}/lib/getFloorOccupancy`);
    if (res.data.code === 0) {
      const floors = res.data.data.floors || [];
      const cookieValid = res.data.data.cookieValid;

      if (!cookieValid) {
        addTestResult('楼层占用情况', false, 'Cookie无效，无法获取数据');
        return [];
      }

      if (floors.length === 0) {
        addTestResult('楼层占用情况', false,
          '返回的楼层数为0 - 这是BUG！应该返回所有楼层数据');
      } else {
        // 检查每个楼层的数据完整性
        let validFloors = 0;
        floors.forEach(floor => {
          if (floor.total > 0 &&
              typeof floor.occupied === 'number' &&
              typeof floor.available === 'number') {
            validFloors++;
            console.log(`   ${floor.libName} (${floor.libFloor}): 总${floor.total}, 占${floor.occupied}, 空${floor.available}, 占用率${floor.occupancyRate}%`);
          }
        });

        if (validFloors === floors.length) {
          addTestResult('楼层占用情况', true,
            `成功获取${floors.length}个楼层的数据，所有数据完整`);
        } else {
          addTestResult('楼层占用情况', false,
            `${validFloors}/${floors.length}个楼层数据完整`);
        }
      }

      return floors;
    } else {
      addTestResult('楼层占用情况', false, res.data.msg || '获取失败');
      return [];
    }
  } catch (error) {
    addTestResult('楼层占用情况', false, error.message);
    return [];
  }
}

async function testReserveFavoriteSeat(favorites, seatsStatus) {
  console.log('\n========== 测试 预订收藏座位功能 ==========');

  if (favorites.length === 0) {
    console.log('⚠️  没有收藏座位，跳过预订测试');
    addTestResult('预订功能测试', true, '没有收藏座位（跳过）');
    return;
  }

  // 查找一个空闲的座位
  const availableSeat = seatsStatus.find(s => s.status === 'available');

  if (!availableSeat) {
    console.log('⚠️  没有空闲座位可供测试预订');
    addTestResult('预订功能测试', true, '没有空闲座位可测试（跳过）');
    return;
  }

  console.log(`   尝试预订座位: ${availableSeat.seatName}号 (状态: ${availableSeat.status})`);

  try {
    const res = await axios.post(`${DOMAIN}/lib/reserveFavoriteSeat`, {
      id: availableSeat.id
    });

    if (res.data.code === 0) {
      addTestResult('预订空闲座位', true,
        `成功预订座位${availableSeat.seatName}号`);

      // 尝试取消预订
      if (res.data.data && res.data.data.reservationId) {
        console.log(`   尝试取消预约ID: ${res.data.data.reservationId}`);
        try {
          const cancelRes = await axios.post(`${DOMAIN}/lib/cancelReservation`, {
            reservationId: res.data.data.reservationId
          });

          if (cancelRes.data.code === 0) {
            addTestResult('取消预订', true, '成功取消预订');
          } else {
            addTestResult('取消预订', false, cancelRes.data.msg || '取消失败');
          }
        } catch (error) {
          addTestResult('取消预订', false, error.message);
        }
      }
    } else {
      // 如果预订失败，检查错误信息是否合理
      const errorMsg = res.data.msg || '';
      if (errorMsg.includes('已被占用') || errorMsg.includes('已被预约')) {
        addTestResult('预订空闲座位', true,
          `预订失败但错误信息合理: ${errorMsg}`);
      } else {
        addTestResult('预订空闲座位', false,
          `预订失败: ${errorMsg}`);
      }
    }
  } catch (error) {
    addTestResult('预订空闲座位', false, error.message);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('开始运行综合测试...');
  console.log('='.repeat(60));

  // 1. 检查Cookie状态
  const cookieValid = await testCookieStatus();

  if (!cookieValid) {
    console.log('\n⚠️  Cookie无效，某些测试可能失败');
    console.log('   请先设置有效的Cookie后再运行测试');
  }

  // 2. 测试收藏座位功能
  const favorites = await testGetFavoriteSeats();
  const seatsStatus = await testGetFavoriteSeatsStatus();

  // 3. 测试楼层占用情况
  await testFloorOccupancy();

  // 4. 测试预订功能（如果有空闲座位）
  if (cookieValid) {
    await testReserveFavoriteSeat(favorites, seatsStatus);
  }

  // 打印测试总结
  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过: ${testResults.passed} ✅`);
  console.log(`失败: ${testResults.failed} ❌`);
  console.log(`成功率: ${(testResults.passed / testResults.total * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log('\n失败的测试详情:');
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.message}`);
      });
  }

  console.log('\n');

  // 返回测试是否全部通过
  return testResults.failed === 0;
}

// 运行测试
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
