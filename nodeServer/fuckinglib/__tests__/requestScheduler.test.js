/**
 * 请求调度器单元测试
 */

const RequestScheduler = require('../requestScheduler');

describe('RequestScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new RequestScheduler({
      maxConcurrent: 10,
      requestsPerSecond: 50
    });
  });

  afterEach(() => {
    if (scheduler && scheduler.isRunning()) {
      scheduler.stop();
    }
  });

  test('应该正确初始化', () => {
    expect(scheduler.maxConcurrent).toBe(10);
    expect(scheduler.requestsPerSecond).toBe(50);
    expect(scheduler.isRunning()).toBe(false);
  });

  test('应该能够启动和停止', (done) => {
    let executionCount = 0;
    const task = async () => {
      executionCount++;
    };

    scheduler.start(task);
    expect(scheduler.isRunning()).toBe(true);

    setTimeout(() => {
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
      expect(executionCount).toBeGreaterThan(0);
      done();
    }, 200);
  });

  test('应该控制并发数量', (done) => {
    let currentConcurrent = 0;
    let maxConcurrentReached = 0;

    const task = async () => {
      currentConcurrent++;
      maxConcurrentReached = Math.max(maxConcurrentReached, currentConcurrent);
      await new Promise(resolve => setTimeout(resolve, 50));
      currentConcurrent--;
    };

    scheduler.start(task);

    setTimeout(() => {
      scheduler.stop();
      expect(maxConcurrentReached).toBeLessThanOrEqual(scheduler.maxConcurrent);
      done();
    }, 500);
  });

  test('应该正确统计信息', (done) => {
    let count = 0;
    const task = async () => {
      count++;
      if (count % 3 === 0) {
        throw new Error('模拟错误');
      }
    };

    scheduler.start(task);

    setTimeout(() => {
      scheduler.stop();
      const stats = scheduler.getStats();

      expect(stats.totalScheduled).toBeGreaterThan(0);
      expect(stats.totalCompleted).toBeGreaterThan(0);
      expect(stats.totalFailed).toBeGreaterThan(0);
      expect(stats.successRate).toBeDefined();
      expect(stats.actualRPS).toBeDefined();
      done();
    }, 500);
  });

  test('应该能够限流', (done) => {
    const scheduler2 = new RequestScheduler({
      maxConcurrent: 5,
      requestsPerSecond: 10
    });

    let executionCount = 0;
    const task = async () => {
      executionCount++;
    };

    scheduler2.start(task);

    setTimeout(() => {
      scheduler2.stop();
      const stats = scheduler2.getStats();

      // 1秒内应该接近10次请求
      expect(executionCount).toBeLessThan(15);
      expect(executionCount).toBeGreaterThan(5);
      expect(stats.throttled).toBeGreaterThan(0);
      done();
    }, 1000);
  });

  test('应该能够处理异步任务', (done) => {
    let results = [];
    const task = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      results.push(Date.now());
    };

    scheduler.start(task);

    setTimeout(() => {
      scheduler.stop();
      expect(results.length).toBeGreaterThan(0);
      done();
    }, 300);
  });
});
