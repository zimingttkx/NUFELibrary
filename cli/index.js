#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const config = require('./lib/config');
const cookie = require('./lib/cookie');
const reserve = require('./lib/reserve');
const scheduler = require('./lib/scheduler');

// 清屏
console.clear();

// 显示欢迎信息
function showWelcome() {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║   📚 图书馆座位自动预约系统 (CLI版)   ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════╝\n'));
}

// 显示当前状态
function showStatus() {
  const cfg = config.load();
  console.log(chalk.yellow('\n【当前配置】'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(`Cookie状态: ${cfg.cookie ? chalk.green('✓ 已设置') : chalk.red('✗ 未设置')}`);
  console.log(`座位信息: ${cfg.seatName ? chalk.green(`✓ ${cfg.libName} - ${cfg.seatName}号`) : chalk.red('✗ 未配置')}`);
  console.log(`自动预约: ${cfg.autoReserve ? chalk.green('✓ 已启动') : chalk.gray('○ 未启动')}`);
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// 主菜单
async function showMainMenu() {
  showStatus();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '请选择操作：',
      choices: [
        { name: '🔑 设置Cookie', value: 'setCookie' },
        { name: '💺 配置座位', value: 'setSeat' },
        { name: '🧪 测试预约', value: 'testReserve' },
        { name: '⚡ 启动自动预约', value: 'startAuto' },
        { name: '🛑 停止自动预约', value: 'stopAuto' },
        { name: '📊 查看完整状态', value: 'status' },
        new inquirer.Separator(),
        { name: '❌ 退出程序', value: 'exit' }
      ]
    }
  ]);

  return action;
}

// 设置Cookie
async function handleSetCookie() {
  console.log(chalk.cyan('\n【设置Cookie】'));
  console.log(chalk.gray('提示：使用抓包工具(如HttpCanary)获取Cookie\n'));

  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: '选择获取方式：',
      choices: [
        { name: '手动输入Cookie', value: 'manual' },
        { name: '扫码获取Cookie', value: 'qrcode' },
        { name: '返回主菜单', value: 'back' }
      ]
    }
  ]);

  if (method === 'back') return;

  if (method === 'manual') {
    const { cookieValue } = await inquirer.prompt([
      {
        type: 'input',
        name: 'cookieValue',
        message: '请粘贴Cookie值：',
        validate: (input) => input.length > 0 || '请输入有效的Cookie'
      }
    ]);

    const result = await cookie.setCookie(cookieValue);
    if (result.success) {
      console.log(chalk.green('✓ Cookie设置成功！'));
    } else {
      console.log(chalk.red(`✗ Cookie无效：${result.message}`));
    }
  } else if (method === 'qrcode') {
    await cookie.setCookieByQRCode();
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 配置座位
async function handleSetSeat() {
  console.log(chalk.cyan('\n【配置座位】'));

  const cfg = config.load();
  if (!cfg.cookie) {
    console.log(chalk.red('✗ 请先设置Cookie！'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  // 获取图书馆列表
  const ora = require('ora');
  const spinner = ora('正在获取图书馆列表...').start();

  const libListResult = await reserve.getLibList();
  spinner.stop();

  if (!libListResult.success) {
    console.log(chalk.red(`✗ 获取失败：${libListResult.message}`));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  // 选择图书馆
  const { libId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'libId',
      message: '选择图书馆：',
      choices: libListResult.data.map(lib => ({
        name: `${lib.lib_floor} - ${lib.lib_name}`,
        value: lib.lib_id
      }))
    }
  ]);

  // 输入座位号
  const { seatName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'seatName',
      message: '请输入座位号：',
      validate: (input) => input.length > 0 || '请输入座位号'
    }
  ]);

  // 保存座位配置
  const result = await reserve.setSeat(libId, seatName);
  if (result.success) {
    console.log(chalk.green(`✓ 座位配置成功：${result.data.libName} - ${result.data.seatName}号`));
  } else {
    console.log(chalk.red(`✗ 配置失败：${result.message}`));
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 测试预约
async function handleTestReserve() {
  console.log(chalk.cyan('\n【测试预约】'));

  const cfg = config.load();
  if (!cfg.cookie || !cfg.seatName) {
    console.log(chalk.red('✗ 请先设置Cookie和座位！'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  const ora = require('ora');
  const spinner = ora('正在测试预约...').start();

  const result = await reserve.testReserve();
  spinner.stop();

  if (result.success) {
    console.log(chalk.green('✓ 测试成功！预约功能正常'));
  } else {
    console.log(chalk.red(`✗ 测试失败：${result.message}`));
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 启动自动预约
async function handleStartAuto() {
  console.log(chalk.cyan('\n【启动自动预约】'));

  const cfg = config.load();
  if (!cfg.cookie || !cfg.seatName) {
    console.log(chalk.red('✗ 请先设置Cookie和座位！'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  if (cfg.autoReserve) {
    console.log(chalk.yellow('⚠ 自动预约已在运行中'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认启动自动预约？（将在19:59:55自动执行）',
      default: true
    }
  ]);

  if (confirm) {
    scheduler.start();
    console.log(chalk.green('✓ 自动预约已启动！'));
    console.log(chalk.gray('  - 预约时间：每天 19:59:55'));
    console.log(chalk.gray('  - 提醒时间：每天 19:45'));
    console.log(chalk.yellow('\n⚠ 请保持程序运行，按Ctrl+C可退出'));
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 停止自动预约
async function handleStopAuto() {
  const cfg = config.load();
  if (!cfg.autoReserve) {
    console.log(chalk.yellow('⚠ 自动预约未运行'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
    return;
  }

  scheduler.stop();
  console.log(chalk.green('✓ 自动预约已停止'));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 显示完整状态
async function handleShowStatus() {
  const cfg = config.load();
  const cookieStatus = await cookie.checkStatus();

  console.log(chalk.cyan('\n【完整状态信息】'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  console.log(chalk.yellow('\nCookie信息:'));
  console.log(`  状态: ${cookieStatus.valid ? chalk.green('有效') : chalk.red('无效')}`);
  if (cookieStatus.expiry) {
    console.log(`  过期时间: ${cookieStatus.expiry}`);
  }

  console.log(chalk.yellow('\n座位配置:'));
  if (cfg.seatName) {
    console.log(`  图书馆: ${cfg.libName}`);
    console.log(`  座位号: ${cfg.seatName}`);
  } else {
    console.log(`  ${chalk.red('未配置')}`);
  }

  console.log(chalk.yellow('\n自动预约:'));
  console.log(`  状态: ${cfg.autoReserve ? chalk.green('运行中') : chalk.gray('未启动')}`);

  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  await inquirer.prompt([{ type: 'input', name: 'continue', message: '按回车继续...' }]);
}

// 主循环
async function main() {
  showWelcome();

  while (true) {
    console.clear();
    showWelcome();

    const action = await showMainMenu();

    switch (action) {
      case 'setCookie':
        await handleSetCookie();
        break;
      case 'setSeat':
        await handleSetSeat();
        break;
      case 'testReserve':
        await handleTestReserve();
        break;
      case 'startAuto':
        await handleStartAuto();
        break;
      case 'stopAuto':
        await handleStopAuto();
        break;
      case 'status':
        await handleShowStatus();
        break;
      case 'exit':
        console.log(chalk.cyan('\n👋 再见！\n'));
        process.exit(0);
    }
  }
}

// 错误处理
process.on('uncaughtException', (err) => {
  console.error(chalk.red('\n✗ 发生错误：'), err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.cyan('\n\n👋 程序已退出\n'));
  scheduler.stop();
  process.exit(0);
});

// 启动程序
main();
