/**
 * Cookie状态检测器
 * 用于检测Cookie是否存在和是否有效
 */

const { DOMAIN } = require('./http.js');
const { CookeObj } = require("./myCookie.js");
const axios = require('axios');

/**
 * 检查Cookie是否存在
 */
function hasCookie() {
  return !!(CookeObj.Cookie && CookeObj.Cookie.trim() !== '');
}

/**
 * 从Cookie中提取Authorization token的过期时间
 */
function extractTokenExpiry() {
  if (!hasCookie()) {
    return null;
  }

  const authMatch = CookeObj.Cookie.match(/Authorization=([^;]+)/);
  if (!authMatch) {
    return null;
  }

  try {
    // JWT token格式: header.payload.signature
    const token = authMatch[1];
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // 解码payload (Base64)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // expireAt字段是时间戳（秒）
    if (payload.expireAt) {
      return payload.expireAt * 1000; // 转换为毫秒
    }
  } catch (error) {
    console.error('解析token失败:', error.message);
  }

  return null;
}

/**
 * 检查Cookie是否过期
 */
function isCookieExpired() {
  const expiry = extractTokenExpiry();

  if (!expiry) {
    // 无法获取过期时间，尝试通过API验证
    return null; // 返回null表示未知
  }

  const now = Date.now();
  return now >= expiry;
}

/**
 * 通过实际API调用验证Cookie是否有效
 */
async function validateCookieByAPI() {
  if (!hasCookie()) {
    return {
      valid: false,
      reason: 'Cookie不存在',
      hasToken: false,
      expired: null
    };
  }

  try {
    // 使用预约查询来验证Cookie（最简单且可靠的查询）
    const queryData = {
      operationName: "prereserve",
      query: `query prereserve {
        userAuth {
          prereserve {
            prereserve {
              id
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

    // GraphQL响应格式: response.data.data.userAuth.prereserve
    if (response && response.data && response.data.data && response.data.data.userAuth && response.data.data.userAuth.prereserve) {
      return {
        valid: true,
        reason: 'Cookie有效',
        hasToken: true,
        expired: false
      };
    } else if (response && response.data && response.data.errors) {
      // GraphQL返回错误
      return {
        valid: false,
        reason: 'Cookie无效或已过期',
        hasToken: true,
        expired: true,
        graphqlErrors: response.data.errors
      };
    } else {
      return {
        valid: false,
        reason: 'Cookie无效或已过期',
        hasToken: true,
        expired: true
      };
    }
  } catch (error) {
    return {
      valid: false,
      reason: `验证失败: ${error.message}`,
      hasToken: true,
      expired: null,
      error: error.message
    };
  }
}

/**
 * 获取Cookie完整状态信息
 */
async function getCookieStatus() {
  const hasToken = hasCookie();
  const expiry = extractTokenExpiry();
  const expired = isCookieExpired();

  const status = {
    hasToken,
    expiry: expiry ? new Date(expiry).toLocaleString('zh-CN') : null,
    expiryTimestamp: expiry,
    expired,
    checkedAt: new Date().toLocaleString('zh-CN')
  };

  // 如果有token但无法判断是否过期，则通过API验证
  if (hasToken && expired === null) {
    const apiValidation = await validateCookieByAPI();
    status.apiValidation = apiValidation;
    status.valid = apiValidation.valid;
  } else {
    status.valid = hasToken && !expired;
  }

  return status;
}

/**
 * 控制器：获取Cookie状态
 */
async function getCookieStatusController(ctx) {
  try {
    const status = await getCookieStatus();

    ctx.body = {
      code: 0,
      data: status,
      msg: status.valid ? 'Cookie有效' : 'Cookie无效或已过期'
    };
  } catch (error) {
    ctx.body = {
      code: 1,
      msg: `获取Cookie状态失败: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * 控制器：验证Cookie
 */
async function validateCookieController(ctx) {
  try {
    const validation = await validateCookieByAPI();

    ctx.body = {
      code: validation.valid ? 0 : 1,
      data: validation,
      msg: validation.reason
    };
  } catch (error) {
    ctx.body = {
      code: 1,
      msg: `验证Cookie失败: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = {
  hasCookie,
  extractTokenExpiry,
  isCookieExpired,
  validateCookieByAPI,
  getCookieStatus,
  getCookieStatusController,
  validateCookieController
};
