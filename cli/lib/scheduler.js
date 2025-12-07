const { Cron } = require('croner');
const config = require('./config');
const { reserveSeatOnce, refreshPage } = require('./reserve');
const { createSocket } = require('./websocket');
const chalk = require('chalk');

let reserveInterval = null;
let currentSocket = null;
let refreshCount = 0;
let isRunning = false;

// 定时任务
let noticeTask = null;
let startTask = null;
let killTask = null;
let cleanTask = null;

// 预约座位（核心逻辑）
async function reserveSeat() {
  // 先建立WebSocket排队连接
  if (!currentSocket) {
    console.log(chalk.cyan('【提示】建立排队连接...'));
    currentSocket = createSocket(
      () => {
        // 预约成功回调
        stop();
        console.log(chalk.green('\n🎉 预约成功！程序自动停止。\n'));
      },
      (error) => {
        // 错误回调
        console.log(chalk.red(`【错误】${error}`));
        currentSocket = null;
      }
    );
  }

  // 降低频率：只在偶数次才发送预约请求
  if (refreshCount % 2 === 0) {
    try {
      // 先调用反防刷
      await refreshPage();
      console.log(chalk.gray('【提示】反防刷触发'));

      // 发送预约请求
      try {
        const result = await reserveSeatOnce();
        if (result.success) {
          console.log(chalk.green('【提示】预约请求提交成功'));
        }
      } catch (error) {
        // 忽略单次预约错误，继续轮询
      }
    } catch (error) {
      // 忽略反防刷错误
    }
  }

  refreshCount++;
}

// 启动自动预约
function start() {
  if (isRunning) {
    console.log(chalk.yellow('⚠ 自动预约已在运行中'));
    return;
  }

  const seatConfig = config.getSeatConfig();
  if (!seatConfig.seatName) {
    console.log(chalk.red('✗ 请先配置座位'));
    return;
  }

  console.log(chalk.cyan('\n【启动自动预约】'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(`目标座位: ${seatConfig.libName} - ${seatConfig.seatName}号`);
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  isRunning = true;
  config.setAutoReserve(true);

  // 每天0点清空状态
  cleanTask = Cron('0 0 * * *', { timezone: 'Asia/Shanghai' }, () => {
    console.log(chalk.gray('【定时任务】每日清理'));
    currentSocket = null;
    reserveInterval = null;
    refreshCount = 0;
  });

  // 19:45 发送提醒
  noticeTask = Cron('45 19 * * *', { timezone: 'Asia/Shanghai' }, () => {
    console.log(chalk.yellow('\n⏰ 【提醒】还有15分钟开始预约，请确保Cookie有效！\n'));
  });

  // 19:59:55 启动预约轮询器
  startTask = Cron('55 59 19 * * *', { timezone: 'Asia/Shanghai' }, () => {
    console.log(chalk.green('\n🚀 【开始】启动预约轮询器...\n'));

    // 每700ms执行一次预约
    reserveInterval = setInterval(() => {
      reserveSeat();
    }, 700);
  });

  // 20:05:00 停止预约轮询器
  killTask = Cron('0 5 20 * * *', { timezone: 'Asia/Shanghai' }, () => {
    console.log(chalk.yellow('\n⏱ 【超时】预约时间结束，停止轮询器\n'));

    if (currentSocket) {
      currentSocket.close();
      currentSocket = null;
    }

    if (reserveInterval) {
      clearInterval(reserveInterval);
      reserveInterval = null;
    }

    refreshCount = 0;
  });

  console.log(chalk.green('✓ 自动预约已启动！'));
  console.log(chalk.gray('\n定时任务：'));
  console.log(chalk.gray('  - 19:45  发送提醒'));
  console.log(chalk.gray('  - 19:59:55  启动预约'));
  console.log(chalk.gray('  - 20:05:00  停止预约'));
  console.log(chalk.yellow('\n⚠ 请保持程序运行\n'));
}

// 停止自动预约
function stop() {
  if (!isRunning) {
    return;
  }

  console.log(chalk.cyan('\n【停止自动预约】'));

  // 停止所有定时任务
  if (noticeTask) noticeTask.stop();
  if (startTask) startTask.stop();
  if (killTask) killTask.stop();
  if (cleanTask) cleanTask.stop();

  // 关闭WebSocket
  if (currentSocket) {
    currentSocket.close();
    currentSocket = null;
  }

  // 停止轮询器
  if (reserveInterval) {
    clearInterval(reserveInterval);
    reserveInterval = null;
  }

  refreshCount = 0;
  isRunning = false;
  config.setAutoReserve(false);

  console.log(chalk.green('✓ 自动预约已停止\n'));
}

// 获取运行状态
function getStatus() {
  return {
    isRunning,
    hasSocket: currentSocket !== null,
    hasInterval: reserveInterval !== null,
    refreshCount
  };
}

module.exports = {
  start,
  stop,
  getStatus
};
