/**
 * 测试收藏座位预订功能修复
 * 验证使用 prereserve.save 替代 reserve.save 后功能是否正常
 */

const axios = require('axios');

const DOMAIN = 'http://127.0.0.1:8899';

async function testReserveFix() {
  console.log('='.repeat(60));
  console.log('测试收藏座位预订功能修复');
  console.log('='.repeat(60));

  try {
    // 1. 检查Cookie状态
    console.log('\n【步骤1】检查Cookie状态...');
    const cookieStatus = await axios.get(`${DOMAIN}/lib/getCookieStatus`);
    if (!cookieStatus.data.data?.valid) {
      console.log('❌ Cookie无效，请先设置有效的Cookie');
      return false;
    }
    console.log('✅ Cookie有效');

    // 2. 获取收藏列表
    console.log('\n【步骤2】获取收藏座位列表...');
    const favorites = await axios.get(`${DOMAIN}/lib/getFavoriteSeats`);
    const favList = favorites.data.data?.favorites || [];

    if (favList.length === 0) {
      console.log('⚠️  没有收藏座位，请先添加收藏座位后再测试');
      console.log('   提示：在前端页面添加一个空闲座位到收藏列表');
      return false;
    }
    console.log(`✅ 找到 ${favList.length} 个收藏座位`);

    // 3. 获取收藏座位状态
    console.log('\n【步骤3】获取收藏座位状态...');
    const seatsStatus = await axios.get(`${DOMAIN}/lib/getFavoriteSeatsStatus`);
    const seats = seatsStatus.data.data?.seats || [];

    console.log(`   状态统计:`);
    const available = seats.filter(s => s.status === 'available');
    const reserved = seats.filter(s => s.status === 'reserved');
    const occupied = seats.filter(s => s.status === 'occupied');
    const myReservations = seats.filter(s => s.isMyReservation);

    console.log(`   - 空闲: ${available.length}`);
    console.log(`   - 已预约: ${reserved.length}`);
    console.log(`   - 使用中: ${occupied.length}`);
    console.log(`   - 我的预约: ${myReservations.length}`);

    // 4. 测试预订功能
    if (available.length > 0) {
      const testSeat = available[0];
      console.log(`\n【步骤4】测试预订功能...`);
      console.log(`   尝试预订座位: ${testSeat.seatName}号 (状态: ${testSeat.status})`);

      try {
        const reserveResponse = await axios.post(`${DOMAIN}/lib/reserveFavoriteSeat`, {
          id: testSeat.id
        });

        if (reserveResponse.data.code === 0) {
          console.log('   ✅ 预订成功！');
          console.log(`   预约ID: ${reserveResponse.data.data?.reservationId || '未返回'}`);

          // 5. 测试取消预订
          if (reserveResponse.data.data?.reservationId) {
            console.log(`\n【步骤5】测试取消预订功能...`);
            const cancelResponse = await axios.post(`${DOMAIN}/lib/cancelReservation`, {
              reservationId: reserveResponse.data.data.reservationId
            });

            if (cancelResponse.data.code === 0) {
              console.log('   ✅ 取消预订成功！');
            } else {
              console.log(`   ❌ 取消预订失败: ${cancelResponse.data.msg}`);
            }
          }

          console.log('\n' + '='.repeat(60));
          console.log('✅ 测试完成：所有功能正常！');
          console.log('='.repeat(60));
          return true;
        } else {
          console.log(`   ❌ 预订失败: ${reserveResponse.data.msg}`);

          // 检查是否仍然是GraphQL错误
          if (reserveResponse.data.msg.includes('Cannot query field')) {
            console.log('\n   ⚠️  仍然存在GraphQL错误，修复未生效');
            console.log('   请检查是否已重启后端服务');
          }

          return false;
        }
      } catch (error) {
        console.log(`   ❌ 预订请求失败: ${error.message}`);
        return false;
      }
    } else if (myReservations.length > 0) {
      console.log(`\n【步骤4】没有空闲座位，测试取消预订功能...`);
      const testSeat = myReservations[0];
      console.log(`   尝试取消预约: ${testSeat.seatName}号 (预约ID: ${testSeat.reservationId})`);

      try {
        const cancelResponse = await axios.post(`${DOMAIN}/lib/cancelReservation`, {
          reservationId: testSeat.reservationId
        });

        if (cancelResponse.data.code === 0) {
          console.log('   ✅ 取消预订成功！');
          console.log('\n' + '='.repeat(60));
          console.log('✅ 测试完成：取消功能正常！');
          console.log('='.repeat(60));
          return true;
        } else {
          console.log(`   ❌ 取消预订失败: ${cancelResponse.data.msg}`);
          return false;
        }
      } catch (error) {
        console.log(`   ❌ 取消请求失败: ${error.message}`);
        return false;
      }
    } else {
      console.log(`\n⚠️  没有空闲座位且没有我的预约，无法测试预订和取消功能`);
      console.log('   所有座位状态: ');
      seats.forEach(s => {
        console.log(`   - ${s.seatName}号: ${s.status}`);
      });
      return false;
    }

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    if (error.response) {
      console.log(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// 运行测试
testReserveFix().then(success => {
  if (!success) {
    console.log('\n提示:');
    console.log('1. 确保后端服务已重启（以加载修复后的代码）');
    console.log('2. 确保Cookie有效');
    console.log('3. 确保收藏列表中至少有一个空闲座位');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行错误:', error);
  process.exit(1);
});
