/**
 * 收藏座位管理模块
 * 提供收藏座位的增删改查、状态监控、预订取消等功能
 */

const { CookeObj, saveLibDataAsync } = require("./myCooke.js");
const { DOMAIN } = require("./http.js");
const axios = require("axios");

/**
 * @description 添加收藏座位
 */
async function addFavoriteSeatController(ctx) {
  const { libId, libName, libFloor, seatKey, seatName } = ctx.request.body;

  // 参数验证 - libId必填，seatKey和seatName至少一个
  if (!libId) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要libId",
    };
    return;
  }

  if (!seatKey && !seatName) {
    ctx.body = {
      code: 1,
      msg: "参数错误：seatKey和seatName至少需要填写一个",
    };
    return;
  }

  try {
    // 生成唯一ID - 优先使用seatKey，如果没有则使用seatName
    const uniqueIdentifier = seatKey || seatName;
    const id = `${libId}-${uniqueIdentifier}`;

    // 检查是否已收藏
    const exists = CookeObj.favoriteSeats.find((seat) => seat.id === id);
    if (exists) {
      ctx.body = {
        code: 1,
        msg: "该座位已在收藏列表中",
      };
      return;
    }

    // 创建收藏对象
    const favorite = {
      id,
      libId: Number(libId),
      libName: libName || "",
      libFloor: libFloor || "",
      seatKey: seatKey || "",
      seatName: seatName || "",
      addedAt: Date.now(),
    };

    // 添加到列表
    CookeObj.favoriteSeats.push(favorite);

    // 保存数据
    await saveLibDataAsync();

    console.log(`【收藏座位】已添加：${libName || libId} - ${seatName}号`);

    ctx.body = {
      code: 0,
      msg: "添加收藏成功",
      data: favorite,
    };
  } catch (error) {
    console.log("【收藏座位错误】", error);
    ctx.body = {
      code: 1,
      msg: "添加收藏失败：" + error.message,
    };
  }
}

/**
 * @description 删除收藏座位
 */
async function removeFavoriteSeatController(ctx) {
  const { id } = ctx.request.body;

  if (!id) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要id",
    };
    return;
  }

  try {
    const index = CookeObj.favoriteSeats.findIndex((seat) => seat.id === id);

    if (index === -1) {
      ctx.body = {
        code: 1,
        msg: "未找到该收藏座位",
      };
      return;
    }

    // 删除
    const removed = CookeObj.favoriteSeats.splice(index, 1)[0];

    // 保存数据
    await saveLibDataAsync();

    console.log(`【收藏座位】已删除：${removed.seatName}号`);

    ctx.body = {
      code: 0,
      msg: "删除成功",
    };
  } catch (error) {
    console.log("【删除收藏错误】", error);
    ctx.body = {
      code: 1,
      msg: "删除失败：" + error.message,
    };
  }
}

/**
 * @description 获取收藏座位列表
 */
async function getFavoriteSeatsController(ctx) {
  try {
    ctx.body = {
      code: 0,
      data: {
        favorites: CookeObj.favoriteSeats || [],
        total: CookeObj.favoriteSeats.length,
      },
    };
  } catch (error) {
    console.log("【获取收藏列表错误】", error);
    ctx.body = {
      code: 1,
      msg: "获取列表失败：" + error.message,
    };
  }
}

/**
 * @description 清空收藏列表
 */
async function clearFavoriteSeatsController(ctx) {
  try {
    const count = CookeObj.favoriteSeats.length;
    CookeObj.favoriteSeats = [];

    await saveLibDataAsync();

    console.log(`【收藏座位】已清空，删除了${count}个收藏`);

    ctx.body = {
      code: 0,
      msg: `已清空${count}个收藏`,
    };
  } catch (error) {
    console.log("【清空收藏错误】", error);
    ctx.body = {
      code: 1,
      msg: "清空失败：" + error.message,
    };
  }
}

/**
 * @description 获取收藏座位的实时状态
 */
async function getFavoriteSeatsStatusController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  if (!CookeObj.favoriteSeats || CookeObj.favoriteSeats.length === 0) {
    ctx.body = {
      code: 0,
      data: {
        seats: [],
        total: 0,
      },
    };
    return;
  }

  try {
    console.log(`【监控收藏】开始查询${CookeObj.favoriteSeats.length}个座位的状态...`);

    // 并发查询所有收藏座位的状态
    const statusPromises = CookeObj.favoriteSeats.map(async (favorite) => {
      try {
        // 查询座位状态 - 传入座位名称用于查找
        const seatStatus = await getSeatStatus(favorite.libId, favorite.seatKey, favorite.seatName);

        return {
          ...favorite,
          status: seatStatus.status,
          isMyReservation: seatStatus.isMyReservation,
          reservationId: seatStatus.reservationId,
          actualSeatKey: seatStatus.actualSeatKey, // 返回实际的座位key
          lastUpdate: Date.now(),
        };
      } catch (error) {
        console.log(`【监控收藏】查询座位${favorite.seatName}失败:`, error.message);
        return {
          ...favorite,
          status: "unknown",
          isMyReservation: false,
          reservationId: null,
          lastUpdate: Date.now(),
          error: error.message,
        };
      }
    });

    const seatsWithStatus = await Promise.all(statusPromises);

    ctx.body = {
      code: 0,
      data: {
        seats: seatsWithStatus,
        total: seatsWithStatus.length,
      },
    };
  } catch (error) {
    console.log("【监控收藏错误】", error);
    ctx.body = {
      code: 1,
      msg: "查询状态失败：" + error.message,
    };
  }
}

/**
 * @description 查询单个座位的状态
 * @param {number} libId - 图书馆ID
 * @param {string} seatKey - 座位key（可能不准确，作为备选）
 * @param {string} seatName - 座位名称（用于精确查找）
 * @returns {status: 'available'|'occupied'|'reserved', isMyReservation: boolean, reservationId: string, actualSeatKey: string}
 */
async function getSeatStatus(libId, seatKey, seatName) {
  // 查询座位的详细信息 - 使用libs查询
  const query = {
    operationName: "libLayout",
    query: `query libLayout($libId: Int!, $libType: Int) {
      userAuth {
        reserve {
          libs(libType: $libType, libId: $libId) {
            lib_id
            is_open
            lib_floor
            lib_name
            lib_layout {
              seats {
                x
                y
                key
                type
                name
                seat_status
                status
              }
            }
          }
        }
      }
    }`,
    variables: {
      libId: Number(libId),
      libType: 1,
    },
  };

  const response = await axios.post(`${DOMAIN}/index.php/graphql/`, query, {
    headers: {
      Cookie: CookeObj.Cookie,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.data.errors) {
    console.log("【GraphQL错误】", JSON.stringify(response.data.errors));
    throw new Error(response.data.errors[0].message || "查询座位失败");
  }

  if (!response.data.data || !response.data.data.userAuth) {
    console.log("【Cookie可能失效】", JSON.stringify(response.data));
    throw new Error("Cookie无效或已过期");
  }

  const libs = response.data.data?.userAuth?.reserve?.libs || [];
  if (libs.length === 0) {
    throw new Error("未找到图书馆信息");
  }

  const layout = libs[0].lib_layout;
  if (!layout || !layout.seats) {
    throw new Error("未找到座位布局信息");
  }

  const seats = layout.seats;

  // 优先通过座位名称查找（更可靠）
  let seat = null;
  if (seatName) {
    seat = seats.find((s) => s.name === seatName);
    if (seat) {
      console.log(`【座位查找成功】通过名称"${seatName}"找到座位，实际key: "${seat.key}"，存储的key: "${seatKey}"`);
    }
  }

  // 如果通过名称找不到，再尝试通过key查找
  if (!seat) {
    seat = seats.find((s) => s.key === seatKey);
    if (!seat) {
      // 尝试不同的key格式（有无末尾点号）
      const keyWithoutDot = seatKey.replace(/\.$/, '');
      const keyWithDot = seatKey.endsWith('.') ? seatKey : seatKey + '.';
      seat = seats.find((s) => s.key === keyWithoutDot || s.key === keyWithDot);
    }
  }

  if (!seat) {
    console.log("【座位查找失败】图书馆ID:", libId, "座位名称:", seatName, "存储的key:", seatKey);
    const namedSeats = seats.filter(s => s.name && s.name !== "null" && s.name !== "").slice(0, 5);
    console.log("【前5个有效座位】:", namedSeats.map(s => `${s.name}(key:${s.key})`));
    throw new Error(`未找到座位 ${seatName || seatKey}`);
  }

  // 判断状态
  // seat_status 或 status 字段值的含义：
  // 1 = 可预约（空闲）
  // 2 = 已预约
  // 3 = 使用中（已占用）
  // 0或其他 = 不可用
  const seatStatusValue = seat.seat_status || seat.status;
  let status = "unknown";

  if (seatStatusValue === 1) {
    status = "available"; // 空闲，可预约
  } else if (seatStatusValue === 2) {
    status = "reserved"; // 已预约
  } else if (seatStatusValue === 3) {
    status = "occupied"; // 使用中
  } else {
    status = "unavailable"; // 不可用
  }

  // 检查是否是我的预约
  let isMyReservation = false;
  let reservationId = null;

  if (seatStatusValue === 2) {
    // 座位已被预约，查询是否是我的预约
    const myReservations = await getMyReservations();
    // 使用实际的座位key进行匹配
    const myReservation = myReservations.find(
      (r) => r.lib_id === Number(libId) && r.seat_key === seat.key
    );

    if (myReservation) {
      isMyReservation = true;
      reservationId = myReservation.id;
    }
  }

  return {
    status,
    isMyReservation,
    reservationId,
    actualSeatKey: seat.key, // 返回实际的座位key
  };
}

/**
 * @description 获取我的预约列表（包括当天即刻预约和明天预约）
 */
async function getMyReservations() {
  const query = {
    operationName: "myReservations",
    query: `query myReservations {
      userAuth {
        reserve {
          reserve {
            id
            lib_id
            seat_key
            seat_name
            status
            start
            end
          }
        }
        prereserve {
          prereserve {
            id
            lib_id
            seat_key
            seat_name
            day
          }
        }
      }
    }`,
    variables: {},
  };

  const response = await axios.post(`${DOMAIN}/index.php/graphql/`, query, {
    headers: {
      Cookie: CookeObj.Cookie,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.data.errors) {
    console.log("【获取预约列表错误】", response.data.errors);
    return [];
  }

  // reserve.reserve 返回的是当前预约（当天的即刻预约）
  const reserveData = response.data.data?.userAuth?.reserve?.reserve;
  const currentReservations = reserveData ? (Array.isArray(reserveData) ? reserveData : [reserveData]) : [];

  // prereserve.prereserve 返回的是明天的预约
  const futureReservations = response.data.data?.userAuth?.prereserve?.prereserve || [];

  console.log(`【获取预约列表】当天预约: ${currentReservations.length}个, 明天预约: ${futureReservations.length}个`);

  return [...currentReservations, ...futureReservations];
}

/**
 * @description 获取当前预约列表（当天的预约，用于即刻预约）
 */
async function getCurrentReservations() {
  const query = {
    operationName: "reserve",
    query: `query reserve {
      userAuth {
        reserve {
          reserve {
            id
            lib_id
            seat_key
            seat_name
            status
            start
            end
          }
        }
      }
    }`,
    variables: {},
  };

  const response = await axios.post(`${DOMAIN}/index.php/graphql/`, query, {
    headers: {
      Cookie: CookeObj.Cookie,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.data.errors) {
    return [];
  }

  // reserve.reserve返回的是当前预约（当天的预约），可能是单个对象或数组
  const reserveData = response.data.data?.userAuth?.reserve?.reserve;

  if (!reserveData) {
    return [];
  }

  // 如果返回的是单个对象，转换为数组
  return Array.isArray(reserveData) ? reserveData : [reserveData];
}

/**
 * @description 预订收藏的座位
 * @param {string} reservationType - 预约类型：'immediate'(即刻预约，当天) 或 'tomorrow'(隔日预约，明天)，默认为'immediate'
 */
async function reserveFavoriteSeatController(ctx) {
  const { id, reservationType = 'immediate' } = ctx.request.body;

  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  if (!id) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要id",
    };
    return;
  }

  // 验证预约类型
  if (!['immediate', 'tomorrow'].includes(reservationType)) {
    ctx.body = {
      code: 1,
      msg: "参数错误：reservationType只能是'immediate'或'tomorrow'",
    };
    return;
  }

  try {
    // 查找收藏
    const favorite = CookeObj.favoriteSeats.find((seat) => seat.id === id);
    if (!favorite) {
      ctx.body = {
        code: 1,
        msg: "未找到该收藏座位",
      };
      return;
    }

    console.log(`【预订收藏】尝试预订（${reservationType === 'immediate' ? '即刻' : '隔日'}）：${favorite.libName} - ${favorite.seatName}号`);

    // 先获取座位的最新状态，确保获取正确的seatKey
    let actualSeatKey = favorite.seatKey;
    try {
      const seatStatus = await getSeatStatus(favorite.libId, favorite.seatKey, favorite.seatName);
      actualSeatKey = seatStatus.actualSeatKey;
      console.log(`【预订收藏】使用实际座位key: ${actualSeatKey}`);

      // 检查座位是否可预订
      if (seatStatus.status === 'occupied') {
        ctx.body = {
          code: 1,
          msg: `座位${favorite.seatName}号已被占用，无法预订`,
        };
        return;
      }

      if (seatStatus.status === 'reserved' && !seatStatus.isMyReservation) {
        ctx.body = {
          code: 1,
          msg: `座位${favorite.seatName}号已被预约，无法预订`,
        };
        return;
      }

      if (seatStatus.isMyReservation) {
        ctx.body = {
          code: 1,
          msg: `座位${favorite.seatName}号已是您的预约`,
        };
        return;
      }
    } catch (statusError) {
      console.log(`【预订收藏】获取座位状态失败，使用存储的key: ${statusError.message}`);
      // 如果获取状态失败，仍尝试使用存储的key预订
    }

    // 根据预约类型执行不同的预约逻辑
    let response;
    let reservationId = null;

    if (reservationType === 'immediate') {
      // ========== 即刻预约（当天座位） ==========
      // 使用 reserve.reserueSeat mutation
      // 参考项目：IGoLibrary的实现

      // seatKey不需要末尾的点号（即刻预约API的要求）
      const seatKeyForImmediate = actualSeatKey.replace(/\.$/, '');

      const immediateReserveData = {
        operationName: "reserveSeat",
        query: `mutation reserveSeat($libId: Int!, $seatKey: String!, $captchaCode: String) {
          userAuth {
            reserve {
              reserueSeat(libId: $libId, seatKey: $seatKey, captchaCode: $captchaCode)
            }
          }
        }`,
        variables: {
          libId: Number(favorite.libId),
          seatKey: seatKeyForImmediate,
          captchaCode: "",
        },
      };

      response = await axios.post(`${DOMAIN}/index.php/graphql/`, immediateReserveData, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.errors) {
        const errorMsg = response.data.errors[0].msg || response.data.errors[0].message;
        console.log(`【预订收藏】即刻预订失败：${errorMsg}`);
        ctx.body = {
          code: 1,
          msg: `即刻预订失败：${errorMsg}`,
        };
        return;
      }

      // 检查预约是否成功（即刻预约返回"true"或true表示成功）
      const reserveResult = response.data.data?.userAuth?.reserve?.reserueSeat;
      if (reserveResult === "true" || reserveResult === true) {
        console.log(`【预订收藏】即刻预订成功！`);

        // 获取当前预约信息（immediate模式使用reserve.reserve而不是prereserve.prereserve）
        const currentReservations = await getCurrentReservations();
        const reservation = currentReservations.find(
          (r) => r.lib_id === Number(favorite.libId) && r.seat_key === seatKeyForImmediate
        );
        reservationId = reservation?.id || null;

        ctx.body = {
          code: 0,
          msg: `即刻预订成功！座位：${favorite.seatName}号（当天预约）`,
          data: {
            reservationId,
            reservationType: 'immediate',
          },
        };
      } else {
        ctx.body = {
          code: 1,
          msg: "即刻预订失败：返回数据异常",
        };
      }

    } else {
      // ========== 隔日预约（明天座位） ==========
      // 使用 prereserve.save mutation（原有逻辑）

      // 确保key格式正确（末尾有点号）
      if (!actualSeatKey.endsWith('.')) {
        actualSeatKey = actualSeatKey + '.';
      }

      const tomorrowReserveData = {
        operationName: "save",
        query: `mutation save($key: String!, $libid: Int!, $captchaCode: String, $captcha: String) {
          userAuth {
            prereserve {
              save(key: $key, libId: $libid, captcha: $captcha, captchaCode: $captchaCode)
            }
          }
        }`,
        variables: {
          key: actualSeatKey,
          libid: Number(favorite.libId),
          captchaCode: "",
          captcha: "",
        },
      };

      response = await axios.post(`${DOMAIN}/index.php/graphql/`, tomorrowReserveData, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.errors) {
        const errorMsg = response.data.errors[0].msg || response.data.errors[0].message;
        console.log(`【预订收藏】隔日预订失败：${errorMsg}`);
        ctx.body = {
          code: 1,
          msg: `隔日预订失败：${errorMsg}`,
        };
        return;
      }

      if (response.data.data?.userAuth?.prereserve?.save) {
        console.log(`【预订收藏】隔日预订成功！`);

        // 获取预约ID
        const myReservations = await getMyReservations();
        const reservation = myReservations.find(
          (r) => r.lib_id === Number(favorite.libId) && r.seat_key === actualSeatKey.replace(/\.$/, '')
        );
        reservationId = reservation?.id || null;

        ctx.body = {
          code: 0,
          msg: `隔日预订成功！座位：${favorite.seatName}号（明天预约）`,
          data: {
            reservationId,
            reservationType: 'tomorrow',
          },
        };
      } else {
        ctx.body = {
          code: 1,
          msg: "隔日预订失败：返回数据异常",
        };
      }
    }

  } catch (error) {
    console.log("【预订收藏错误】", error);
    ctx.body = {
      code: 1,
      msg: "预订失败：" + error.message,
    };
  }
}

/**
 * @description 取消预订
 * @param {string} reservationType - 预约类型：'immediate'(即刻预约) 或 'tomorrow'(隔日预约)，默认自动检测
 */
async function cancelReservationController(ctx) {
  const { reservationId, reservationType } = ctx.request.body;

  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  if (!reservationId) {
    ctx.body = {
      code: 1,
      msg: "参数错误：需要reservationId",
    };
    return;
  }

  try {
    console.log(`【取消预订】尝试取消预约ID: ${reservationId}`);

    // 如果没有指定类型，尝试自动检测
    let actualReservationType = reservationType;

    if (!actualReservationType) {
      // 尝试从当前预约列表查找
      const currentRes = await getCurrentReservations();
      const isCurrentReservation = currentRes.some(r => r.id == reservationId);

      if (isCurrentReservation) {
        actualReservationType = 'immediate';
        console.log(`【取消预订】检测到为即刻预约`);
      } else {
        // 尝试从隔日预约列表查找
        const futureRes = await getMyReservations();
        const isFutureReservation = futureRes.some(r => r.id == reservationId);

        if (isFutureReservation) {
          actualReservationType = 'tomorrow';
          console.log(`【取消预订】检测到为隔日预约`);
        } else {
          // 默认使用隔日预约方式（向后兼容）
          actualReservationType = 'tomorrow';
          console.log(`【取消预订】未找到预约信息，默认使用隔日预约方式`);
        }
      }
    }

    let response;

    if (actualReservationType === 'immediate') {
      // ========== 取消即刻预约（当天预约） ==========
      // 使用 reserve.cancelReserve mutation
      const cancelImmediateData = {
        operationName: "cancelReserve",
        query: `mutation cancelReserve($id: Int) {
          userAuth {
            reserve {
              cancelReserve(id: $id)
            }
          }
        }`,
        variables: {
          id: Number(reservationId),
        },
      };

      response = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelImmediateData, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.errors) {
        const errorMsg = response.data.errors[0].msg || response.data.errors[0].message;
        console.log(`【取消预订】即刻预约取消失败：${errorMsg}`);
        ctx.body = {
          code: 1,
          msg: `取消失败：${errorMsg}`,
        };
        return;
      }

      // 即刻预约取消成功返回true或"true"
      const cancelResult = response.data.data?.userAuth?.reserve?.cancelReserve;
      if (cancelResult === "true" || cancelResult === true) {
        console.log(`【取消预订】即刻预约取消成功！`);
        ctx.body = {
          code: 0,
          msg: "取消预订成功（即刻预约）",
        };
      } else {
        ctx.body = {
          code: 1,
          msg: "取消失败：返回数据异常",
        };
      }

    } else {
      // ========== 取消隔日预约（明天预约） ==========
      // 使用 prereserve.delete mutation（原有逻辑）
      const cancelTomorrowData = {
        operationName: "delete",
        query: `mutation delete {
          userAuth {
            prereserve {
              delete(id: ${reservationId})
            }
          }
        }`,
        variables: {},
      };

      response = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelTomorrowData, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.errors) {
        const errorMsg = response.data.errors[0].msg || response.data.errors[0].message;
        console.log(`【取消预订】隔日预约取消失败：${errorMsg}`);
        ctx.body = {
          code: 1,
          msg: `取消失败：${errorMsg}`,
        };
        return;
      }

      console.log(`【取消预订】隔日预约取消成功！`);
      ctx.body = {
        code: 0,
        msg: "取消预订成功（隔日预约）",
      };
    }

  } catch (error) {
    console.log("【取消预订错误】", error);
    ctx.body = {
      code: 1,
      msg: "取消失败：" + error.message,
    };
  }
}

/**
 * @description 测试预订功能是否可用
 */
async function testReservationAvailableController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      available: false,
      msg: "请先设置Cookie",
    };
    return;
  }

  try {
    // 尝试查询图书馆列表，测试Cookie是否有效
    const query = {
      operationName: "libs",
      query: `query libs {
        userAuth {
          reserve {
            libs {
              lib_id
              lib_name
            }
          }
        }
      }`,
      variables: {},
    };

    const response = await axios.post(`${DOMAIN}/index.php/graphql/`, query, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data.errors) {
      ctx.body = {
        code: 1,
        available: false,
        msg: "Cookie已失效，请重新获取",
      };
      return;
    }

    const libs = response.data.data?.userAuth?.reserve?.libs || [];
    if (libs.length > 0) {
      ctx.body = {
        code: 0,
        available: true,
        msg: "预订功能可用",
      };
    } else {
      ctx.body = {
        code: 1,
        available: false,
        msg: "无法获取图书馆列表",
      };
    }
  } catch (error) {
    console.log("【测试预订功能错误】", error);
    ctx.body = {
      code: 1,
      available: false,
      msg: "测试失败：" + error.message,
    };
  }
}

/**
 * 获取楼层占用情况统计
 * @description 获取所有图书馆楼层的占用情况统计
 */
async function getFloorOccupancy() {
  if (!CookeObj.Cookie) {
    return {
      code: 1,
      msg: "请先设置Cookie",
      data: {
        floors: [],
        cookieValid: false,
        lastUpdate: Date.now(),
      },
    };
  }

  try {
    // 获取图书馆列表
    const libListQuery = {
      operationName: "libs",
      query: `query libs {
        userAuth {
          reserve {
            libs {
              lib_id
              lib_name
              lib_floor
            }
          }
        }
      }`,
      variables: {},
    };

    const libListResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, libListQuery, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (libListResponse.data.errors) {
      return {
        code: 1,
        msg: "Cookie已失效",
        data: {
          floors: [],
          cookieValid: false,
          lastUpdate: Date.now(),
        },
      };
    }

    const libs = libListResponse.data.data?.userAuth?.reserve?.libs || [];
    const floors = [];

    // 遍历每个图书馆，获取座位占用情况
    for (const lib of libs) {
      try {
        const seatsQuery = {
          operationName: "libLayout",
          query: `query libLayout($libId: Int!, $libType: Int) {
            userAuth {
              reserve {
                libs(libId: $libId, libType: $libType) {
                  lib_id
                  lib_layout {
                    seats {
                      key
                      name
                      type
                      seat_status
                      status
                    }
                  }
                }
              }
            }
          }`,
          variables: {
            libId: lib.lib_id,
            libType: 1,
          },
        };

        const seatsResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, seatsQuery, {
          headers: {
            Cookie: CookeObj.Cookie,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        if (!seatsResponse.data.errors) {
          const layout = seatsResponse.data.data?.userAuth?.reserve?.libs?.[0]?.lib_layout;
          if (!layout || !layout.seats) {
            console.log(`【获取楼层${lib.lib_name}布局失败】未返回lib_layout`);
            continue;
          }

          const allSeats = layout.seats;

          // 只统计真正的座位（type = 1 或 5）
          // type = 1: 普通座位
          // type = 5: 特殊座位（如无障碍座位）
          // type = 2, 3, 4, 6, 7, 8: 非座位元素（桌子、门、墙、书架等）
          const SEAT_TYPES = [1, 5];
          const seats = allSeats.filter(s => SEAT_TYPES.includes(s.type));

          const total = seats.length;

          // 根据正确的状态值统计
          // seat_status 或 status: 1=可预约, 2=已预约, 3=使用中
          const occupied = seats.filter(s => {
            const statusValue = s.seat_status || s.status;
            return statusValue === 2 || statusValue === 3; // 2=已预约, 3=使用中
          }).length;

          const available = seats.filter(s => {
            const statusValue = s.seat_status || s.status;
            return statusValue === 1; // 1=可预约（空闲）
          }).length;

          const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(2) : 0;

          console.log(`【楼层统计】${lib.lib_name}: 总元素${allSeats.length}, 真实座位${total}, 占用${occupied}, 空闲${available}`);

          floors.push({
            libId: lib.lib_id,
            libName: lib.lib_name,
            libFloor: lib.lib_floor,
            total,
            occupied,
            available,
            occupancyRate: parseFloat(occupancyRate),
          });
        }
      } catch (error) {
        console.log(`【获取楼层${lib.lib_name}占用情况失败】`, error.message);
        // 出错的楼层跳过，继续处理其他楼层
      }
    }

    return {
      code: 0,
      msg: "获取成功",
      data: {
        floors,
        cookieValid: true,
        lastUpdate: Date.now(),
      },
    };
  } catch (error) {
    console.log("【获取楼层占用情况错误】", error);
    return {
      code: 1,
      msg: "获取失败：" + error.message,
      data: {
        floors: [],
        cookieValid: false,
        lastUpdate: Date.now(),
      },
    };
  }
}

/**
 * @description 测试预定功能 - 自动找一个空闲座位进行预约，成功后立即取消
 */
async function testReserveFavoriteController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  if (!CookeObj.favoriteSeats || CookeObj.favoriteSeats.length === 0) {
    ctx.body = {
      code: 1,
      msg: "没有收藏座位，请先添加收藏座位",
    };
    return;
  }

  try {
    console.log(`【测试预定】开始测试，共${CookeObj.favoriteSeats.length}个收藏座位...`);

    // 并发查询所有收藏座位的状态
    const statusPromises = CookeObj.favoriteSeats.map(async (favorite) => {
      try {
        const seatStatus = await getSeatStatus(favorite.libId, favorite.seatKey, favorite.seatName);
        return {
          favorite,
          status: seatStatus.status,
          actualSeatKey: seatStatus.actualSeatKey,
        };
      } catch (error) {
        return null;
      }
    });

    const seatsWithStatus = (await Promise.all(statusPromises)).filter(s => s !== null);

    // 找到第一个空闲的座位
    const availableSeat = seatsWithStatus.find(s => s.status === 'available');

    if (!availableSeat) {
      ctx.body = {
        code: 1,
        msg: "测试失败：没有找到空闲的座位，所有收藏座位都已被占用或预约",
      };
      return;
    }

    const { favorite, actualSeatKey } = availableSeat;
    console.log(`【测试预定】找到空闲座位：${favorite.libName} - ${favorite.seatName}号`);

    // 尝试预约（默认使用即刻预约）
    const seatKeyForReserve = actualSeatKey.replace(/\.$/, '');

    const reserveData = {
      operationName: "reserveSeat",
      query: `mutation reserveSeat($libId: Int!, $seatKey: String!, $captchaCode: String) {
        userAuth {
          reserve {
            reserueSeat(libId: $libId, seatKey: $seatKey, captchaCode: $captchaCode)
          }
        }
      }`,
      variables: {
        libId: Number(favorite.libId),
        seatKey: seatKeyForReserve,
        captchaCode: "",
      },
    };

    const reserveResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, reserveData, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (reserveResponse.data.errors) {
      const errorMsg = reserveResponse.data.errors[0].msg || reserveResponse.data.errors[0].message;
      console.log(`【测试预定】预约失败：${errorMsg}`);
      ctx.body = {
        code: 1,
        msg: `测试失败：预约失败 - ${errorMsg}`,
      };
      return;
    }

    const reserveResult = reserveResponse.data.data?.userAuth?.reserve?.reserueSeat;
    if (reserveResult !== "true" && reserveResult !== true) {
      ctx.body = {
        code: 1,
        msg: "测试失败：预约返回数据异常",
      };
      return;
    }

    console.log(`【测试预定】✅ 预约成功！座位：${favorite.seatName}号`);

    // 获取预约ID
    const currentReservations = await getCurrentReservations();
    const reservation = currentReservations.find(
      (r) => r.lib_id === Number(favorite.libId) && r.seat_key === seatKeyForReserve
    );

    const reservationId = reservation?.id;

    if (!reservationId) {
      ctx.body = {
        code: 0,
        msg: `测试成功：预约成功，但未能获取预约ID，无法自动取消。请手动取消座位${favorite.seatName}号的预约。`,
      };
      return;
    }

    // 立即取消预约
    console.log(`【测试预定】开始取消预约ID: ${reservationId}...`);

    const cancelData = {
      operationName: "cancelReserve",
      query: `mutation cancelReserve($id: Int) {
        userAuth {
          reserve {
            cancelReserve(id: $id)
          }
        }
      }`,
      variables: {
        id: Number(reservationId),
      },
    };

    const cancelResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelData, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (cancelResponse.data.errors) {
      const errorMsg = cancelResponse.data.errors[0].msg || cancelResponse.data.errors[0].message;
      console.log(`【测试预定】取消失败：${errorMsg}`);
      ctx.body = {
        code: 0,
        msg: `测试部分成功：预约成功（座位${favorite.seatName}号），但取消失败 - ${errorMsg}。请手动取消。`,
      };
      return;
    }

    const cancelResult = cancelResponse.data.data?.userAuth?.reserve?.cancelReserve;
    if (cancelResult === "true" || cancelResult === true) {
      console.log(`【测试预定】✅ 取消成功！`);
      ctx.body = {
        code: 0,
        msg: `✅ 测试成功！预约座位${favorite.seatName}号成功，并已自动取消预约。预定功能正常工作！`,
      };
    } else {
      ctx.body = {
        code: 0,
        msg: `测试部分成功：预约成功（座位${favorite.seatName}号），但取消时返回数据异常。请手动确认预约状态。`,
      };
    }

  } catch (error) {
    console.log("【测试预定错误】", error);
    ctx.body = {
      code: 1,
      msg: "测试失败：" + error.message,
    };
  }
}

/**
 * @description 取消所有当前预约
 * 因为一个账号同时只能有一个座位，所以直接尝试取消当天预约和明天预约
 */
async function cancelAllReservationsController(ctx) {
  if (!CookeObj.Cookie) {
    ctx.body = {
      code: 1,
      msg: "请先设置Cookie",
    };
    return;
  }

  try {
    console.log(`【取消所有预约】开始尝试取消当天和明天的预约...`);

    let canceledCount = 0;
    let failedCount = 0;
    const messages = [];

    // 1. 尝试取消明天的预约（prereserve）
    try {
      // 先查询明天的预约
      const prereserveQuery = {
        operationName: "prereserve",
        query: `query prereserve {
          userAuth {
            prereserve {
              prereserve {
                id
                lib_id
                seat_key
                seat_name
                day
              }
            }
          }
        }`,
        variables: {},
      };

      const prereserveResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, prereserveQuery, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      const prereservations = prereserveResponse.data.data?.userAuth?.prereserve?.prereserve || [];

      if (prereservations.length > 0) {
        // 有明天的预约，逐个取消
        for (const reservation of prereservations) {
          const cancelData = {
            operationName: "delete",
            query: `mutation delete {
              userAuth {
                prereserve {
                  delete(id: ${reservation.id})
                }
              }
            }`,
            variables: {},
          };

          const cancelResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelData, {
            headers: {
              Cookie: CookeObj.Cookie,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });

          if (!cancelResponse.data.errors) {
            canceledCount++;
            messages.push(`取消明天预约：${reservation.seat_name}号`);
            console.log(`【取消所有预约】✅ 取消明天预约成功：${reservation.seat_name}号`);
          } else {
            failedCount++;
            console.log(`【取消所有预约】❌ 取消明天预约失败：${reservation.seat_name}号`);
          }
        }
      } else {
        console.log(`【取消所有预约】没有找到明天的预约`);
      }
    } catch (error) {
      console.log(`【取消所有预约】查询或取消明天预约时出错：${error.message}`);
    }

    // 2. 尝试取消当天的预约（immediate reserve）
    // 由于无法正确查询当天预约详情，直接尝试调用取消接口（不传ID或传null）
    try {
      const cancelData = {
        operationName: "cancelReserve",
        query: `mutation cancelReserve {
          userAuth {
            reserve {
              cancelReserve
            }
          }
        }`,
        variables: {},
      };

      const cancelResponse = await axios.post(`${DOMAIN}/index.php/graphql/`, cancelData, {
        headers: {
          Cookie: CookeObj.Cookie,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      console.log(`【取消所有预约】当天预约取消响应:`, JSON.stringify(cancelResponse.data));

      if (!cancelResponse.data.errors) {
        const result = cancelResponse.data.data?.userAuth?.reserve?.cancelReserve;
        if (result === "true" || result === true) {
          canceledCount++;
          messages.push(`取消当天预约`);
          console.log(`【取消所有预约】✅ 取消当天预约成功`);
        } else {
          console.log(`【取消所有预约】当天可能没有预约（cancelReserve返回: ${result}）`);
        }
      } else {
        const errorMsg = cancelResponse.data.errors[0]?.msg || "未知错误";
        console.log(`【取消所有预约】取消当天预约失败: ${errorMsg}`);
        // 如果是"当前无预约"之类的错误，不算失败
        if (!errorMsg.includes("无预约") && !errorMsg.includes("not found")) {
          failedCount++;
        }
      }
    } catch (error) {
      console.log(`【取消所有预约】取消当天预约时出错：${error.message}`);
    }

    // 返回结果
    if (canceledCount > 0) {
      ctx.body = {
        code: 0,
        msg: `✅ 成功退订！${messages.join('；')}`,
        data: {
          canceled: canceledCount,
          failed: failedCount,
        },
      };
    } else if (failedCount > 0) {
      ctx.body = {
        code: 1,
        msg: `退订失败：无法取消预约`,
        data: {
          canceled: canceledCount,
          failed: failedCount,
        },
      };
    } else {
      ctx.body = {
        code: 0,
        msg: "当前没有任何预约",
        data: {
          canceled: 0,
          failed: 0,
        },
      };
    }

  } catch (error) {
    console.log("【取消所有预约错误】", error);
    ctx.body = {
      code: 1,
      msg: "取消失败：" + error.message,
    };
  }
}

module.exports = {
  addFavoriteSeatController,
  removeFavoriteSeatController,
  getFavoriteSeatsController,
  clearFavoriteSeatsController,
  getFavoriteSeatsStatusController,
  reserveFavoriteSeatController,
  cancelReservationController,
  testReservationAvailableController,
  testReserveFavoriteController,
  cancelAllReservationsController,
  getFloorOccupancy,
};
