const Router = require("koa-router");
const router = new Router();

//Fucking - LIB接口;
const {
  verifyCookieController,
  setCookieController,
  clearCookieController,
  setCookieByCodeController,
  syncgetLibListController,
  asyncgetLibListController,
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
} = require("../fuckinglib/index.js");

// 收藏座位监控接口
const {
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
} = require("../fuckinglib/favorites.js");

// Cookie状态检测接口
const {
  getCookieStatusController,
  validateCookieController,
} = require("../fuckinglib/cookieValidator.js");

// 座位选择接口
const {
  getLibSeatsController,
  getFormattedSeatsController,
} = require("../fuckinglib/seatSelection.js");

/**
 * @api {POST} /lib/setCookie 设置Cookie
 * @apiGroup 后端
 * @apiDescription
 *  已在接口中对Cookie进行了切分处理，直接将抓包Cookie原封不动传入即可
 *
 * @apiBody {String} newCookie  有效Cookie值.
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *    "code": 0,
 *    "msg": "cookie有效"
 * }
 *  @apiErrorExample {json} Error-Response:
 * {
 *    "code": 1,
 *    "msg": "cookie无效"
 * }
 */
router.post("/lib/setCookie", setCookieController);

/**
 * @api {POST} /lib/setCookieByCode 通过扫码链接设置Cookie
 * @apiGroup 后端
 * @apiDescription
 *  用户扫码后，将包含code参数的链接直接粘贴即可自动获取Cookie
 *  支持完整URL或纯code参数
 *
 * @apiBody {String} codeOrUrl  包含code的完整URL或纯code值
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *    "code": 0,
 *    "msg": "通过code获取Cookie成功",
 *    "cookie": "Authorization=xxx; SERVERID=xxx"
 * }
 *  @apiErrorExample {json} Error-Response:
 * {
 *    "code": 1,
 *    "msg": "请提供code或包含code的URL"
 * }
 */
router.post("/lib/setCookieByCode", setCookieByCodeController);

/**
 * @api {POST} /lib/clearCookie 清除Cookie
 * @apiGroup 后端
 * @apiDescription 清除当前Cookie并保存
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *    "code": 0,
 *    "msg": "Cookie已清除"
 * }
 */
router.post("/lib/clearCookie", clearCookieController);

/**
 * @description 验证Cookie是否有效
 * 该接口一般不对外调用，可在debug时验证Cookie是否有效
 */
router.get("/lib/verifyCookie", verifyCookieController);

/**
 * @api {Get} /lib/getLibList 同步获取场馆列表(无需Cookie)
 * @apiGroup 后端
 * @apiDescription
 *  ❗该接口使用需提前抓包并将数据存入myCooke.js的libList中
 * 
 *  @apiSampleRequest /lib/getLibList
 * 
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "data": {
      "libId": "374", //已选择的场馆id
      "libList":[
                  {
                "lib_id": 369,
                "lib_floor": "1楼",
                "lib_name": "报刊阅览室"
            },
            {
                "lib_id": 371,
                "lib_floor": "2楼",
                "lib_name": "自然科学阅览室A区"
            },
            {
                "lib_id": 372,
                "lib_floor": "2楼",
                "lib_name": "自然科学阅览室B区"
            },
      ]
      "libName": "三楼社科B区",  // 已选中的场馆
      "seatName":"190"  //已选择的座位
    }
 * }
 */
router.get("/lib/getLibList", syncgetLibListController);

/**
 * @api {Get} /lib/getLibList2 同步获取场馆列表(需要Cookie)
 * @apiGroup 后端
 * @apiDescription
 *  ❗该接口使用前需调用setCookie接口或手动设置有效Cookie
 * 
 *  【建议用法】:首次使用时先设置一遍Cookie，然后手动调该接口获取LibList，并填入myCooke.js，此后无需再调用该接口
 * 
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "data": {
      "libId": "374",
      "libName": "三楼社科B区",
      "seatName":"190" 
    }
 * }
 */
router.get(`/lib/getLibList2`, asyncgetLibListController);

/**
 * @api {POST} /lib/changeSeat 修改座位
 * @apiGroup 后端
 * 
 * @apiBody {String} libId 场馆ID
 * @apiBody {String} seatName 座位名
 * 
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "data": {
      "libId": "374",
      "libName": "三楼社科B区",
      "seatName":"190" 
    }
 * }
 */
router.post("/lib/changeSeat", changeSeatController);

/**
 * @api {POST} /lib/changeSeatMulti 修改座位(支持跨楼层多座位)
 * @apiGroup 后端
 * @apiDescription
 *  支持跨楼层多座位配置，格式：429:179,180,181;430:200,201
 *  多个座位按优先级排序，第一个优先
 *
 * @apiBody {String} seatConfig 座位配置，格式：楼层ID:座位号1,座位号2;楼层ID2:座位号3
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "data": {
      "message": "已配置3个备选座位：楼层429:179号, 楼层429:180号, 楼层430:200号"
    }
 * }
 */
router.post("/lib/changeSeatMulti", changeSeatMultiController);

/**
 * @api {POST} /lib/addSeat 添加备选座位
 * @apiGroup 后端
 * @apiDescription
 *  添加一个座位到备选列表，用于多座位轮询预约
 *  当主座位预约失败时，会自动尝试备选列表中的座位
 *
 * @apiBody {String} libId 场馆ID
 * @apiBody {String} seatName 座位号
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "添加成功",
 *   "data": {
 *     "libId": 429,
 *     "seatName": "179",
 *     "libName": "一楼东区东一",
 *     "total": 3
 *   }
 * }
 */
router.post("/lib/addSeat", addSeatToListController);

/**
 * @api {POST} /lib/removeSeat 删除备选座位
 * @apiGroup 后端
 * @apiDescription
 *  从备选列表中删除指定座位
 *
 * @apiBody {String} libId 场馆ID
 * @apiBody {String} seatName 座位号
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "删除成功",
 *   "data": {
 *     "remaining": 2
 *   }
 * }
 */
router.post("/lib/removeSeat", removeSeatFromListController);

/**
 * @api {Get} /lib/getSeatList 获取备选座位列表
 * @apiGroup 后端
 * @apiDescription
 *  获取当前配置的所有备选座位
 *  返回座位列表，包含场馆ID、座位号、座位key等信息
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "seats": [
 *       {"libId": 429, "name": "179", "key": "32,3", "libName": "一楼东区东一"},
 *       {"libId": 430, "name": "D025", "key": "45,1", "libName": "一楼东区东二"}
 *     ],
 *     "total": 2
 *   }
 * }
 */
router.get("/lib/getSeatList", getSeatListController);

/**
 * @api {Get} /lib/testReserveAndCancel 立即测试预约并自动取消
 * @apiGroup 后端
 * @apiDescription
 *  立即发送预约请求测试功能，如果预约成功则自动取消
 *  用于测试Cookie和座位配置是否正确
 *  需要先设置Cookie和座位信息
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
   "msg": "✅ 预约测试成功！座位：楼层429的179号"
 * }
 */
router.get("/lib/testReserveAndCancel", testReserveAndCancelController);

/**
 * @api {Get} /lib/testReserve 手动测试预约
 * @apiGroup 后端
 * @apiDescription
 *  手动触发一次预约测试，用于测试预约功能是否正常
 *  需要先设置Cookie和座位信息
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "msg": "预约请求已发送，请查看服务器日志"
 * }
 */
router.get("/lib/testReserve", manualReserveController);

/**
 * @api {Get} /lib/startContinuousReserve 启动持续预约测试
 * @apiGroup 后端
 * @apiDescription
 *  启动持续预约测试，模拟定时任务的预约过程
 *  每0.9秒发送一次预约请求，持续2分30秒
 *  需要先设置Cookie和座位信息
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "msg": "持续预约已启动，将运行2分30秒，请查看手机微信公众号消息"
 * }
 */
router.get("/lib/startContinuousReserve", startContinuousReserveController);

/**
 * @api {Get} /lib/qrcode 获取扫码登录页面
 * @apiGroup 后端
 * @apiDescription
 *  显示微信扫码登录页面，用户扫码后将获得的链接粘贴即可自动提取Cookie
 *  @apiSuccessExample {html} Response-Example:
 *  返回HTML页面，包含二维码和输入框
 */
router.get("/lib/qrcode", getQRCodePageController);

/**
 * @api {Get} /lib/getSeatStatus 获取指定图书馆的实时座位状态
 * @apiGroup 后端
 * @apiDescription
 *  获取指定图书馆的详细座位状态，包含座位分类、统计信息和布局数据
 *  如果不提供libId参数，则返回当前配置的图书馆
 *
 * @apiParam {Number} [libId] 图书馆ID（可选，默认使用当前配置的图书馆）
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "libInfo": {...},
 *     "stats": {
 *       "total": 100,
 *       "booking": 20,
 *       "used": 30,
 *       "available": 50
 *     },
 *     "seats": {...}
 *   }
 * }
 */
router.get("/lib/getSeatStatus", getLibSeatStatusController);

/**
 * @api {Get} /lib/getAllLibsStatus 获取所有图书馆的状态概览
 * @apiGroup 后端
 * @apiDescription
 *  获取所有图书馆的座位状态概览，包含总体统计和各图书馆详情
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "totalStats": {
 *       "total": 1200,
 *       "available": 500
 *     },
 *     "libs": [...],
 *     "count": 13
 *   }
 * }
 */
router.get("/lib/getAllLibsStatus", getAllLibsStatusController);

/**
 * @api {POST} /lib/addFavoriteSeat 添加收藏座位
 * @apiGroup 收藏监控
 * @apiDescription
 *  将指定座位添加到收藏列表，便于后续监控和快速预订
 *
 * @apiBody {Number} libId 图书馆ID
 * @apiBody {String} libName 图书馆名称
 * @apiBody {String} libFloor 楼层
 * @apiBody {String} seatKey 座位key
 * @apiBody {String} seatName 座位号
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "添加收藏成功",
 *   "data": {
 *     "id": "429-32,3.",
 *     "libId": 429,
 *     "libName": "一楼东区东一",
 *     "seatName": "179"
 *   }
 * }
 */
router.post("/lib/addFavoriteSeat", addFavoriteSeatController);

/**
 * @api {POST} /lib/removeFavoriteSeat 删除收藏座位
 * @apiGroup 收藏监控
 * @apiDescription
 *  从收藏列表中删除指定座位
 *
 * @apiBody {String} id 收藏ID (格式: libId-seatKey)
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "删除成功"
 * }
 */
router.post("/lib/removeFavoriteSeat", removeFavoriteSeatController);

/**
 * @api {GET} /lib/getFavoriteSeats 获取收藏座位列表
 * @apiGroup 收藏监控
 * @apiDescription
 *  获取所有收藏的座位列表
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "favorites": [
 *       {
 *         "id": "429-32,3.",
 *         "libId": 429,
 *         "libName": "一楼东区东一",
 *         "seatName": "179",
 *         "addedAt": 1700000000000
 *       }
 *     ],
 *     "total": 1
 *   }
 * }
 */
router.get("/lib/getFavoriteSeats", getFavoriteSeatsController);

/**
 * @api {DELETE} /lib/clearFavoriteSeats 清空收藏列表
 * @apiGroup 收藏监控
 * @apiDescription
 *  清空所有收藏座位
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "已清空3个收藏"
 * }
 */
router.delete("/lib/clearFavoriteSeats", clearFavoriteSeatsController);

/**
 * @api {GET} /lib/getFavoriteSeatsStatus 获取收藏座位实时状态
 * @apiGroup 收藏监控
 * @apiDescription
 *  获取所有收藏座位的实时状态（空闲/已占用/已预约）
 *  包含是否为我的预约、预约ID等信息
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "seats": [
 *       {
 *         "id": "429-32,3.",
 *         "libId": 429,
 *         "seatName": "179",
 *         "status": "available",
 *         "isMyReservation": false,
 *         "lastUpdate": 1700000000000
 *       }
 *     ],
 *     "total": 1
 *   }
 * }
 */
router.get("/lib/getFavoriteSeatsStatus", getFavoriteSeatsStatusController);

/**
 * @api {POST} /lib/reserveFavoriteSeat 预订收藏的座位
 * @apiGroup 收藏监控
 * @apiDescription
 *  预订指定的收藏座位（当天座位）
 *
 * @apiBody {String} id 收藏ID
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "预订成功！座位：179号",
 *   "data": {
 *     "reservationId": "12345"
 *   }
 * }
 */
router.post("/lib/reserveFavoriteSeat", reserveFavoriteSeatController);

/**
 * @api {POST} /lib/cancelReservation 取消预订
 * @apiGroup 收藏监控
 * @apiDescription
 *  取消指定的预约
 *
 * @apiBody {String} reservationId 预约ID
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "msg": "取消预订成功"
 * }
 */
router.post("/lib/cancelReservation", cancelReservationController);

/**
 * @api {GET} /lib/getFloorOccupancy 获取楼层占用情况统计
 * @apiGroup 数据统计
 * @apiDescription
 *  获取所有图书馆楼层的占用情况统计，包括总座位数、占用数、空闲数、占用率等
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "floors": [
 *       {
 *         "libId": 429,
 *         "libName": "一楼东区东一",
 *         "libFloor": "1楼",
 *         "total": 120,
 *         "occupied": 85,
 *         "available": 35,
 *         "occupancyRate": 70.83
 *       }
 *     ],
 *     "lastUpdate": 1700000000000,
 *     "cookieValid": true
 *   },
 *   "msg": "获取成功"
 * }
 */
router.get("/lib/getFloorOccupancy", async (ctx) => {
    const { getFloorOccupancy } = require('../fuckinglib/favorites');
    const result = await getFloorOccupancy();
    ctx.body = result;
});

/**
 * @api {GET} /lib/testReservationAvailable 测试预订功能是否可用
 * @apiGroup 收藏监控
 * @apiDescription
 *  测试当前Cookie是否有效，预订功能是否可用
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "available": true,
 *   "msg": "预订功能可用"
 * }
 */
router.get("/lib/testReservationAvailable", testReservationAvailableController);

/**
 * @api {GET} /lib/testReserveFavorite 测试预定功能
 * @apiGroup 收藏座位监控
 * @apiDescription
 *  自动找一个空闲的收藏座位进行预约测试，成功后立即取消预约
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *  "msg": "✅ 测试成功！预约座位179号成功，并已自动取消预约。预定功能正常工作！"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *  "code": 1,
 *  "msg": "测试失败：没有找到空闲的座位，所有收藏座位都已被占用或预约"
 * }
 */
router.get("/lib/testReserveFavorite", testReserveFavoriteController);

/**
 * @api {POST} /lib/cancelAllReservations 取消所有当前预约
 * @apiGroup 收藏座位监控
 * @apiDescription
 *  取消用户账号下的所有座位预约（包括当天和明天的预约）
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *  "msg": "✅ 成功退订所有预约！共取消了2个座位预约",
 *  "data": {
 *    "canceled": 2,
 *    "failed": 0
 *  }
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *  "code": 0,
 *  "msg": "当前没有任何预约"
 * }
 */
router.post("/lib/cancelAllReservations", cancelAllReservationsController);

/**
 * @api {GET} /lib/getCookieStatus 获取Cookie状态
 * @apiGroup Cookie管理
 * @apiDescription
 *  获取当前Cookie的详细状态信息，包括是否存在、是否过期、有效性等
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "hasToken": true,
 *     "expiry": "2025-11-23 20:00:00",
 *     "expiryTimestamp": 1763795374000,
 *     "expired": false,
 *     "valid": true,
 *     "checkedAt": "2025-11-22 13:53:00"
 *   },
 *   "msg": "Cookie有效"
 * }
 */
router.get("/lib/getCookieStatus", getCookieStatusController);

/**
 * @api {POST} /lib/validateCookie 验证Cookie
 * @apiGroup Cookie管理
 * @apiDescription
 *  通过实际API调用验证Cookie是否有效
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "valid": true,
 *     "reason": "Cookie有效",
 *     "hasToken": true,
 *     "expired": false,
 *     "userId": 46879751
 *   },
 *   "msg": "Cookie有效"
 * }
 */
router.post("/lib/validateCookie", validateCookieController);

/**
 * @api {GET} /lib/getLibSeats 获取图书馆座位布局
 * @apiGroup 座位选择
 * @apiDescription
 *  获取指定图书馆的完整座位布局信息，包括所有区域和座位详情
 *
 * @apiParam {Number} libId 图书馆ID
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "libId": 429,
 *     "layout": [
 *       {
 *         "id": 100,
 *         "name": "东区一",
 *         "seats_status": 30,
 *         "seats_total": 50,
 *         "seats": [
 *           {
 *             "key": "32,3.",
 *             "name": "179",
 *             "status": 0,
 *             "status_name": "空闲"
 *           }
 *         ]
 *       }
 *     ]
 *   },
 *   "msg": "查询成功"
 * }
 */
router.get("/lib/getLibSeats", getLibSeatsController);

/**
 * @api {GET} /lib/getFormattedSeats 获取格式化的座位列表
 * @apiGroup 座位选择
 * @apiDescription
 *  获取适用于下拉选择器的格式化座位列表
 *
 * @apiParam {Number} libId 图书馆ID
 *
 * @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
 *   "data": {
 *     "libId": 429,
 *     "seats": [
 *       {
 *         "key": "32,3.",
 *         "name": "179",
 *         "status": 0,
 *         "statusName": "空闲",
 *         "areaId": 100,
 *         "areaName": "东区一"
 *       }
 *     ],
 *     "total": 120
 *   },
 *   "msg": "查询成功"
 * }
 */
router.get("/lib/getFormattedSeats", getFormattedSeatsController);

/**
 * @api {Get} /test 测试
 * @apiGroup 后端
 * @apiDescription
 *  用于测试服务器是否部署成功
 *  @apiSuccessExample {json} Response-Example:
 * {
 *  "code": 0,
    "data": "success"
 * }
 */
router.get("/test", (ctx) => {
  ctx.body = {
    code: 0,
    data: "success",
  };
});

module.exports = {
  router,
};
