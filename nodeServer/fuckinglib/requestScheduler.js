/**
 * 高性能请求调度器
 * 特点：
 * 1. 控制并发数量，防止内存溢出
 * 2. 自动限流，保护本地服务器
 * 3. 统计信息，便于监控
 * 4. 优雅停止，防止资源泄漏
 */

class RequestScheduler {
  constructor(options = {}) {
    // 配置参数
    this.maxConcurrent = options.maxConcurrent || 50; // 最大并发数
    this.requestsPerSecond = options.requestsPerSecond || 100; // 每秒请求数
    this.minInterval = 1000 / this.requestsPerSecond; // 最小请求间隔（ms）

    // 运行状态
    this.running = false;
    this.currentConcurrent = 0;
    this.lastRequestTime = 0;

    // 统计信息
    this.stats = {
      totalScheduled: 0,
      totalCompleted: 0,
      totalFailed: 0,
      throttled: 0,
      startTime: null,
      endTime: null
    };

    // 定时器
    this.intervalTimer = null;
    this.requestQueue = [];
  }

  /**
   * 启动调度器
   * @param {Function} taskFunction - 要执行的任务函数
   */
  start(taskFunction) {
    if (this.running) {
      console.log("⚠️ 调度器已在运行中");
      return;
    }

    this.running = true;
    this.stats.startTime = Date.now();
    console.log(`🚀 请求调度器启动：最大并发${this.maxConcurrent}，目标${this.requestsPerSecond}次/秒`);

    // 使用setInterval定期调度任务
    this.intervalTimer = setInterval(() => {
      if (!this.running) return;

      // 检查并发数是否超限
      if (this.currentConcurrent >= this.maxConcurrent) {
        this.stats.throttled++;
        return;
      }

      // 检查是否需要限流
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        this.stats.throttled++;
        return;
      }

      // 执行任务
      this.scheduleTask(taskFunction);
      this.lastRequestTime = now;
    }, this.minInterval);
  }

  /**
   * 调度单个任务
   * @param {Function} taskFunction - 任务函数
   */
  async scheduleTask(taskFunction) {
    this.currentConcurrent++;
    this.stats.totalScheduled++;

    try {
      await taskFunction();
      this.stats.totalCompleted++;
    } catch (error) {
      this.stats.totalFailed++;
      // 静默处理错误，不影响其他请求
    } finally {
      this.currentConcurrent--;
    }
  }

  /**
   * 停止调度器
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.stats.endTime = Date.now();

    // 清理定时器
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    console.log(`⏹️ 请求调度器已停止`);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const runTime = this.stats.endTime
      ? (this.stats.endTime - this.stats.startTime) / 1000
      : (Date.now() - this.stats.startTime) / 1000;

    return {
      ...this.stats,
      runTime: runTime.toFixed(2) + 's',
      actualRPS: (this.stats.totalScheduled / runTime).toFixed(2),
      successRate: ((this.stats.totalCompleted / this.stats.totalScheduled) * 100).toFixed(2) + '%',
      currentConcurrent: this.currentConcurrent
    };
  }

  /**
   * 检查是否正在运行
   */
  isRunning() {
    return this.running;
  }
}

module.exports = RequestScheduler;
