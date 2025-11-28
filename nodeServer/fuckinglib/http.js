const { CookeObj, saveLibDataAsync } = require("./myCooke.js");
const axios = require("axios");

// 防抖保存 - 避免频繁写入文件
let saveTimer = null;
function debouncedSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveLibDataAsync().catch(err => {
      console.log("【http.js】保存Cookie失败:", err);
    });
  }, 5000); // 5秒内多次修改只保存一次
}
const UA =
  "Mozilla/5.0 (Linux; Android 10; TAS-AL00 Build/HUAWEITAS-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/107.0.5304.141 Mobile Safari/537.36 XWEB/5043 MMWEBSDK/20221109 MMWEBID/6856 MicroMessenger/8.0.31.2281(0x28001F59) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64";
function getSERVERID(cookies) {
  let serverid = "";
  // 修复：检查cookies是否存在且有内容
  if (!cookies || cookies.length === 0) {
    return serverid;
  }
  cookies[0].split(";").forEach((cookie) => {
    const keyValue = cookie.split("=");
    if (keyValue[0].includes("SERVERID")) {
      //console.log("getSERVERID", cookie);
      serverid = cookie;
    }
  });
  return serverid;
}

function resetSERVERID(newSERVERID) {
  let newCookie = "";
  CookeObj.Cookie.split(";").forEach((cookie) => {
    const keyValue = cookie.split("=");
    if (keyValue[0].trim().includes("SERVERID")) {
      // 修复：正确处理SERVERID的拼接，避免开头出现分号
      if (newCookie === "") {
        newCookie = newSERVERID;
      } else {
        newCookie = newCookie + `;${newSERVERID}`;
      }
    } else {
      // 跳过空cookie片段
      if (cookie.trim() === "") {
        return;
      }
      newCookie === ""
        ? (newCookie = newCookie + `${cookie.trim()}`)
        : (newCookie = newCookie + `;${cookie.trim()}`);
    }
  });
  CookeObj.Cookie = newCookie;
  //console.log("resetSERVERID", newCookie);

  // 防抖保存更新后的Cookie
  debouncedSave();

  return newCookie;
}
const DOMAIN = "https://wechat.v2.traceint.com";
const AxiosRequest = axios.create({
  baseURL: "",
  headers: {
    "App-Version": "2.0.14",
    "User-Agent": UA,
  },
});

AxiosRequest.interceptors.request.use(
  function (config) {
    config.headers["Cookie"] = CookeObj.Cookie;
    // console.log("请求拦截器", config.headers["Cookie"]);
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

AxiosRequest.interceptors.response.use(
  function (response) {
    const cookies = response.headers["set-cookie"];
    const serverID = getSERVERID(cookies);
    if (serverID) {
      resetSERVERID(serverID);
    }
    return response;
  },
  function (error) {
    console.log("拦截错误");
    return Promise.reject(error);
  }
);
//save(2);
module.exports = {
  AxiosRequest,
  DOMAIN,
  UA,
};
