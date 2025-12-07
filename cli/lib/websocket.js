const WebSocket = require('ws');
const config = require('./config');
const { UA } = require('./http');
const chalk = require('chalk');

const socketDOMAIN = 'ws://wechat.v2.traceint.com';

// 创建WebSocket连接的Key
function createSocketKey() {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
  return Buffer.from(uuid).toString('base64');
}

// 创建WebSocket排队连接
function createSocket(onSuccess, onError) {
  const cookie = config.getCookie();
  if (!cookie) {
    console.log(chalk.red('✗ 未设置Cookie'));
    if (onError) onError('未设置Cookie');
    return null;
  }

  let limitSendMsg = null;
  const clientPayload = JSON.stringify({ ns: 'prereserve/queue', msg: '' });

  const socket = new WebSocket(`${socketDOMAIN}/ws?ns=prereserve/queue`, {
    headers: {
      'User-Agent': UA,
      'App-Version': '2.0.14',
      Cookie: cookie,
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Version': 13,
      'Sec-WebSocket-Key': createSocketKey(),
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits'
    }
  });

  socket.on('open', () => {
    console.log(chalk.cyan('【WebSocket】连接成功，开始排队...'));
    socket.send(clientPayload);

    // 每600ms发送一次保活消息
    limitSendMsg = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(clientPayload);
      }
    }, 600);
  });

  socket.on('message', (rawData) => {
    try {
      const { ns, msg, code, data } = JSON.parse(rawData.toString());

      // 成功预约
      if (code === 0 && data === 0) {
        const successPrefix = '你已经成功登记了明天的';
        const msgPrefix = msg.split(',')[0];

        if (msgPrefix === successPrefix) {
          console.log(chalk.green('🎉【成功】预约成功！'));
          if (onSuccess) onSuccess();
          socket.close();
          return;
        }

        if (msg === '排队成功！请在2分钟内选择座位，否则需要重新排队。') {
          console.log(chalk.green('✓ 排队成功，准备抢座...'));
        }

        if (msg.includes('不在预约时间内')) {
          console.log(chalk.yellow('⏰ 当前不在预约时间，保持连接...'));
        }
      }

      // Cookie无效
      if (msg === 1000 || msg === '获取用户信息失败，请尝试重新进入此页面') {
        console.log(chalk.red('✗ Cookie无效'));
        if (onError) onError('Cookie无效');
        socket.close();
        return;
      }

      // 第一次握手
      if (code === 0 && data === 1) {
        console.log(chalk.gray('【提示】首次握手成功'));
      }
    } catch (error) {
      console.log(chalk.red('【错误】解析消息失败:', error.message));
    }
  });

  socket.on('error', (error) => {
    console.log(chalk.red('【WebSocket】连接错误:', error.message));
    if (onError) onError(error.message);
  });

  socket.on('close', () => {
    console.log(chalk.gray('【WebSocket】连接已关闭'));
    if (limitSendMsg) {
      clearInterval(limitSendMsg);
    }
  });

  return socket;
}

module.exports = {
  createSocket
};
