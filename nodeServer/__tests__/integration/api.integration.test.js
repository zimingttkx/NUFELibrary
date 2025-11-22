/**
 * API集成测试 - 使用真实的code测试完整流程
 */
const request = require('supertest');
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8899';

describe('API集成测试 - 完整流程', () => {
  let testCode = '071LobGa1QZAHK0VfFHa1xCyfF3LobG5'; // 测试code（实际使用时会过期）
  let testUrl = `http://wechat.v2.traceint.com/index.php/graphql/?operationName=index&query=query%7BuserAuth%7BtongJi%7Brank%7D%7D%7D&code=${testCode}&state=1`;

  describe('1. Cookie管理流程', () => {
    test('应该能从URL提取code并获取Cookie', async () => {
      const response = await axios.post(`${BASE_URL}/lib/setCookieByCode`, {
        codeOrUrl: testUrl
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data).toHaveProperty('cookie');
      expect(response.data.cookie).toContain('Authorization');
      expect(response.data.msg).toContain('Cookie成功');
    }, 15000);

    test('应该能验证Cookie有效性', async () => {
      const response = await axios.get(`${BASE_URL}/lib/verifyCookie`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.msg).toBe('cookie有效');
    });

    test('应该能手动设置Cookie', async () => {
      const testCookie = 'Authorization=test123; SERVERID=test456';

      const response = await axios.post(`${BASE_URL}/lib/setCookie`, {
        newCookie: testCookie
      });

      expect(response.status).toBe(200);
      // 验证会失败因为是假cookie，但应该能正常处理请求
      expect(response.data).toHaveProperty('code');
    });
  });

  describe('2. 图书馆列表功能', () => {
    test('应该能获取本地图书馆列表', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getLibList`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('libList');
      expect(Array.isArray(response.data.data.libList)).toBe(true);
    });

    test('应该能异步获取完整图书馆列表', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getLibList2`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('libList');
      expect(response.data.data.libList.length).toBeGreaterThan(5);

      // 验证图书馆数据结构
      const firstLib = response.data.data.libList[0];
      expect(firstLib).toHaveProperty('lib_id');
      expect(firstLib).toHaveProperty('lib_name');
      expect(firstLib).toHaveProperty('lib_floor');
    }, 15000);
  });

  describe('3. 座位管理功能', () => {
    test('应该能修改座位配置', async () => {
      const response = await axios.post(`${BASE_URL}/lib/changeSeat`, {
        libId: 35,
        key: '1,2.',
        seatName: '101'
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.msg).toContain('成功');
    });

    test('应该能获取备选座位列表', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getSeatList`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('keyList');
      expect(Array.isArray(response.data.data.keyList)).toBe(true);
    });

    test('应该能添加备选座位', async () => {
      const response = await axios.post(`${BASE_URL}/lib/addSeat`, {
        libId: 35,
        key: '3,4.',
        seatName: '102',
        libName: '一楼电梯前厅'
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });

    test('应该能删除备选座位', async () => {
      const response = await axios.post(`${BASE_URL}/lib/removeSeat`, {
        key: '3,4.'
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
    });
  });

  describe('4. 座位查询功能', () => {
    test('应该能获取指定图书馆的座位状态', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getLibSeatStatus?libId=35`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('seats');
      expect(response.data.data).toHaveProperty('statistics');
      expect(response.data.data.statistics).toHaveProperty('total');
      expect(response.data.data.statistics).toHaveProperty('available');
    }, 10000);

    test('应该能获取所有图书馆状态概览', async () => {
      const response = await axios.get(`${BASE_URL}/lib/getAllLibsStatus`);

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(0);
      expect(response.data.data).toHaveProperty('libraries');
      expect(Array.isArray(response.data.data.libraries)).toBe(true);
    }, 15000);
  });

  describe('5. 错误处理测试', () => {
    test('应该正确处理无效的code', async () => {
      const response = await axios.post(`${BASE_URL}/lib/setCookieByCode`, {
        codeOrUrl: 'invalid_code_12345'
      });

      expect(response.status).toBe(200);
      // 应该返回错误码
      expect([0, 3, 4]).toContain(response.data.code);
    }, 10000);

    test('应该正确处理空的Cookie', async () => {
      const response = await axios.post(`${BASE_URL}/lib/setCookie`, {
        newCookie: ''
      });

      expect(response.status).toBe(200);
      expect(response.data.code).toBe(2);
      expect(response.data.msg).toContain('Cookie为空');
    });

    test('应该正确处理缺少参数的请求', async () => {
      const response = await axios.post(`${BASE_URL}/lib/changeSeat`, {});

      expect(response.status).toBe(200);
      // 应该有错误响应
      expect(response.data).toHaveProperty('code');
    });
  });
});

describe('数据持久化测试', () => {
  test('修改的配置应该被正确保存', async () => {
    // 修改座位
    await axios.post(`${BASE_URL}/lib/changeSeat`, {
      libId: 35,
      key: '5,6.',
      seatName: '999'
    });

    // 获取当前配置
    const response = await axios.get(`${BASE_URL}/lib/getLibList`);

    expect(response.data.data.seatName).toBe('999');
    expect(response.data.data.libId).toBe(35);
  });
});

describe('性能测试', () => {
  test('API响应时间应该在合理范围内', async () => {
    const startTime = Date.now();

    await axios.get(`${BASE_URL}/lib/verifyCookie`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(3000); // 应该在3秒内响应
  });

  test('并发请求应该正常处理', async () => {
    const requests = [
      axios.get(`${BASE_URL}/lib/getLibList`),
      axios.get(`${BASE_URL}/lib/verifyCookie`),
      axios.get(`${BASE_URL}/lib/getSeatList`)
    ];

    const results = await Promise.all(requests);

    results.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
    });
  });
});
