/**
 * 收藏座位功能集成测试
 * 测试完整的API调用流程
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8899';

describe('收藏座位管理 API集成测试', () => {
  // 测试数据
  const testSeat = {
    libId: 35,
    libName: '一楼电梯前厅',
    libFloor: '1楼',
    seatKey: '1,2.',
    seatName: '101',
  };

  // 先清空收藏列表
  beforeAll(async () => {
    try {
      await axios.delete(`${BASE_URL}/lib/clearFavoriteSeats`);
    } catch (error) {
      // 忽略错误，可能列表本来就是空的
    }
  });

  describe('1. 添加收藏座位', () => {
    test('应该能成功添加收藏座位', async () => {
      const response = await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, testSeat);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.msg).toContain('成功');
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data.id).toBe(`${testSeat.libId}-${testSeat.seatKey}`);
    });

    test('重复添加同一座位应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, testSeat);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('已在收藏列表');
    });

    test('缺少参数应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, {
        libId: 35,
        // 缺少其他必需参数
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('参数错误');
    });
  });

  describe('2. 获取收藏列表', () => {
    test('应该能获取收藏座位列表', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getFavoriteSeats`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('favorites');
      expect(response.data.data).toHaveProperty('total');
      expect(Array.isArray(response.data.data.favorites)).toBe(true);
      expect(response.data.data.total).toBeGreaterThan(0);
    });

    test('收藏列表应该包含刚添加的座位', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getFavoriteSeats`);

      const found = response.data.data.favorites.find(
        (s) => s.id === `${testSeat.libId}-${testSeat.seatKey}`
      );

      expect(found).toBeDefined();
      expect(found.seatName).toBe(testSeat.seatName);
    });
  });

  describe('3. 删除收藏座位', () => {
    test('应该能删除指定的收藏座位', async () => {
      const id = `${testSeat.libId}-${testSeat.seatKey}`;
      const response = await axios.post(`${BASE_URL}/lib/removeFavoriteSeat`, { id });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.msg).toContain('成功');
    });

    test('删除不存在的座位应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/removeFavoriteSeat`, {
        id: 'nonexistent-id',
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('未找到');
    });

    test('缺少ID参数应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/removeFavoriteSeat`, {});

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('参数错误');
    });
  });

  describe('4. 清空收藏列表', () => {
    test('先添加几个座位', async () => {
      await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, {
        libId: 429,
        libName: '一楼东区东一',
        libFloor: '1楼',
        seatKey: '32,3.',
        seatName: '179',
      });

      await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, {
        libId: 430,
        libName: '一楼东区东二',
        libFloor: '1楼',
        seatKey: '45,1.',
        seatName: 'D025',
      });
    });

    test('应该能清空所有收藏', async () => {
      const response = await axios.delete(`${BASE_URL}/lib/clearFavoriteSeats`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.msg).toContain('已清空');
    });

    test('清空后列表应该为空', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getFavoriteSeats`);

      expect(response.data.data.total).toBe(0);
      expect(response.data.data.favorites.length).toBe(0);
    });
  });
});

describe('收藏座位监控 API集成测试', () => {
  // 添加测试座位用于后续测试
  beforeAll(async () => {
    // 清空列表
    await axios.delete(`${BASE_URL}/lib/clearFavoriteSeats`);

    // 添加测试座位
    await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, {
      libId: 35,
      libName: '一楼电梯前厅',
      libFloor: '1楼',
      seatKey: '1,2.',
      seatName: '101',
    });
  });

  describe('5. 测试预订功能可用性', () => {
    test('应该能测试预订功能', async () => {
      const response = await axios.get(`${BASE_URL}/lib/testReservationAvailable`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('available');
      expect(response.data).toHaveProperty('msg');
    });
  });

  describe('6. 查询收藏座位状态', () => {
    test('应该能查询收藏座位的状态', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getFavoriteSeatsStatus`);

      expect(response.status).toBe(200);

      // 如果有Cookie，应该返回状态
      if (response.data.code === 0) {
        expect(response.data.data).toHaveProperty('seats');
        expect(response.data.data).toHaveProperty('total');
        expect(Array.isArray(response.data.data.seats)).toBe(true);
      } else {
        // 无Cookie时应该提示
        expect(response.data.msg).toContain('Cookie');
      }
    });
  });

  describe('7. 预订座位', () => {
    test('预订收藏座位（需要有效Cookie）', async () => {
      const id = '35-1,2.';
      const response = await axios.post(`${BASE_URL}/lib/reserveFavoriteSeat`, { id });

      expect(response.status).toBe(200);

      // 成功或失败都应该有明确的消息
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('msg');

      if (response.data.code === 0) {
        // 预订成功
        expect(response.data.msg).toContain('成功');
      } else {
        // 预订失败（Cookie无效、座位已占、不在时间等）
        expect(response.data.msg).toBeDefined();
      }
    });

    test('预订不存在的收藏座位应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/reserveFavoriteSeat`, {
        id: 'nonexistent-id',
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('未找到');
    });
  });

  describe('8. 取消预订', () => {
    test('取消预订（需要有效的预约ID）', async () => {
      const response = await axios.post(`${BASE_URL}/lib/cancelReservation`, {
        reservationId: 'test-reservation-id',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('msg');

      // 无论成功失败，都应该有明确的消息
      expect(response.data.msg).toBeDefined();
    });

    test('缺少预约ID应该返回错误', async () => {
      const response = await axios.post(`${BASE_URL}/lib/cancelReservation`, {});

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(1);
      expect(response.data.msg).toContain('参数错误');
    });
  });

  // 清理
  afterAll(async () => {
    await axios.delete(`${BASE_URL}/lib/clearFavoriteSeats`);
  });
});

describe('收藏座位数据持久化测试', () => {
  test('添加的收藏应该被持久化保存', async () => {
    // 清空
    await axios.delete(`${BASE_URL}/lib/clearFavoriteSeats`);

    // 添加座位
    const testSeat = {
      libId: 429,
      libName: '一楼东区东一',
      seatKey: '32,3.',
      seatName: '179',
    };

    await axios.post(`${BASE_URL}/lib/addFavoriteSeat`, testSeat);

    // 获取列表
    const response = await axios.get(`${BASE_URL}/lib/getFavoriteSeats`);

    expect(response.data.data.total).toBe(1);
    expect(response.data.data.favorites[0].seatName).toBe('179');
  });
});

describe('性能测试', () => {
  test('API响应时间应该在合理范围内', async () => {
    const startTime = Date.now();
    await axios.get(`${BASE_URL}/lib/getFavoriteSeats`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(3000); // 应该在3秒内响应
  });

  test('并发请求应该正常处理', async () => {
    const requests = [
      axios.get(`${BASE_URL}/lib/getFavoriteSeats`),
      axios.get(`${BASE_URL}/lib/testReservationAvailable`),
      axios.get(`${BASE_URL}/lib/getFavoriteSeatsStatus`),
    ];

    const results = await Promise.all(requests);

    results.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
    });
  });
});
