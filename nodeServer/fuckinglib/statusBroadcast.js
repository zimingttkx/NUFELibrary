/**
 * 状态广播模块
 * 用于实时推送抢座状态到前端页面
 */

const WebSocket = require('ws');

// 存储所有连接的客户端
let clients = new Set();

// WebSocket服务器实例
let wss = null;

/**
 * 初始化WebSocket服务器
 */
function initWebSocketServer(server) {
  wss = new WebSocket.Server({
    server,
    path: '/status-ws'
  });

  wss.on('connection', (ws) => {
    console.log('📱【前端连接】新的浏览器客户端已连接');
    clients.add(ws);

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'connected',
      message: '已连接到抢座状态服务器',
      timestamp: Date.now()
    }));

    ws.on('close', () => {
      console.log('📱【前端断开】浏览器客户端已断开');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
      clients.delete(ws);
    });
  });

  console.log('✅ WebSocket状态广播服务器已启动');
}

/**
 * 广播状态到所有连接的客户端
 */
function broadcast(data) {
  const message = JSON.stringify({
    ...data,
    timestamp: Date.now()
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('发送消息失败:', error);
        clients.delete(client);
      }
    }
  });
}

/**
 * 发送任务启动消息
 */
function sendTaskStart(config) {
  broadcast({
    type: 'task_start',
    config: config
  });
}

/**
 * 发送WebSocket连接状态
 */
function sendWebSocketStatus(status, message) {
  broadcast({
    type: 'websocket_status',
    status: status,
    message: message
  });
}

/**
 * 发送抢座尝试状态
 */
function sendReserveAttempt(attemptCount, seatName) {
  broadcast({
    type: 'reserve_attempt',
    attemptCount: attemptCount,
    seatName: seatName
  });
}

/**
 * 发送错误消息
 */
function sendError(errorType, errorMessage) {
  broadcast({
    type: 'error',
    errorType: errorType,
    message: errorMessage
  });
}

/**
 * 发送成功消息
 */
function sendSuccess(seatName, libId) {
  broadcast({
    type: 'success',
    seatName: seatName,
    libId: libId
  });
}

/**
 * 发送任务停止消息
 */
function sendTaskStop(totalAttempts) {
  broadcast({
    type: 'task_stop',
    totalAttempts: totalAttempts
  });
}

/**
 * 发送排队状态
 */
function sendQueueStatus(message) {
  broadcast({
    type: 'queue_status',
    message: message
  });
}

/**
 * 发送座位切换消息
 */
function sendSeatSwitch(fromSeat, toSeat, reason) {
  broadcast({
    type: 'seat_switch',
    fromSeat: fromSeat,
    toSeat: toSeat,
    reason: reason
  });
}

module.exports = {
  initWebSocketServer,
  broadcast,
  sendTaskStart,
  sendWebSocketStatus,
  sendReserveAttempt,
  sendError,
  sendSuccess,
  sendTaskStop,
  sendQueueStatus,
  sendSeatSwitch
};
