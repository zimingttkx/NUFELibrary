const { AxiosRequest, DOMAIN } = require('./http');
const config = require('./config');
const chalk = require('chalk');

// 获取图书馆列表
async function getLibList() {
  try {
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'index',
      query: 'query index {\n userAuth {\n user {\n prereserveAuto: getSchConfig(extra: true, fields: "prereserve.auto")\n }\n currentUser {\n sch {\n isShowCommon\n }\n }\n prereserve {\n libs {\n is_open\n lib_floor\n lib_group_id\n lib_id\n lib_name\n num\n seats_total\n }\n }\n oftenseat {\n prereserveList {\n id\n info\n lib_id\n seat_key\n status\n }\n }\n }\n}'
    });

    const libs = response.data?.data?.userAuth?.prereserve?.libs;

    if (libs) {
      // 保存图书馆列表到配置
      config.setLibList(libs);
      return { success: true, data: libs };
    } else {
      return { success: false, message: 'Cookie无效或已过期' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 查找座位key
async function findSeatKey(libId, seatName) {
  try {
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'libLayout',
      query: 'query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_layout {\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}',
      variables: { libId: parseInt(libId) }
    });

    const libData = response.data?.data?.userAuth?.reserve?.libs?.[0];
    if (!libData) {
      return { success: false, message: '获取座位布局失败' };
    }

    const seats = libData.lib_layout?.seats || [];
    const targetSeat = seats.find(seat => seat.name === seatName);

    if (targetSeat) {
      return {
        success: true,
        data: {
          libId,
          libName: libData.lib_name,
          seatName,
          seatKey: targetSeat.key
        }
      };
    } else {
      return { success: false, message: `未找到座位号: ${seatName}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 设置座位
async function setSeat(libId, seatName) {
  const result = await findSeatKey(libId, seatName);

  if (result.success) {
    config.setSeatConfig(
      result.data.libId,
      result.data.libName,
      result.data.seatName,
      result.data.seatKey
    );
    return result;
  }

  return result;
}

// 反防刷
async function refreshPage() {
  const task1 = AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
    operationName: 'prereserve',
    query: 'query prereserve {\n userAuth {\n prereserve {\n prereserve {\n day\n lib_id\n seat_key\n seat_name\n is_used\n user_mobile\n id\n lib_name\n }\n }\n }\n}'
  });

  const task2 = AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
    operationName: 'index',
    query: 'query index {\n userAuth {\n user {\n prereserveAuto: getSchConfig(extra: true, fields: "prereserve.auto")\n }\n currentUser {\n sch {\n isShowCommon\n }\n }\n prereserve {\n libs {\n is_open\n lib_floor\n lib_group_id\n lib_id\n lib_name\n num\n seats_total\n }\n }\n oftenseat {\n prereserveList {\n id\n info\n lib_id\n seat_key\n status\n }\n }\n }\n}'
  });

  try {
    await Promise.all([task1, task2]);
    return true;
  } catch (error) {
    return false;
  }
}

// 预约座位
async function reserveSeatOnce() {
  const seatConfig = config.getSeatConfig();

  if (!seatConfig.seatKey) {
    return { success: false, message: '未配置座位' };
  }

  try {
    // 先调用反防刷
    await refreshPage();

    // 发送预约请求
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'save',
      query: 'mutation save($key: String!, $libid: Int!, $captchaCode: String, $captcha: String) {\n userAuth {\n prereserve {\n save(key: $key, libId: $libid, captcha: $captcha, captchaCode: $captchaCode)\n }\n }\n}',
      variables: {
        key: `${seatConfig.seatKey}.`,
        libid: parseInt(seatConfig.libId),
        captchaCode: '',
        captcha: ''
      }
    });

    const { data, errors } = response.data;

    if (errors && errors.length > 0) {
      return { success: false, message: errors[0].msg || errors[0].message };
    }

    if (data?.userAuth) {
      return { success: true, message: '预约成功' };
    } else {
      return { success: false, message: '预约失败' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 取消预约
async function cancelReservation(reservationId) {
  try {
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'cancel',
      query: 'mutation cancel($id: Int!) {\n userAuth {\n prereserve {\n cancel(id: $id)\n }\n }\n}',
      variables: { id: parseInt(reservationId) }
    });

    const { data, errors } = response.data;

    if (errors && errors.length > 0) {
      return { success: false, message: errors[0].msg || errors[0].message };
    }

    return { success: true, message: '取消成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 获取当前预约
async function getCurrentReservations() {
  try {
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'prereserve',
      query: 'query prereserve {\n userAuth {\n prereserve {\n prereserve {\n day\n lib_id\n seat_key\n seat_name\n is_used\n user_mobile\n id\n lib_name\n }\n }\n }\n}'
    });

    const reservations = response.data?.data?.userAuth?.prereserve?.prereserve || [];
    return { success: true, data: reservations };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 测试预约（预约后立即取消）
async function testReserve() {
  console.log(chalk.cyan('开始测试预约...'));

  // 先预约
  const reserveResult = await reserveSeatOnce();

  if (!reserveResult.success) {
    return reserveResult;
  }

  console.log(chalk.green('预约成功，正在自动取消...'));

  // 获取预约ID
  await new Promise(resolve => setTimeout(resolve, 1000));
  const reservations = await getCurrentReservations();

  if (reservations.success && reservations.data.length > 0) {
    // 取消最新的预约
    const latestReservation = reservations.data[0];
    const cancelResult = await cancelReservation(latestReservation.id);

    if (cancelResult.success) {
      return {
        success: true,
        message: `测试成功！已预约并取消座位：${latestReservation.lib_name} - ${latestReservation.seat_name}号`
      };
    } else {
      return {
        success: false,
        message: `预约成功但取消失败：${cancelResult.message}`
      };
    }
  }

  return {
    success: true,
    message: '预约成功但无法验证（可能需要手动取消）'
  };
}

module.exports = {
  getLibList,
  findSeatKey,
  setSeat,
  refreshPage,
  reserveSeatOnce,
  cancelReservation,
  getCurrentReservations,
  testReserve
};
