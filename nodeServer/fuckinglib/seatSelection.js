/**
 * 座位选择功能
 * 提供楼层座位列表查询
 */

const { DOMAIN } = require('./http.js');
const { CookeObj } = require('./myCooke.js');
const axios = require('axios');

/**
 * 获取指定图书馆的所有座位
 * @param {number} libId - 图书馆ID
 */
async function getLibSeats(libId) {
  try {
    // 查询库布局
    const queryData = {
      operationName: "libLayout",
      query: `query libLayout {
        userAuth {
          reserve {
            libLayout(libId: ${libId}, libType: 1) {
              id
              name
              seats_status
              seats_total
              seats {
                key
                name
                status
                status_name
              }
            }
          }
        }
      }`
    };

    const response = await axios.post(`${DOMAIN}/index.php/graphql/`, queryData, {
      headers: {
        Cookie: CookeObj.Cookie,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response && response.data && response.data.userAuth) {
      const layout = response.data.userAuth.reserve.libLayout;

      return {
        success: true,
        layout: layout || []
      };
    } else {
      return {
        success: false,
        message: '查询失败',
        layout: []
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      layout: []
    };
  }
}

/**
 * 控制器：获取图书馆座位布局
 */
async function getLibSeatsController(ctx) {
  const { libId } = ctx.query;

  if (!libId) {
    ctx.body = {
      code: 1,
      msg: '参数错误：缺少libId'
    };
    return;
  }

  try {
    const result = await getLibSeats(parseInt(libId));

    if (result.success) {
      ctx.body = {
        code: 0,
        data: {
          libId: parseInt(libId),
          layout: result.layout
        },
        msg: '查询成功'
      };
    } else {
      ctx.body = {
        code: 1,
        msg: result.message || '查询失败'
      };
    }
  } catch (error) {
    ctx.body = {
      code: 1,
      msg: `查询座位失败: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * 格式化座位列表为选择器格式
 * @param {Array} layout - 座位布局数组
 */
function formatSeatsForSelection(layout) {
  const seats = [];

  layout.forEach(area => {
    if (area.seats && Array.isArray(area.seats)) {
      area.seats.forEach(seat => {
        seats.push({
          key: seat.key,
          name: seat.name,
          status: seat.status,
          statusName: seat.status_name,
          areaId: area.id,
          areaName: area.name
        });
      });
    }
  });

  return seats;
}

/**
 * 控制器：获取格式化的座位列表（用于下拉选择）
 */
async function getFormattedSeatsController(ctx) {
  const { libId } = ctx.query;

  if (!libId) {
    ctx.body = {
      code: 1,
      msg: '参数错误：缺少libId'
    };
    return;
  }

  try {
    const result = await getLibSeats(parseInt(libId));

    if (result.success) {
      const formattedSeats = formatSeatsForSelection(result.layout);

      ctx.body = {
        code: 0,
        data: {
          libId: parseInt(libId),
          seats: formattedSeats,
          total: formattedSeats.length
        },
        msg: '查询成功'
      };
    } else {
      ctx.body = {
        code: 1,
        msg: result.message || '查询失败'
      };
    }
  } catch (error) {
    ctx.body = {
      code: 1,
      msg: `查询座位失败: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = {
  getLibSeats,
  formatSeatsForSelection,
  getLibSeatsController,
  getFormattedSeatsController
};
