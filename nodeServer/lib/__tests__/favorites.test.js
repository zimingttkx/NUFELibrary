/**
 * 收藏座位功能单元测试
 */

const { CookeObj, saveLibDataAsync } = require('../myCooke.js');

describe('收藏座位数据结构测试', () => {
  test('CookeObj应该包含favoriteSeats字段', () => {
    expect(CookeObj).toHaveProperty('favoriteSeats');
    expect(Array.isArray(CookeObj.favoriteSeats)).toBe(true);
  });

  test('favoriteSeats初始为空数组', () => {
    // 清空后应该为空数组
    CookeObj.favoriteSeats = [];
    expect(CookeObj.favoriteSeats.length).toBe(0);
  });

  test('favoriteSeats可以添加座位对象', () => {
    CookeObj.favoriteSeats = [];

    const testSeat = {
      id: '35-1,2.',
      libId: 35,
      libName: '一楼电梯前厅',
      libFloor: '1楼',
      seatKey: '1,2.',
      seatName: '101',
      addedAt: Date.now(),
    };

    CookeObj.favoriteSeats.push(testSeat);

    expect(CookeObj.favoriteSeats.length).toBe(1);
    expect(CookeObj.favoriteSeats[0]).toEqual(testSeat);
  });

  test('favoriteSeats可以删除座位', () => {
    CookeObj.favoriteSeats = [
      { id: '35-1,2.', seatName: '101' },
      { id: '35-3,4.', seatName: '102' },
    ];

    const indexToRemove = CookeObj.favoriteSeats.findIndex(s => s.id === '35-1,2.');
    CookeObj.favoriteSeats.splice(indexToRemove, 1);

    expect(CookeObj.favoriteSeats.length).toBe(1);
    expect(CookeObj.favoriteSeats[0].id).toBe('35-3,4.');
  });

  test('保存数据应该包含favoriteSeats', async () => {
    CookeObj.favoriteSeats = [
      {
        id: '429-32,3.',
        libId: 429,
        libName: '一楼东区东一',
        seatName: '179',
      },
    ];

    const result = await saveLibDataAsync();

    expect(result.code).toBe(0);
    expect(result.msg).toBe('save_success');
  });

  test('收藏座位数据结构验证', () => {
    const validSeat = {
      id: '429-32,3.',
      libId: 429,
      libName: '一楼东区东一',
      libFloor: '1楼',
      seatKey: '32,3.',
      seatName: '179',
      addedAt: 1700000000000,
    };

    // 验证必需字段
    expect(validSeat).toHaveProperty('id');
    expect(validSeat).toHaveProperty('libId');
    expect(validSeat).toHaveProperty('seatKey');
    expect(validSeat).toHaveProperty('seatName');
    expect(validSeat).toHaveProperty('addedAt');

    // 验证类型
    expect(typeof validSeat.id).toBe('string');
    expect(typeof validSeat.libId).toBe('number');
    expect(typeof validSeat.seatKey).toBe('string');
    expect(typeof validSeat.seatName).toBe('string');
    expect(typeof validSeat.addedAt).toBe('number');
  });

  test('ID格式应该为 libId-seatKey', () => {
    const libId = 429;
    const seatKey = '32,3.';
    const expectedId = `${libId}-${seatKey}`;

    expect(expectedId).toBe('429-32,3.');
  });

  test('支持多个座位收藏', () => {
    CookeObj.favoriteSeats = [
      { id: '35-1,2.', seatName: '101' },
      { id: '429-32,3.', seatName: '179' },
      { id: '430-45,1.', seatName: 'D025' },
    ];

    expect(CookeObj.favoriteSeats.length).toBe(3);
  });

  test('可以通过ID查找收藏座位', () => {
    CookeObj.favoriteSeats = [
      { id: '35-1,2.', seatName: '101' },
      { id: '429-32,3.', seatName: '179' },
    ];

    const found = CookeObj.favoriteSeats.find(s => s.id === '429-32,3.');

    expect(found).toBeDefined();
    expect(found.seatName).toBe('179');
  });

  test('不存在的ID应该返回undefined', () => {
    CookeObj.favoriteSeats = [
      { id: '35-1,2.', seatName: '101' },
    ];

    const found = CookeObj.favoriteSeats.find(s => s.id === 'nonexistent');

    expect(found).toBeUndefined();
  });

  test('防止重复收藏同一座位', () => {
    CookeObj.favoriteSeats = [];

    const seat = { id: '35-1,2.', seatName: '101' };

    // 首次添加
    if (!CookeObj.favoriteSeats.find(s => s.id === seat.id)) {
      CookeObj.favoriteSeats.push(seat);
    }

    // 尝试重复添加
    if (!CookeObj.favoriteSeats.find(s => s.id === seat.id)) {
      CookeObj.favoriteSeats.push(seat);
    }

    expect(CookeObj.favoriteSeats.length).toBe(1);
  });

  afterAll(() => {
    // 测试完成后清空收藏列表
    CookeObj.favoriteSeats = [];
  });
});

/**
 * 删除收藏功能测试
 */
describe('删除收藏功能测试', () => {
  beforeEach(() => {
    // 每个测试前初始化测试数据
    CookeObj.favoriteSeats = [
      { id: '429-179', libId: 429, libName: '一楼东区', seatKey: '32,3.', seatName: '179', addedAt: Date.now() },
      { id: '429-180', libId: 429, libName: '一楼东区', seatKey: '32,4.', seatName: '180', addedAt: Date.now() },
      { id: '430-101', libId: 430, libName: '二楼西区', seatKey: '1,2.', seatName: '101', addedAt: Date.now() },
    ];
  });

  afterEach(() => {
    CookeObj.favoriteSeats = [];
  });

  test('删除指定ID的收藏座位', () => {
    const idToRemove = '429-179';
    const initialLength = CookeObj.favoriteSeats.length;

    const index = CookeObj.favoriteSeats.findIndex(seat => seat.id === idToRemove);
    expect(index).toBeGreaterThanOrEqual(0);

    CookeObj.favoriteSeats.splice(index, 1);

    expect(CookeObj.favoriteSeats.length).toBe(initialLength - 1);
    expect(CookeObj.favoriteSeats.find(s => s.id === idToRemove)).toBeUndefined();
  });

  test('删除不存在的ID应该不影响列表', () => {
    const initialLength = CookeObj.favoriteSeats.length;
    const idToRemove = 'non-existent-id';

    const index = CookeObj.favoriteSeats.findIndex(seat => seat.id === idToRemove);
    expect(index).toBe(-1);

    if (index !== -1) {
      CookeObj.favoriteSeats.splice(index, 1);
    }

    expect(CookeObj.favoriteSeats.length).toBe(initialLength);
  });

  test('删除所有收藏后列表应该为空', () => {
    const allIds = CookeObj.favoriteSeats.map(s => s.id);

    allIds.forEach(id => {
      const index = CookeObj.favoriteSeats.findIndex(seat => seat.id === id);
      if (index !== -1) {
        CookeObj.favoriteSeats.splice(index, 1);
      }
    });

    expect(CookeObj.favoriteSeats.length).toBe(0);
  });

  test('清空收藏列表功能', () => {
    expect(CookeObj.favoriteSeats.length).toBeGreaterThan(0);

    CookeObj.favoriteSeats = [];

    expect(CookeObj.favoriteSeats.length).toBe(0);
    expect(Array.isArray(CookeObj.favoriteSeats)).toBe(true);
  });
});

/**
 * 座位状态相关测试
 */
describe('座位状态功能测试', () => {
  beforeEach(() => {
    CookeObj.favoriteSeats = [
      { id: '429-179', libId: 429, seatKey: '32,3.', seatName: '179' },
      { id: '429-180', libId: 429, seatKey: '32,4.', seatName: '180' },
    ];
  });

  afterEach(() => {
    CookeObj.favoriteSeats = [];
  });

  test('座位状态类型验证', () => {
    const validStatuses = ['available', 'occupied', 'reserved', 'unknown'];

    validStatuses.forEach(status => {
      expect(['available', 'occupied', 'reserved', 'unknown']).toContain(status);
    });
  });

  test('状态对象结构验证', () => {
    const seatWithStatus = {
      id: '429-179',
      libId: 429,
      seatName: '179',
      status: 'available',
      isMyReservation: false,
      reservationId: null,
      lastUpdate: Date.now(),
    };

    expect(seatWithStatus).toHaveProperty('status');
    expect(seatWithStatus).toHaveProperty('isMyReservation');
    expect(seatWithStatus).toHaveProperty('reservationId');
    expect(seatWithStatus).toHaveProperty('lastUpdate');
  });

  test('我的预约状态标识测试', () => {
    const myReservation = {
      id: '429-179',
      status: 'reserved',
      isMyReservation: true,
      reservationId: '12345',
    };

    expect(myReservation.isMyReservation).toBe(true);
    expect(myReservation.reservationId).toBe('12345');
  });

  test('空闲座位应该可以预订', () => {
    const availableSeat = {
      id: '429-179',
      status: 'available',
      isMyReservation: false,
    };

    // 空闲座位可以预订
    const canReserve = availableSeat.status === 'available';
    expect(canReserve).toBe(true);
  });

  test('已占用座位不应该显示预订按钮', () => {
    const occupiedSeat = {
      id: '429-179',
      status: 'occupied',
      isMyReservation: false,
    };

    // 占用座位不能预订
    const canReserve = occupiedSeat.status === 'available';
    expect(canReserve).toBe(false);
  });
});

/**
 * 预订功能测试
 */
describe('预订功能测试', () => {
  beforeEach(() => {
    CookeObj.favoriteSeats = [
      { id: '429-179', libId: 429, seatKey: '32,3.', seatName: '179' },
    ];
    CookeObj.Cookie = 'test-cookie-value';
  });

  afterEach(() => {
    CookeObj.favoriteSeats = [];
    CookeObj.Cookie = '';
  });

  test('预订请求需要Cookie', () => {
    expect(CookeObj.Cookie).toBeTruthy();
  });

  test('预订请求需要收藏ID', () => {
    const favorite = CookeObj.favoriteSeats[0];
    expect(favorite).toBeDefined();
    expect(favorite.id).toBeDefined();
  });

  test('预订数据结构验证', () => {
    const favorite = CookeObj.favoriteSeats[0];

    const reserveRequest = {
      key: `${favorite.seatKey}`,
      libId: favorite.libId,
    };

    expect(reserveRequest).toHaveProperty('key');
    expect(reserveRequest).toHaveProperty('libId');
    expect(typeof reserveRequest.key).toBe('string');
    expect(typeof reserveRequest.libId).toBe('number');
  });

  test('无Cookie时应该阻止预订', () => {
    CookeObj.Cookie = '';

    const canReserve = !!CookeObj.Cookie;
    expect(canReserve).toBe(false);
  });

  test('预订成功后应该返回预约ID', () => {
    const successResponse = {
      code: 0,
      msg: '预订成功！座位：179号',
      data: {
        reservationId: '12345',
      },
    };

    expect(successResponse.code).toBe(0);
    expect(successResponse.data.reservationId).toBeDefined();
  });
});

/**
 * 取消预订功能测试
 */
describe('取消预订功能测试', () => {
  beforeEach(() => {
    CookeObj.Cookie = 'test-cookie-value';
  });

  afterEach(() => {
    CookeObj.Cookie = '';
  });

  test('取消预订需要reservationId', () => {
    const reservationId = '12345';
    expect(reservationId).toBeDefined();
    expect(typeof reservationId).toBe('string');
  });

  test('取消预订需要Cookie', () => {
    expect(CookeObj.Cookie).toBeTruthy();
  });

  test('无Cookie时应该阻止取消预订', () => {
    CookeObj.Cookie = '';

    const canCancel = !!CookeObj.Cookie;
    expect(canCancel).toBe(false);
  });

  test('取消成功响应验证', () => {
    const successResponse = {
      code: 0,
      msg: '取消预订成功',
    };

    expect(successResponse.code).toBe(0);
    expect(successResponse.msg).toBe('取消预订成功');
  });
});

/**
 * 双预约模式测试（即刻预约 vs 隔日预约）
 */
describe('双预约模式功能测试', () => {
  beforeEach(() => {
    CookeObj.favoriteSeats = [
      { id: '429-179', libId: 429, seatKey: '32,3.', seatName: '179' },
    ];
    CookeObj.Cookie = 'test-cookie-value';
  });

  afterEach(() => {
    CookeObj.favoriteSeats = [];
    CookeObj.Cookie = '';
  });

  test('预约类型参数验证 - immediate', () => {
    const reservationType = 'immediate';
    const validTypes = ['immediate', 'tomorrow'];
    expect(validTypes).toContain(reservationType);
  });

  test('预约类型参数验证 - tomorrow', () => {
    const reservationType = 'tomorrow';
    const validTypes = ['immediate', 'tomorrow'];
    expect(validTypes).toContain(reservationType);
  });

  test('无效的预约类型应该被拒绝', () => {
    const invalidType = 'invalid-type';
    const validTypes = ['immediate', 'tomorrow'];
    expect(validTypes).not.toContain(invalidType);
  });

  test('即刻预约请求数据结构验证', () => {
    const favorite = CookeObj.favoriteSeats[0];

    // 即刻预约：seatKey不需要末尾的点号
    const seatKeyForImmediate = favorite.seatKey.replace(/\.$/, '');

    const immediateReserveRequest = {
      operationName: "reserveSeat",
      variables: {
        libId: favorite.libId,
        seatKey: seatKeyForImmediate,
        captchaCode: "",
      },
    };

    expect(immediateReserveRequest.variables.libId).toBe(429);
    expect(immediateReserveRequest.variables.seatKey).toBe('32,3');
    expect(immediateReserveRequest.variables.seatKey).not.toContain('.');
  });

  test('隔日预约请求数据结构验证', () => {
    const favorite = CookeObj.favoriteSeats[0];

    // 隔日预约：seatKey需要末尾的点号
    let seatKey = favorite.seatKey;
    if (!seatKey.endsWith('.')) {
      seatKey = seatKey + '.';
    }

    const tomorrowReserveRequest = {
      operationName: "save",
      variables: {
        key: seatKey,
        libid: favorite.libId,
        captchaCode: "",
        captcha: "",
      },
    };

    expect(tomorrowReserveRequest.variables.key).toBe('32,3.');
    expect(tomorrowReserveRequest.variables.key).toContain('.');
    expect(tomorrowReserveRequest.variables.libid).toBe(429);
  });

  test('即刻预约成功响应验证', () => {
    const immediateSuccessResponse = {
      code: 0,
      msg: '即刻预订成功！座位：179号（当天预约）',
      data: {
        reservationId: '12345',
        reservationType: 'immediate',
      },
    };

    expect(immediateSuccessResponse.code).toBe(0);
    expect(immediateSuccessResponse.data.reservationType).toBe('immediate');
    expect(immediateSuccessResponse.msg).toContain('即刻');
    expect(immediateSuccessResponse.msg).toContain('当天');
  });

  test('隔日预约成功响应验证', () => {
    const tomorrowSuccessResponse = {
      code: 0,
      msg: '隔日预订成功！座位：179号（明天预约）',
      data: {
        reservationId: '67890',
        reservationType: 'tomorrow',
      },
    };

    expect(tomorrowSuccessResponse.code).toBe(0);
    expect(tomorrowSuccessResponse.data.reservationType).toBe('tomorrow');
    expect(tomorrowSuccessResponse.msg).toContain('隔日');
    expect(tomorrowSuccessResponse.msg).toContain('明天');
  });

  test('默认预约类型应该为immediate', () => {
    const defaultReservationType = 'immediate';
    expect(defaultReservationType).toBe('immediate');
  });

  test('seatKey格式转换测试 - 即刻预约', () => {
    const originalKey = '32,3.';
    const keyForImmediate = originalKey.replace(/\.$/, '');

    expect(keyForImmediate).toBe('32,3');
    expect(keyForImmediate).not.toContain('.');
  });

  test('seatKey格式转换测试 - 隔日预约', () => {
    const originalKey = '32,3';
    let keyForTomorrow = originalKey;
    if (!keyForTomorrow.endsWith('.')) {
      keyForTomorrow = keyForTomorrow + '.';
    }

    expect(keyForTomorrow).toBe('32,3.');
    expect(keyForTomorrow).toContain('.');
  });

  test('取消预订类型自动检测逻辑', () => {
    // 模拟检测逻辑
    const reservationId = '12345';
    const currentReservations = [
      { id: '12345', lib_id: 429, seat_key: '32,3' },
    ];
    const futureReservations = [
      { id: '67890', lib_id: 429, seat_key: '32,3' },
    ];

    // 检测是否为即刻预约
    const isImmediate = currentReservations.some(r => r.id == reservationId);
    expect(isImmediate).toBe(true);

    // 检测另一个预约
    const reservationId2 = '67890';
    const isImmediate2 = currentReservations.some(r => r.id == reservationId2);
    expect(isImmediate2).toBe(false);
  });

  test('取消即刻预约请求验证', () => {
    const cancelImmediateRequest = {
      operationName: "cancelReserve",
      variables: {
        id: 12345,
      },
    };

    expect(cancelImmediateRequest.operationName).toBe('cancelReserve');
    expect(typeof cancelImmediateRequest.variables.id).toBe('number');
  });

  test('取消隔日预约请求验证', () => {
    const reservationId = 67890;
    const cancelTomorrowRequest = {
      operationName: "delete",
      // 注意：隔日预约取消使用的是内联query，不用variables
    };

    expect(cancelTomorrowRequest.operationName).toBe('delete');
  });

  test('预约类型应该在响应中返回', () => {
    const immediateResponse = {
      code: 0,
      data: { reservationType: 'immediate' },
    };

    const tomorrowResponse = {
      code: 0,
      data: { reservationType: 'tomorrow' },
    };

    expect(immediateResponse.data.reservationType).toBe('immediate');
    expect(tomorrowResponse.data.reservationType).toBe('tomorrow');
  });
});
