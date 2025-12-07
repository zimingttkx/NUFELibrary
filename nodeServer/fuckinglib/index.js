const { CookeObj, libList, saveLibDataAsync } = require("./myCooke.js");
let { AxiosRequest, DOMAIN } = require("./http.js");
// const { throttleSendMail } = require("../service/email.service.js");
const { createSocket } = require("./websocket.js");
const { Event } = require("./pub-sub.js");
const { Cron } = require("croner");
const axios = require("axios");

const {
  NOTINCE_TIME_CRON,
  START_TIME_CRON,
  KILL_TIME_CRON,
} = require("../config.default.js");

var reserveInterval = null;
var currentSocket = null;
var refreshCount = 0;
var availableSeatStack = [];
/**
 * @deprecated 内存泄露弃用
 */
// 0点定时清空
// const cleanTask = cron.schedule(
//   "0 0 * * *",
//   () => {
//     currentSocket = null;
//     reserveInterval = null;
//   }
//   // {
//   //   timezone: "Asia/Shanghai",
//   // }
// );

// 0点定时清空
const cleanTask = Cron(
  "0 0 * * *",
  {
    timezone: "Asia/Shanghai",
  },
  () => {
    currentSocket = null;
    reserveInterval = null;
  }
);

/**
 * @deprecated 内存泄露弃用
 */
// // 发送提醒
// const noticeTsk = cron.schedule(
//   "45 19 * * *",
//   () => {
//     console.log("发送了提醒");
//     throttleSendMail("lib_notice");
//   }
//   // {
//   //   timezone: "Asia/Shanghai",
//   // }
// );

// 发送提醒
const noticeTsk = Cron(
  NOTINCE_TIME_CRON,
  {
    timezone: "Asia/Shanghai",
  },
  () => {
    console.log("发送了提醒");
    //throttleSendMail("lib_notice");
  }
);

/**
 * @deprecated 内存泄露弃用
 */
// // 循环预约请求
// const successTask = cron.schedule(
//   "20 19 20 * * *",
//   () => {
//     // 注册预约轮询器
//     reserveInterval = setInterval(() => {
//       reserveSeat();
//     }, 900);
//   }
//   // {
//   //   timezone: "Asia/Shanghai",
//   // }
// );

// 循环预约请求
const successTcatask = Cron(
  START_TIME_CRON,
  {
    timezone: "Asia/Shanghai",
  },
  () => {
    console.log("【定时任务】启动预约轮询器");
    // 注册预约轮询器（原仓库900ms，优化为700ms，提升约30%速度）
    reserveInterval = setInterval(() => {
      reserveSeat();
    }, 700);
  }
);
/**
 * @deprecated 内存泄露弃用
 */
// // 无论成功与否，都将在轮询器执行一分半后kill
// const killTask = cron.schedule(
//   "30 1 20 * * *",
//   () => {
//     currentSocket.close();
//     currentSocket = null;
//     clearInterval(reserveInterval);
//     reserveInterval = null;
//     refreshCount = 0;
//   }
//   // {
//   //   timezone: "Asia/Shanghai",
//   // }
// );

// 无论成功与否，都将在轮询器执行一分半后kill
const killTask = Cron(
  KILL_TIME_CRON,
  {
    timezone: "Asia/Shanghai",
  },
  () => {
    console.log("【定时任务】停止预约轮询器");
    currentSocket ? currentSocket.close() : (currentSocket = null);
    clearInterval(reserveInterval);
    reserveInterval = null;
    refreshCount = 0;
  }
);

/**
 * Cron 定时任务已自动启动（croner 库默认行为）
 * cleanTask: 每天 0:00 清空状态
 * noticeTsk: 每天 19:45 发送提醒
 * successTcatask: 每天 19:59:55 启动预约轮询器（900ms间隔）
 * killTask: 每天 20:05:00 停止预约轮询器
 */

// 注册success监听事件
Event.$on(
  "success",
  (fn = () => {
    // kill socket
    currentSocket?.close();
    currentSocket = null;
    // kill 轮询器
    clearInterval(reserveInterval);
    reserveInterval = null;
    refreshCount = 0;
    // throttleSendMail("lib_success");
    // 清除栈
    availableSeatStack = null;
  })
);

/**
 * @description ws获取用户信息失败重连
 */
Event.$on(
  "resetWs",
  (fn = () => {
    currentSocket?.close();
    currentSocket = null;
  })
);

/**
 * @description 无效cookie关闭连接
 */
Event.$on(
  "InvalidCookie",
  (fn = () => {
    currentSocket?.close();
    currentSocket = null;
    // kill 轮询器
    clearInterval(reserveInterval);
    reserveInterval = null;
    // 发送失败提醒
    // throttleSendMail("lib_fail");
    console.log("【提示】Cookie无效，请重新设置Cookie");
    refreshCount = 0;
  })
);

// 反防刷 v1.0
async function refreshPage() {
  const task1 = AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
    operationName: "prereserve",
    query:
      "query prereserve {\n userAuth {\n prereserve {\n prereserve {\n day\n lib_id\n seat_key\n seat_name\n is_used\n user_mobile\n id\n lib_name\n }\n }\n }\n}",
  });
  const task2 = AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
    operationName: "index",
    query:
      'query index {\n userAuth {\n user {\n prereserveAuto: getSchConfig(extra: true, fields: "prereserve.auto")\n }\n currentUser {\n sch {\n isShowCommon\n }\n }\n prereserve {\n libs {\n is_open\n lib_floor\n lib_group_id\n lib_id\n lib_name\n num\n seats_total\n }\n }\n oftenseat {\n prereserveList {\n id\n info\n lib_id\n seat_key\n status\n }\n }\n }\n}',
  });
  try {
    const res = await Promise.all([task1, task2]);
    if (res) {
      return Promise.resolve(res);
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * @description 预约座位（参考原始仓库逻辑）
 */
async function reserveSeat() {
  // 先排队，再抢座
  if (!currentSocket) {
    console.log("创建了socket-client");
    currentSocket = createSocket();
  }

  // 关键：只在偶数次才发送预约请求（降低频率避免拦截）
  if (refreshCount % 2 === 0) {
    try {
      // 先调用反防刷接口
      const res = await refreshPage();
      if (res) {
        console.log("【😆提示】反防刷触发");
        try {
          // 获取座位列表（支持多座位）
          const seatList = CookeObj.keyList && CookeObj.keyList.length > 0
            ? CookeObj.keyList
            : [{ name: CookeObj.seatName, key: CookeObj.key, libId: CookeObj.libId }];

          // 使用第一个座位
          const currentSeat = seatList[0];

          const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
            operationName: "save",
            query:
              "mutation save($key: String!, $libid: Int!, $captchaCode: String, $captcha: String) {\n userAuth {\n prereserve {\n save(key: $key, libId: $libid, captcha: $captcha, captchaCode: $captchaCode)\n }\n }\n}",
            variables: {
              key: `${currentSeat.key}.`,
              libid: Number(currentSeat.libId || CookeObj.libId),
              captchaCode: "",
              captcha: "",
            },
          });
          const { data, errors } = res.data;
          const { userAuth } = data;
          console.log("【reserveSeat】", userAuth);
          if (errors) {
            console.log("【错误】", errors[0].msg);
          } else {
            if (userAuth) {
              console.log("【提示】预约请求提交成功..");
            } else {
              console.log("其余情况");
            }
          }
        } catch (error) {
          console.log("[1005]【reserveSeat】意外错误");
        }
      }
    } catch (error) {
      console.log("刷新页面失败", error);
    }
  }
  refreshCount++;
}

async function verifyCookie() {
  try {
    const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "libLayout",
      query:
        "query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}",
      variables: { libId: CookeObj.libId },
    });
    const { data } = res.data;
    const { userAuth } = data;
    if (userAuth) {
      return {
        code: 0,
        msg: "cookie有效",
      };
    } else {
      return {
        code: 1,
        msg: "cookie无效",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      code: 1,
      msg: error,
    };
  }
}

/**
 * @description 自动测试预约功能（内部函数）
 * 查找任意空座，进行预约并取消，验证账号是否正常
 * @returns {Object} 测试结果
 */
async function autoTestReservation() {
  console.log("【自动测试】开始自动测试预约功能...");

  try {
    // 1. 获取阅览室列表
    const libListRes = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "list",
      query: "query list {\n userAuth {\n reserve {\n libs(libType: -1) {\n lib_id\n lib_floor\n is_open\n lib_name\n lib_type\n lib_rt {\n seats_total\n seats_used\n seats_booking\n seats_has\n }\n }\n }\n }\n}",
    });

    if (!libListRes.data.data?.userAuth?.reserve?.libs) {
      return { success: false, msg: "获取阅览室列表失败" };
    }

    const libs = libListRes.data.data.userAuth.reserve.libs;

    // 2. 遍历阅览室查找空座
    let availableSeat = null;
    let targetLib = null;

    for (const lib of libs) {
      if (!lib.is_open) continue;

      // 获取该阅览室的座位布局
      const layoutRes = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
        operationName: "libLayout",
        query: "query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_layout {\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}",
        variables: { libId: lib.lib_id },
      });

      const layout = layoutRes.data.data?.userAuth?.reserve?.libs?.[0]?.lib_layout;
      if (!layout) continue;

      // 查找空闲座位（type 1或5且seat_status为1）
      const SEAT_TYPES = [1, 5];
      for (const seat of layout.seats) {
        if (SEAT_TYPES.includes(seat.type) && seat.seat_status === 1) {
          availableSeat = seat;
          targetLib = lib;
          break;
        }
      }

      if (availableSeat) break;
    }

    if (!availableSeat) {
      return { success: false, msg: "暂无空闲座位可供测试" };
    }

    console.log(`【自动测试】找到空座：${targetLib.lib_name} - ${availableSeat.name}号`);

    // 3. 尝试预约
    const reserveData = {
      operationName: "save",
      query: "mutation save($key: String!, $libid: Int!, $captchaCode: String, $captcha: String) {\n userAuth {\n prereserve {\n save(key: $key, libId: $libid, captcha: $captcha, captchaCode: $captchaCode)\n }\n }\n}",
      variables: {
        key: `${availableSeat.key}.`,
        libid: targetLib.lib_id,
        captchaCode: "",
        captcha: "",
      },
    };

    const reserveRes = await axios.post(`${DOMAIN}/index.php/graphql/`, reserveData, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
    });

    if (reserveRes.data.errors) {
      const errorMsg = reserveRes.data.errors[0].msg || reserveRes.data.errors[0].message;
      return { success: false, msg: `预约失败：${errorMsg}` };
    }

    if (!reserveRes.data.data?.userAuth?.prereserve?.save) {
      return { success: false, msg: "预约返回数据异常" };
    }

    console.log("【自动测试】预约成功，正在取消...");

    // 4. 获取预约ID并取消
    const prereserveRes = await axios.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "prereserve",
      query: "query prereserve {\n userAuth {\n prereserve {\n prereserve {\n id\n lib_name\n seat_name\n }\n }\n }\n}",
      variables: {},
    }, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
    });

    const reservations = prereserveRes.data.data?.userAuth?.prereserve?.prereserve;
    if (reservations && reservations.length > 0) {
      const reservationId = reservations[0].id;

      await axios.post(`${DOMAIN}/index.php/graphql/`, {
        operationName: "delete",
        query: `mutation delete {\n userAuth {\n prereserve {\n delete(id: ${reservationId})\n }\n }\n}`,
        variables: {},
      }, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
      });

      console.log("【自动测试】已取消预约，测试完成");
    }

    return {
      success: true,
      msg: `系统正常！测试座位：${targetLib.lib_name} - ${availableSeat.name}号`
    };

  } catch (error) {
    console.log("【自动测试错误】", error.message);
    return { success: false, msg: `测试出错：${error.message}` };
  }
}

/**
 * @description 从包含code的URL中提取code参数
 */
function extractCodeFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    return code;
  } catch (error) {
    // 如果不是URL，尝试作为纯code处理
    return url;
  }
}

/**
 * @description 通过code获取cookie
 */
async function getCookieByCode(code) {
  try {
    const authUrl = `http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%2F%2Fweb.traceint.com%2Fweb%2Findex.html&code=${code}&state=1`;

    const response = await axios.get(authUrl, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // 接受重定向
      }
    });

    // 从响应头中提取cookie
    const cookies = response.headers['set-cookie'];

    if (cookies && cookies.length >= 2) {
      // 提取cookie值（格式：name=value; path=/; ...）
      const cookie1 = cookies[1].split(';')[0];
      const cookie2 = cookies[0].split(';')[0];
      return `${cookie1}; ${cookie2}`;
    } else if (cookies && cookies.length >= 1) {
      return cookies[0].split(';')[0];
    } else {
      throw new Error("Cookie不包含关键身份信息，可能是code过期");
    }
  } catch (error) {
    console.log("【getCookieByCode错误】", error.message);
    throw error;
  }
}

async function setCookieController(ctx) {
  const { newCookie } = ctx.request.body;
  if (newCookie) {
    CookeObj.Cookie = newCookie;
    try {
      const res = await verifyCookie();
      // 如果cookie有效，保存到文件并自动测试预约
      if (res.code === 0) {
        await saveLibDataAsync();
        // 自动测试预约功能
        const testResult = await autoTestReservation();
        res.testResult = testResult;
      }
      ctx.body = res;
    } catch (error) {
      ctx.body = {
        code: 1,
        msg: "[1001-verifyCookie]-failed",
      };
    }
  } else {
    ctx.body = {
      code: 2,
      msg: "[1002-newCookie]Cookie为空",
    };
  }
}

/**
 * @description 清除Cookie
 */
async function clearCookieController(ctx) {
  try {
    CookeObj.Cookie = "";
    await saveLibDataAsync();

    console.log("【清除Cookie】Cookie已清除");

    ctx.body = {
      code: 0,
      msg: "Cookie已清除"
    };
  } catch (error) {
    console.error("【清除Cookie错误】", error);
    ctx.body = {
      code: 1,
      msg: "清除Cookie失败：" + error.message
    };
  }
}

/**
 * @description 通过code或包含code的URL设置cookie
 */
async function setCookieByCodeController(ctx) {
  const { codeOrUrl } = ctx.request.body;

  if (!codeOrUrl) {
    ctx.body = {
      code: 1,
      msg: "请提供code或包含code的URL",
    };
    return;
  }

  try {
    // 从URL中提取code
    const code = extractCodeFromUrl(codeOrUrl);

    if (!code) {
      ctx.body = {
        code: 2,
        msg: "无法从链接中提取code参数",
      };
      return;
    }

    console.log(`【通过code获取Cookie】提取的code: ${code}`);

    // 通过code获取cookie
    const cookie = await getCookieByCode(code);

    console.log(`【通过code获取Cookie】获取到的cookie: ${cookie}`);

    // 设置cookie
    CookeObj.Cookie = cookie;

    // 验证cookie是否有效
    const verifyResult = await verifyCookie();

    if (verifyResult.code === 0) {
      // 保存到文件
      await saveLibDataAsync();

      // 自动测试预约功能
      const testResult = await autoTestReservation();

      ctx.body = {
        code: 0,
        msg: "通过code获取Cookie成功",
        cookie: cookie,
        testResult: testResult
      };
    } else {
      ctx.body = {
        code: 3,
        msg: "Cookie获取成功但验证失败，可能code已过期",
      };
    }
  } catch (error) {
    console.log("【setCookieByCode错误】", error.message);
    ctx.body = {
      code: 4,
      msg: `获取Cookie失败: ${error.message}`,
    };
  }
}
async function verifyCookieController(ctx) {
  try {
    const res = await verifyCookie();
    ctx.body = res;
  } catch (error) {
    ctx.body = {
      code: 1,
      msg: "[1003-verifyCookie]-failed",
    };
  }
}

/**
 * @description 根据座位名获取坐标key
 * @param {Array} seatList 座位表
 * @param {Number} seatName 座位名
 * @returns
 */
function getkeyByName(seatList, seatName) {
  for (const seat of seatList) {
    if (seat.name === seatName) {
      return seat.key;
    }
  }
  return null;
}
/**
 * @description 修改预约的座位（单座位版本）
 * @param {Number} libId
 * @param {String} seatName - 座位号
 */
async function changeSeatByLibIdandSeatNumber(libId, seatName) {
  try {
    const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "libLayout",
      query:
        "query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}",
      variables: {
        libId,
      },
    });
    // TODO :cookie无效时需要做前置拦截处理
    if (res.data.data && res.data.data.userAuth && res.data.data.userAuth.reserve) {
      const seatList = res.data.data.userAuth.reserve.libs[0].lib_layout.seats;

      // 查找单个座位的key
      const key = getkeyByName(seatList, seatName);

      if (!key) {
        return {
          code: 3,
          data: "[1008]座位号无效",
        };
      }

      // 保存座位信息
      CookeObj.libId = libId;
      CookeObj.key = key;
      CookeObj.seatName = seatName;

      // 🔧 修复：清空备选座位列表，确保只使用当前设置的座位
      // 这样可以避免抢座时使用旧的 keyList 中的座位
      CookeObj.keyList = [];

      console.log(`【座位设置】场馆ID: ${libId}, 座位号: ${seatName}`);
      console.log(`【座位设置】已清空备选座位列表，确保使用主座位配置`);

      // 保存到文件
      await saveLibDataAsync();

      return {
        code: 0,
        data: {
          libId,
          seatName: seatName,
          libName: getLibNamebyLibId(libId)
        },
      };
    } else {
      return {
        code: 1,
        data: "[1006]查询座位Key失败",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      code: 2,
      data: `[1007]暂无该区域:${libId}`,
      error,
    };
  }
}

function getLibNamebyLibId(libId) {
  for (let i = 0; i < libList.length; i++) {
    if (libList[i].lib_id == libId) {
      return libList[i].lib_name;
    }
  }
}

async function getLibList() {
  try {
    const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "list",
      query:
        "query list {\n userAuth {\n reserve {\n libs(libType: -1) {\n lib_id\n lib_floor\n is_open\n lib_name\n lib_type\n lib_group_id\n lib_comment\n lib_rt {\n seats_total\n seats_used\n seats_booking\n seats_has\n reserve_ttl\n open_time\n open_time_str\n close_time\n close_time_str\n advance_booking\n }\n }\n libGroups {\n id\n group_name\n }\n reserve {\n isRecordUser\n }\n }\n record {\n libs {\n lib_id\n lib_floor\n is_open\n lib_name\n lib_type\n lib_group_id\n lib_comment\n lib_color_name\n lib_rt {\n seats_total\n seats_used\n seats_booking\n seats_has\n reserve_ttl\n open_time\n open_time_str\n close_time\n close_time_str\n advance_booking\n }\n }\n }\n rule {\n signRule\n }\n }\n}",
    });
    const _LibList = res.data.data.userAuth.reserve.libs;

    // 清空该数组
    libList.splice(0, libList.length);

    // 遍历liblist
    _LibList.forEach((item) => {
      const libObj = {
        lib_id: item.lib_id,
        lib_floor: item.lib_floor,
        lib_name: item.lib_name,
      };
      libList.push(libObj);
    });

    // 异步保存数据
    const save_res = await saveLibDataAsync();

    if (save_res.code === 0) {
      return {
        code: 0,
        data: {
          libId: CookeObj.libId,
          libList,
          libName: getLibNamebyLibId(CookeObj.libId),
          seatName: CookeObj.seatName,
        },
      };
    } else {
      return {
        code: 1,
        data: "[1008]data.json写入失败",
      };
    }
  } catch (error) {
    return {
      code: 1,
      data: "[1009]获取区域列表错误",
    };
  }
}

/**
 * @description 异步获取场馆列表接口(需要cookie)
 */
async function asyncgetLibListController(ctx) {
  try {
    const res = await getLibList();
    if (res) {
      ctx.body = res;
    }
  } catch (error) {
    ctx.body = {
      code: 2,
      data: "[1009]获取区域列表错误",
    };
  }
}

/**
 * @description 同步获取场馆列表接口(无需cookie)
 * @return {Object} 返回所有可选场馆列表
 */
function syncgetLibListController(ctx) {
  ctx.body = {
    code: 0,
    data: {
      libId: CookeObj.libId,
      libList,
      libName: getLibNamebyLibId(CookeObj.libId),
      seatName: CookeObj.seatName,
    },
  };
}

async function changeSeatController(ctx) {
  const { libId, seatName } = ctx.request.body;
  if (libId && seatName) {
    const res = await changeSeatByLibIdandSeatNumber(libId, seatName);
    ctx.body = res;
  } else {
    ctx.body = {
      code: 1,
      data: "[1010]参数错误",
    };
  }
}

/**
 * @description 手动触发预约测试
 */
async function manualReserveController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }
  if (!CookeObj.key || !CookeObj.libId) {
    ctx.body = {
      code: 2,
      msg: "请先设置座位信息",
    };
    return;
  }

  console.log("【手动测试】开始预约...");
  try {
    await reserveSeat();
    ctx.body = {
      code: 0,
      msg: "预约请求已发送，请查看服务器日志",
    };
  } catch (error) {
    console.log("【手动测试错误】", error);
    ctx.body = {
      code: 3,
      msg: "预约失败",
      error: error.message,
    };
  }
}

/**
 * @description 启动持续预约测试（模拟定时任务）
 */
function startContinuousReserveController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }
  if (!CookeObj.key || !CookeObj.libId) {
    ctx.body = {
      code: 2,
      msg: "请先设置座位信息",
    };
    return;
  }

  if (reserveInterval) {
    ctx.body = {
      code: 3,
      msg: "预约轮询器已在运行中，无需重复启动",
    };
    return;
  }

  console.log("【持续预约测试】启动预约轮询器 - 极速模式...");
  console.log(`【持续预约测试】目标座位：${CookeObj.libId} - ${CookeObj.seatName}`);

  // 启动预约轮询器 - 极速抢座模式
  reserveInterval = setInterval(() => {
    // 并发发送3个请求
    reserveSeat();
    setTimeout(() => reserveSeat(), 50);
    setTimeout(() => reserveSeat(), 100);
  }, 150);  // 极限：150ms

  // 2分30秒后自动停止
  setTimeout(() => {
    if (currentSocket) {
      currentSocket.close();
      currentSocket = null;
    }
    if (reserveInterval) {
      clearInterval(reserveInterval);
      reserveInterval = null;
    }
    refreshCount = 0;
    console.log("【持续预约测试】轮询器已停止");
  }, 150000);

  ctx.body = {
    code: 0,
    msg: "持续预约已启动，将运行2分30秒，请查看手机微信公众号消息",
  };
}

/**
 * @description 生成扫码登录页面（使用参考项目的静态二维码）
 */
async function getQRCodePageController(ctx) {
  // 返回HTML页面
  ctx.type = 'html';
  ctx.body = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扫码获取Cookie - 我去图书馆</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
        }
        .qr-code {
            display: inline-block;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .qr-code img {
            width: 250px;
            height: 250px;
        }
        .steps {
            margin-top: 30px;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            transition: transform 0.2s;
        }
        .step:hover {
            transform: translateX(5px);
            background: #e9ecef;
        }
        .step-number {
            flex-shrink: 0;
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
        }
        .step-content {
            flex: 1;
        }
        .step-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .step-desc {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        .input-section {
            margin-top: 30px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            font-family: monospace;
            resize: vertical;
            min-height: 100px;
            transition: border-color 0.3s;
        }
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:active {
            transform: translateY(0);
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        .result.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .result.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }
        .warning strong {
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 扫码获取Cookie</h1>
        <p class="subtitle">自动预约图书馆座位 - 便捷登录方式</p>

        <div class="qr-section">
            <div class="qr-code">
                <img src="/static/qrcode.png" alt="扫码登录" />
            </div>
            <p style="margin-top: 15px; color: #666;">使用微信扫描上方二维码</p>
        </div>

        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <div class="step-title">扫描二维码</div>
                    <div class="step-desc">打开微信，扫描上方二维码进入"我去图书馆"页面</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <div class="step-title">复制链接</div>
                    <div class="step-desc">在打开的页面右上角点击"..."，选择"复制链接"</div>
                </div>
            </div>

            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <div class="step-title">粘贴链接</div>
                    <div class="step-desc">将复制的链接粘贴到下方输入框中，点击"获取Cookie"</div>
                </div>
            </div>
        </div>

        <div class="input-section">
            <div class="input-group">
                <label>📋 粘贴包含code的链接：</label>
                <textarea id="urlInput" placeholder="示例：http://wechat.v2.traceint.com/index.php/graphql/?operationName=index&query=...&code=XXXXX&state=1"></textarea>
            </div>

            <button class="btn" onclick="getCookie()">🚀 获取Cookie并启动测试</button>

            <div id="result" class="result"></div>
        </div>

        <div class="warning">
            <strong>⚠️ 注意事项：</strong>
            <ul style="margin-left: 20px; margin-top: 5px;">
                <li>链接中必须包含 code= 参数才有效</li>
                <li>code有效期很短，请扫码后立即复制链接</li>
                <li>获取成功后会自动设置Cookie并启动预约测试</li>
            </ul>
        </div>
    </div>

    <script>
        async function getCookie() {
            const urlInput = document.getElementById('urlInput').value.trim();
            const resultDiv = document.getElementById('result');

            if (!urlInput) {
                showResult('请先粘贴包含code的链接！', 'error');
                return;
            }

            if (!urlInput.includes('code=')) {
                showResult('链接中没有找到code参数，请确保复制了完整的链接！', 'error');
                return;
            }

            try {
                showResult('正在获取Cookie...', 'success');

                const response = await fetch('/lib/setCookieByCode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        codeOrUrl: urlInput
                    })
                });

                const data = await response.json();

                if (data.code === 0) {
                    showResult('✅ Cookie获取成功！请返回主界面选择场馆和座位', 'success');
                } else {
                    showResult('❌ 获取失败：' + data.msg, 'error');
                }
            } catch (error) {
                showResult('❌ 请求失败：' + error.message, 'error');
            }
        }

        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = message;
            resultDiv.className = 'result ' + type;
            resultDiv.style.display = 'block';
        }
    </script>
</body>
</html>
    `;
}

/**
 * @description 支持跨楼层多座位配置
 * @param {String} seatConfig 格式：429:179,180,181;430:200,201
 */
async function changeSeatMultiController(ctx) {
  const { seatConfig } = ctx.request.body;

  if (!seatConfig) {
    ctx.body = {
      code: 1,
      data: "请输入座位配置",
    };
    return;
  }

  // 检查Cookie是否已设置
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      data: "请先扫码或手动设置Cookie",
    };
    return;
  }

  try {
    // 解析配置：429:179,180,181;430:200,201
    const floorConfigs = seatConfig.split(';').map(s => s.trim()).filter(s => s);
    const allSeats = [];

    console.log(`【座位配置】开始处理，共${floorConfigs.length}个楼层配置`);

    for (const floorConfig of floorConfigs) {
      const [libIdStr, seatsStr] = floorConfig.split(':');
      if (!libIdStr || !seatsStr) {
        ctx.body = {
          code: 1,
          data: `格式错误：${floorConfig}，正确格式如：429:179,180`,
        };
        return;
      }

      const libId = parseInt(libIdStr.trim());
      const seatNames = seatsStr.split(',').map(s => s.trim()).filter(s => s);

      console.log(`【座位配置】获取楼层${libId}的座位列表，需要查找座位：${seatNames.join(',')}`);

      // 获取该楼层的座位列表
      try {
        const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
          operationName: "libLayout",
          query:
            "query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}",
          variables: {
            libId,
          },
        });

        console.log(`【座位配置】楼层${libId}的API响应:`, JSON.stringify(res.data).substring(0, 200));

        if (res.data.errors) {
          console.log(`【座位配置错误】API返回错误:`, res.data.errors);
          ctx.body = {
            code: 1,
            data: `API错误：${res.data.errors[0].msg || '未知错误'}`,
          };
          return;
        }

        if (!res.data.data || !res.data.data.userAuth || !res.data.data.userAuth.reserve) {
          console.log(`【座位配置错误】楼层${libId}返回数据结构异常`);
          ctx.body = {
            code: 1,
            data: `获取楼层${libId}的座位列表失败，请检查Cookie是否有效`,
          };
          return;
        }

        const seatList = res.data.data.userAuth.reserve.libs[0].lib_layout.seats;

        // 为每个座位号查找对应的key
        for (const seatName of seatNames) {
          const key = getkeyByName(seatList, seatName);
          if (key) {
            allSeats.push({
              libId: libId,
              name: seatName,
              key: key,
            });
          } else {
            console.log(`【警告】楼层${libId}的座位${seatName}未找到`);
          }
        }
      } catch (error) {
        console.log(`【错误】获取楼层${libId}座位列表失败:`, error);
        ctx.body = {
          code: 1,
          data: `获取楼层${libId}的座位列表失败：${error.message}`,
        };
        return;
      }
    }

    if (allSeats.length === 0) {
      ctx.body = {
        code: 1,
        data: "没有找到任何有效座位",
      };
      return;
    }

    // 保存座位信息
    CookeObj.libId = allSeats[0].libId;
    CookeObj.key = allSeats[0].key;
    CookeObj.seatName = allSeats[0].name;
    CookeObj.keyList = allSeats;

    // 写入文件
    try {
      await saveLibDataAsync();
      const seatSummary = allSeats.map(s => `楼层${s.libId}:${s.name}号`).join(', ');
      ctx.body = {
        code: 0,
        data: {
          message: `已配置${allSeats.length}个备选座位：${seatSummary}`,
        },
      };
    } catch (error) {
      ctx.body = {
        code: 1,
        data: "保存配置失败",
      };
    }
  } catch (error) {
    console.log("【changeSeatMulti错误】", error);
    ctx.body = {
      code: 1,
      data: "配置座位失败：" + error.message,
    };
  }
}

/**
 * @description 立即测试预约并自动取消
 */
async function testReserveAndCancelController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  // 检查是否设置了座位（支持单座位和多座位）
  const testSeat = CookeObj.keyList && CookeObj.keyList.length > 0
    ? CookeObj.keyList[0]
    : (CookeObj.key && CookeObj.libId
      ? { libId: CookeObj.libId, name: CookeObj.seatName, key: CookeObj.key }
      : null);

  if (!testSeat) {
    ctx.body = {
      code: 1,
      msg: "请先设置座位信息",
    };
    return;
  }

  console.log("【测试预约】开始测试...");

  try {
    // 第一步：检查是否已有预约
    console.log("【测试预约】检查现有预约...");
    const checkQuery = {
      operationName: "prereserve",
      query: "query prereserve {\n userAuth {\n prereserve {\n prereserve {\n day\n lib_id\n seat_key\n seat_name\n is_used\n user_mobile\n id\n lib_name\n }\n }\n }\n}",
      variables: {},
    };

    const checkRes = await axios.post(`${DOMAIN}/index.php/graphql/`, checkQuery, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
    });

    // 检查是否已有预约
    const existingReservations = checkRes.data.data?.userAuth?.prereserve?.prereserve || [];
    if (existingReservations.length > 0) {
      const reservation = existingReservations[0];
      console.log(`【测试预约】发现已有预约：${reservation.lib_name} - ${reservation.seat_name}号`);
      ctx.body = {
        code: 0,
        msg: `✅ 你已经预约成功了！\n座位：${reservation.lib_name} - ${reservation.seat_name}号\n预约ID: ${reservation.id}`,
      };
      return;
    }

    // 第二步：如果没有预约，尝试预约测试
    console.log(`【测试预约】尝试预约楼层${testSeat.libId || CookeObj.libId}的${testSeat.name}号座位`);

    // 构造预约请求（使用正确的prereserve.save API）
    const reserveData = {
      operationName: "save",
      query: "mutation save($key: String!, $libid: Int!, $captchaCode: String, $captcha: String) {\n userAuth {\n prereserve {\n save(key: $key, libId: $libid, captcha: $captcha, captchaCode: $captchaCode)\n }\n }\n}",
      variables: {
        key: `${testSeat.key}.`,
        libid: Number(testSeat.libId || CookeObj.libId),
        captchaCode: "",
        captcha: "",
      },
    };

    const reserveRes = await axios.post(`${DOMAIN}/index.php/graphql/`, reserveData, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
    });

    const errors = reserveRes.data.errors;
    const data = reserveRes.data.data;

    if (errors) {
      const errorMsg = errors[0].msg || errors[0].message;
      console.log(`【测试预约】预约失败：${errorMsg}`);

      // 区分不同的错误类型
      if (errorMsg.includes("排队")) {
        ctx.body = {
          code: 1,
          msg: `⚠️ 当前需要排队\n提示：${errorMsg}\n说明：现在不在预约时间段或需要WebSocket排队`,
        };
      } else if (errorMsg.includes("已被预约") || errorMsg.includes("不可预约")) {
        ctx.body = {
          code: 1,
          msg: `⚠️ 座位不可用\n提示：${errorMsg}`,
        };
      } else {
        ctx.body = {
          code: 1,
          msg: `测试失败：${errorMsg}`,
        };
      }
      return;
    }

    if (data && data.userAuth && data.userAuth.prereserve) {
      const saveResult = data.userAuth.prereserve.save;
      console.log(`【测试预约】预约成功！结果: ${saveResult}`);

      // 获取预约列表以获取token
      console.log("【测试预约】正在获取预约信息...");
      const prereserveQuery = {
        operationName: "prereserve",
        query: "query prereserve {\n userAuth {\n prereserve {\n prereserve {\n day\n lib_id\n seat_key\n seat_name\n is_used\n user_mobile\n id\n lib_name\n }\n }\n }\n}",
        variables: {},
      };

      const prereserveRes = await axios.post(`${DOMAIN}/index.php/graphql/`, prereserveQuery, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
      });

      if (prereserveRes.data.data?.userAuth?.prereserve?.prereserve?.length > 0) {
        const reservation = prereserveRes.data.data.userAuth.prereserve.prereserve[0];
        const reservationId = reservation.id;

        console.log("【测试预约】正在取消预约...");
        const cancelData = {
          operationName: "delete",
          query: `mutation delete {\n userAuth {\n prereserve {\n delete(id: ${reservationId})\n }\n }\n}`,
          variables: {},
        };

        const cancelRes = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelData, {
          headers: {
            Cookie: CookeObj.Cookie,
            "Content-Type": "application/json",
          },
        });

        if (cancelRes.data.errors) {
          console.log("【测试预约】取消失败，但预约成功");
          ctx.body = {
            code: 0,
            msg: `✅ 预约测试成功！但自动取消失败，请手动取消。预约ID: ${reservationId}`,
          };
        } else {
          console.log("【测试预约】已成功取消预约");
          ctx.body = {
            code: 0,
            msg: `✅ 预约测试成功！座位：楼层${testSeat.libId || CookeObj.libId}的${testSeat.name}号`,
          };
        }
      } else {
        ctx.body = {
          code: 0,
          msg: `✅ 预约测试成功！座位：楼层${testSeat.libId || CookeObj.libId}的${testSeat.name}号（无法自动取消，请手动处理）`,
        };
      }
    } else {
      ctx.body = {
        code: 1,
        msg: "测试失败：返回数据异常",
      };
    }
  } catch (error) {
    console.log("【测试预约错误】", error);
    ctx.body = {
      code: 1,
      msg: "测试失败：" + error.message,
    };
  }
}

/**
 * 添加座位到备选列表
 */
async function addSeatToListController(ctx) {
  const { libId, seatName } = ctx.request.body;

  if (!libId || !seatName) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要libId和seatName",
    };
    return;
  }

  try {
    // 获取座位的key
    const result = await changeSeatByLibIdandSeatNumber(libId, seatName);

    if (result.code !== 0) {
      ctx.body = result;
      return;
    }

    const key = result.data.key || CookeObj.key;
    const libName = result.data.libName;

    // 初始化keyList
    if (!CookeObj.keyList) {
      CookeObj.keyList = [];
    }

    // 检查是否已存在
    const exists = CookeObj.keyList.some(
      seat => seat.libId === libId && seat.name === seatName
    );

    if (exists) {
      ctx.body = {
        code: 1,
        msg: "该座位已在列表中",
      };
      return;
    }

    // 添加到列表
    CookeObj.keyList.push({
      libId,
      name: seatName,
      key,
      libName,
    });

    console.log(`【添加座位】场馆: ${libName}, 座位: ${seatName}`);

    // 保存到文件
    await saveLibDataAsync();

    ctx.body = {
      code: 0,
      msg: "添加成功",
      data: {
        libId,
        seatName,
        libName,
        total: CookeObj.keyList.length,
      },
    };
  } catch (error) {
    console.log("【添加座位错误】", error);
    ctx.body = {
      code: 1,
      msg: "添加失败：" + error.message,
    };
  }
}

/**
 * 从备选列表删除座位
 */
async function removeSeatFromListController(ctx) {
  const { libId, seatName } = ctx.request.body;

  if (!libId || !seatName) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要libId和seatName",
    };
    return;
  }

  try {
    if (!CookeObj.keyList || CookeObj.keyList.length === 0) {
      ctx.body = {
        code: 1,
        msg: "座位列表为空",
      };
      return;
    }

    const initialLength = CookeObj.keyList.length;
    CookeObj.keyList = CookeObj.keyList.filter(
      seat => !(seat.libId === libId && seat.name === seatName)
    );

    if (CookeObj.keyList.length === initialLength) {
      ctx.body = {
        code: 1,
        msg: "座位不在列表中",
      };
      return;
    }

    console.log(`【删除座位】场馆ID: ${libId}, 座位: ${seatName}`);

    // 保存到文件
    await saveLibDataAsync();

    ctx.body = {
      code: 0,
      msg: "删除成功",
      data: {
        remaining: CookeObj.keyList.length,
      },
    };
  } catch (error) {
    console.log("【删除座位错误】", error);
    ctx.body = {
      code: 1,
      msg: "删除失败：" + error.message,
    };
  }
}

/**
 * 获取备选座位列表
 */
async function getSeatListController(ctx) {
  try {
    const seatList = CookeObj.keyList || [];

    ctx.body = {
      code: 0,
      data: {
        seats: seatList,
        total: seatList.length,
      },
    };
  } catch (error) {
    console.log("【获取座位列表错误】", error);
    ctx.body = {
      code: 1,
      msg: "获取失败：" + error.message,
    };
  }
}

/**
 * 获取指定图书馆的实时座位状态
 */
async function getLibSeatStatusController(ctx) {
  const libId = ctx.query.libId || CookeObj.libId;

  if (!libId) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要libId",
    };
    return;
  }

  try {
    const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "libLayout",
      query:
        "query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}",
      variables: { libId: Number(libId) },
    });

    const { data, errors } = res.data;

    if (errors) {
      ctx.body = {
        code: 1,
        msg: "获取座位状态失败：" + errors[0].msg,
      };
      return;
    }

    const libData = data?.userAuth?.reserve?.libs[0];

    if (!libData) {
      ctx.body = {
        code: 1,
        msg: "未找到图书馆数据",
      };
      return;
    }

    const layout = libData.lib_layout;

    // 统计座位状态
    const stats = {
      total: layout.seats_total,
      booking: layout.seats_booking,
      used: layout.seats_used,
      available: layout.seats_total - layout.seats_booking - layout.seats_used,
    };

    // 分类座位
    const seatsClassified = {
      available: [],  // 空闲
      booking: [],    // 已预约
      used: [],       // 使用中
      unavailable: [] // 不可用（但仍是座位）
    };

    // 座位类型说明：
    // type = 1: 普通座位
    // type = 5: 特殊座位（如无障碍座位）
    // type = 2, 3, 4, 6, 7, 8: 非座位元素（桌子、门、墙、书架等）
    const SEAT_TYPES = [1, 5]; // 只有这些type才是真正的座位

    layout.seats.forEach(seat => {
      // 跳过非座位元素（墙、书架、桌子等）
      if (!SEAT_TYPES.includes(seat.type)) {
        return;
      }

      const seatInfo = {
        name: seat.name,
        x: seat.x,
        y: seat.y,
        key: seat.key,
        status: seat.seat_status || seat.status,
        type: seat.type
      };

      // seat_status: 1=可预约, 2=已预约, 3=使用中, 0或其他=不可用
      if (seat.seat_status === 1 || seat.status === 1) {
        seatsClassified.available.push(seatInfo);
      } else if (seat.seat_status === 2 || seat.status === 2) {
        seatsClassified.booking.push(seatInfo);
      } else if (seat.seat_status === 3 || seat.status === 3) {
        seatsClassified.used.push(seatInfo);
      } else {
        seatsClassified.unavailable.push(seatInfo);
      }
    });

    ctx.body = {
      code: 0,
      data: {
        libInfo: {
          lib_id: libData.lib_id,
          lib_name: libData.lib_name,
          lib_floor: libData.lib_floor,
          is_open: libData.is_open,
        },
        stats,
        layout: {
          max_x: layout.max_x,
          max_y: layout.max_y,
        },
        seats: seatsClassified,
        allSeats: layout.seats, // 保留原始座位数据供可视化使用
      },
    };

    console.log(`【获取座位状态】图书馆: ${libData.lib_name}, 空闲: ${stats.available}/${stats.total}`);

  } catch (error) {
    console.log("【获取座位状态错误】", error);
    ctx.body = {
      code: 1,
      msg: "获取失败：" + error.message,
    };
  }
}

/**
 * 获取所有图书馆的状态概览
 */
async function getAllLibsStatusController(ctx) {
  try {
    // 首先获取所有图书馆列表
    const res = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: "list",
      query:
        "query list {\n userAuth {\n reserve {\n libs(libType: -1) {\n lib_id\n lib_floor\n is_open\n lib_name\n lib_type\n lib_rt {\n seats_total\n seats_used\n seats_booking\n seats_has\n }\n }\n }\n }\n}",
    });

    const { data, errors } = res.data;

    if (errors) {
      ctx.body = {
        code: 1,
        msg: "获取图书馆列表失败：" + errors[0].msg,
      };
      return;
    }

    const libs = data?.userAuth?.reserve?.libs || [];

    const libsStatus = libs.map(lib => ({
      lib_id: lib.lib_id,
      lib_name: lib.lib_name,
      lib_floor: lib.lib_floor,
      is_open: lib.is_open,
      stats: {
        total: lib.lib_rt?.seats_total || 0,
        used: lib.lib_rt?.seats_used || 0,
        booking: lib.lib_rt?.seats_booking || 0,
        available: (lib.lib_rt?.seats_total || 0) - (lib.lib_rt?.seats_used || 0) - (lib.lib_rt?.seats_booking || 0),
      }
    }));

    // 计算总统计
    const totalStats = libsStatus.reduce((acc, lib) => ({
      total: acc.total + lib.stats.total,
      used: acc.used + lib.stats.used,
      booking: acc.booking + lib.stats.booking,
      available: acc.available + lib.stats.available,
    }), { total: 0, used: 0, booking: 0, available: 0 });

    ctx.body = {
      code: 0,
      data: {
        totalStats,
        libs: libsStatus,
        count: libsStatus.length,
      },
    };

    console.log(`【获取全部图书馆状态】共${libsStatus.length}个图书馆，总空闲: ${totalStats.available}/${totalStats.total}`);

  } catch (error) {
    console.log("【获取全部图书馆状态错误】", error);
    ctx.body = {
      code: 1,
      msg: "获取失败：" + error.message,
    };
  }
}

module.exports = {
  verifyCookie,
  setCookieController,
  clearCookieController,
  setCookieByCodeController,
  verifyCookieController,
  asyncgetLibListController,
  syncgetLibListController,
  changeSeatController,
  changeSeatMultiController,
  testReserveAndCancelController,
  manualReserveController,
  startContinuousReserveController,
  getQRCodePageController,
  addSeatToListController,
  removeSeatFromListController,
  getSeatListController,
  getLibSeatStatusController,
  getAllLibsStatusController,
};
