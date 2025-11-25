// 简化的myCooke测试 - 测试导出的函数而不是IIFE加载
const fs = require('fs');
const path = require('path');

describe('myCooke.js - 简化测试', () => {
  let saveLibData, saveLibDataAsync;

  beforeAll(() => {
    // 模拟data.json文件确保加载成功
    const testDataPath = path.join(__dirname, '../data.json');
    const testData = {
      CookeObj: {
        Cookie: 'test-cookie',
        libId: 123,
        key: '1,2.',
        seatName: '101',
        keyList: []
      },
      libList: [
        { lib_id: 100, lib_floor: '1楼', lib_name: '测试馆' }
      ]
    };

    try {
      fs.writeFileSync(testDataPath, JSON.stringify(testData), 'utf8');
    } catch (e) {
      // 忽略错误
    }
  });

  beforeEach(() => {
    // 清除缓存，重新加载模块
    jest.resetModules();
    const myCooke = require('../myCooke.js');
    saveLibData = myCooke.saveLibData;
    saveLibDataAsync = myCooke.saveLibDataAsync;
  });

  test('应该导出saveLibData函数', () => {
    expect(typeof saveLibData).toBe('function');
  });

  test('应该导出saveLibDataAsync函数', () => {
    expect(typeof saveLibDataAsync).toBe('function');
  });

  test('CookeObj应该有正确的结构', () => {
    const myCooke = require('../myCooke.js');
    expect(myCooke.CookeObj).toHaveProperty('Cookie');
    expect(myCooke.CookeObj).toHaveProperty('libId');
    expect(myCooke.CookeObj).toHaveProperty('key');
    expect(myCooke.CookeObj).toHaveProperty('seatName');
    expect(myCooke.CookeObj).toHaveProperty('keyList');
  });

  test('libList应该是数组', () => {
    const myCooke = require('../myCooke.js');
    expect(Array.isArray(myCooke.libList)).toBe(true);
  });

  test('saveLibDataAsync应该返回Promise', () => {
    const result = saveLibDataAsync();
    expect(result).toBeInstanceOf(Promise);
  });
});
