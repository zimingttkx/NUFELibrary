const fs = require('fs');
const path = require('path');

const isPkg = typeof process.pkg !== 'undefined';
const appRoot = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '..');
const CONFIG_PATH = path.join(appRoot, 'config.json');

// 默认配置
const DEFAULT_CONFIG = {
  cookie: '',
  libId: '',
  libName: '',
  seatName: '',
  seatKey: '',
  libList: [],
  autoReserve: false
};

// 加载配置
function load() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      save(DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    }
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
    return { ...DEFAULT_CONFIG };
  }
}

// 保存配置
function save(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('保存配置文件失败:', error.message);
    return false;
  }
}

// 更新配置
function update(updates) {
  const config = load();
  const newConfig = { ...config, ...updates };
  return save(newConfig) ? newConfig : null;
}

// 获取Cookie
function getCookie() {
  const config = load();
  return config.cookie || '';
}

// 设置Cookie
function setCookie(cookie) {
  return update({ cookie });
}

// 获取座位配置
function getSeatConfig() {
  const config = load();
  return {
    libId: config.libId,
    libName: config.libName,
    seatName: config.seatName,
    seatKey: config.seatKey
  };
}

// 设置座位配置
function setSeatConfig(libId, libName, seatName, seatKey) {
  return update({ libId, libName, seatName, seatKey });
}

// 设置图书馆列表
function setLibList(libList) {
  return update({ libList });
}

// 获取图书馆列表
function getLibList() {
  const config = load();
  return config.libList || [];
}

// 设置自动预约状态
function setAutoReserve(status) {
  return update({ autoReserve: status });
}

// 获取自动预约状态
function getAutoReserve() {
  const config = load();
  return config.autoReserve || false;
}

module.exports = {
  load,
  save,
  update,
  getCookie,
  setCookie,
  getSeatConfig,
  setSeatConfig,
  setLibList,
  getLibList,
  setAutoReserve,
  getAutoReserve
};
