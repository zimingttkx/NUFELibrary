const axios = require('axios');
const config = require('./config');

const DOMAIN = 'https://wechat.v2.traceint.com';
const UA = 'Mozilla/5.0 (Linux; Android 10; TAS-AL00 Build/HUAWEITAS-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/107.0.5304.141 Mobile Safari/537.36 XWEB/5043 MMWEBSDK/20221109 MMWEBID/6856 MicroMessenger/8.0.31.2281(0x28001F59) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64';

// 创建axios实例
const AxiosRequest = axios.create({
  baseURL: '',
  headers: {
    'App-Version': '2.0.14',
    'User-Agent': UA
  }
});

// 请求拦截器 - 自动添加Cookie
AxiosRequest.interceptors.request.use(
  function (axiosConfig) {
    const cookie = config.getCookie();
    if (cookie) {
      axiosConfig.headers['Cookie'] = cookie;
    }
    return axiosConfig;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 更新SERVERID
AxiosRequest.interceptors.response.use(
  function (response) {
    const cookies = response.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      const serverID = extractSERVERID(cookies);
      if (serverID) {
        updateSERVERID(serverID);
      }
    }
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 提取SERVERID
function extractSERVERID(cookies) {
  let serverid = '';
  if (!cookies || cookies.length === 0) {
    return serverid;
  }
  cookies[0].split(';').forEach((cookie) => {
    const keyValue = cookie.split('=');
    if (keyValue[0].includes('SERVERID')) {
      serverid = cookie;
    }
  });
  return serverid;
}

// 更新Cookie中的SERVERID
function updateSERVERID(newSERVERID) {
  const oldCookie = config.getCookie();
  if (!oldCookie) return;

  let newCookie = '';
  oldCookie.split(';').forEach((cookie) => {
    const keyValue = cookie.split('=');
    if (keyValue[0].trim().includes('SERVERID')) {
      if (newCookie === '') {
        newCookie = newSERVERID;
      } else {
        newCookie = newCookie + `;${newSERVERID}`;
      }
    } else {
      if (cookie.trim() === '') return;
      newCookie === ''
        ? (newCookie = newCookie + `${cookie.trim()}`)
        : (newCookie = newCookie + `;${cookie.trim()}`);
    }
  });

  config.setCookie(newCookie);
}

module.exports = {
  AxiosRequest,
  DOMAIN,
  UA
};
