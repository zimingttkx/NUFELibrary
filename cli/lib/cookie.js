const { AxiosRequest, DOMAIN } = require('./http');
const config = require('./config');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');

// 设置Cookie（手动输入）
async function setCookie(cookieValue) {
  try {
    // 清理Cookie格式
    const cleanCookie = cookieValue.trim();

    // 保存到配置
    config.setCookie(cleanCookie);

    // 验证Cookie是否有效
    const isValid = await verifyCookie();

    if (isValid) {
      return { success: true, message: 'Cookie有效' };
    } else {
      config.setCookie(''); // 清除无效Cookie
      return { success: false, message: 'Cookie无效或已过期' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 验证Cookie是否有效
async function verifyCookie() {
  try {
    const cookie = config.getCookie();

    if (!cookie) {
      console.log(chalk.gray('  Cookie为空，无法验证'));
      return false;
    }

    console.log(chalk.gray('  发送验证请求...'));

    // 使用正确的GraphQL查询（与原项目完全一致）
    const response = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
      operationName: 'libLayout',
      query: 'query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}',
      variables: {}
    });

    console.log(chalk.gray(`  验证响应状态: ${response.status}`));

    const userAuth = response.data?.data?.userAuth;
    const isValid = userAuth != null;

    if (isValid) {
      console.log(chalk.gray('  ✓ userAuth存在，Cookie有效'));

      // 如果验证成功，可以尝试获取用户基本信息
      const libs = userAuth.reserve?.libs;
      if (libs && libs.length > 0) {
        console.log(chalk.gray(`  可用图书馆数量: ${libs.length}`));
      }
    } else {
      console.log(chalk.gray('  ✗ userAuth不存在，Cookie无效'));
      // 输出完整响应用于调试
      if (response.data?.errors) {
        console.log(chalk.yellow('  API错误:', JSON.stringify(response.data.errors)));
      }
    }

    return isValid;
  } catch (error) {
    console.log(chalk.gray(`  验证出错: ${error.message}`));
    if (error.response) {
      console.log(chalk.gray(`  响应状态: ${error.response.status}`));
      console.log(chalk.gray(`  响应数据: ${JSON.stringify(error.response.data)}`));
    }
    return false;
  }
}

// 从URL中提取code参数
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

// 通过code获取Cookie
async function getCookieByCode(code) {
  const axios = require('axios');

  try {
    const authUrl = `http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%2F%2Fweb.traceint.com%2Fweb%2Findex.html&code=${code}&state=1`;

    console.log(chalk.gray(`  请求URL: ${authUrl.substring(0, 80)}...`));

    const response = await axios.get(authUrl, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // 接受重定向
      }
    });

    console.log(chalk.gray(`  响应状态: ${response.status}`));

    // 从响应头中提取cookie
    const cookies = response.headers['set-cookie'];

    console.log(chalk.gray(`  获取到 ${cookies?.length || 0} 个cookie`));

    if (cookies && cookies.length >= 2) {
      // 提取cookie值（格式：name=value; path=/; ...）
      const cookie1 = cookies[1].split(';')[0];
      const cookie2 = cookies[0].split(';')[0];
      const finalCookie = `${cookie1}; ${cookie2}`;

      console.log(chalk.gray(`  Cookie1: ${cookie1.substring(0, 30)}...`));
      console.log(chalk.gray(`  Cookie2: ${cookie2.substring(0, 30)}...`));

      // 检查Cookie内容
      const hasAuth = finalCookie.includes('Authorization');
      const hasServerId = finalCookie.includes('SERVERID');

      console.log(chalk.gray(`  包含Authorization: ${hasAuth}`));
      console.log(chalk.gray(`  包含SERVERID: ${hasServerId}`));

      if (!hasAuth) {
        throw new Error('Cookie中缺少Authorization字段，code可能无效或已过期');
      }

      return finalCookie;
    } else if (cookies && cookies.length >= 1) {
      const singleCookie = cookies[0].split(';')[0];
      console.log(chalk.yellow(`  ⚠️ 只获取到1个cookie: ${singleCookie.substring(0, 30)}...`));
      return singleCookie;
    } else {
      throw new Error('Cookie不包含关键身份信息，可能是code过期');
    }
  } catch (error) {
    console.log(chalk.red(`  【getCookieByCode错误】${error.message}`));
    throw error;
  }
}

// 扫码获取Cookie
async function setCookieByQRCode() {
  console.log(chalk.cyan('\n【扫码获取Cookie】'));
  console.log(chalk.gray('1. 使用微信扫描下方二维码'));
  console.log(chalk.gray('2. 扫码后会跳转到一个链接'));
  console.log(chalk.gray('3. 复制完整链接并粘贴到下方\n'));

  const qrcodeUrl = 'https://wechat.v2.traceint.com/index.php/auth/oauth/index?redirectUrl=https://wechat.v2.traceint.com/index.php/reserve/index/id/2179.html';

  // 在终端显示二维码
  qrcode.generate(qrcodeUrl, { small: true });

  console.log(chalk.yellow('\n如果二维码显示不正常，请访问：'));
  console.log(chalk.blue(qrcodeUrl));

  const inquirer = require('inquirer');
  const { codeOrUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'codeOrUrl',
      message: '请粘贴扫码后的链接或code值：',
      validate: (input) => input.length > 0 || '请输入有效的链接'
    }
  ]);

  try {
    // 提取code参数
    const code = extractCodeFromUrl(codeOrUrl);

    if (!code) {
      console.log(chalk.red('✗ 无法从链接中提取code参数'));
      return;
    }

    console.log(chalk.gray(`\n正在使用code获取Cookie: ${code.substring(0, 20)}...`));

    // 通过code获取Cookie
    const cookie = await getCookieByCode(code);

    console.log(chalk.gray(`\n获取到的完整Cookie (${cookie.length}字符):`));
    console.log(chalk.gray(`  ${cookie.substring(0, 80)}...`));

    // 保存Cookie
    config.setCookie(cookie);

    // 验证Cookie
    console.log(chalk.gray('\n正在验证Cookie...'));
    const isValid = await verifyCookie();

    if (isValid) {
      console.log(chalk.green('\n✓ Cookie获取成功并验证通过！'));
      console.log(chalk.gray('Cookie已保存到配置文件'));
    } else {
      config.setCookie('');
      console.log(chalk.red('\n✗ Cookie获取成功但验证失败'));
      console.log(chalk.yellow('可能原因：'));
      console.log(chalk.yellow('  1. code已过期（code有效期很短）'));
      console.log(chalk.yellow('  2. code已被使用过（一个code只能用一次）'));
      console.log(chalk.yellow('  3. 网络问题导致验证失败'));
      console.log(chalk.yellow('\n请重新扫码获取新的code'));
    }
  } catch (error) {
    console.log(chalk.red(`\n✗ 获取失败：${error.message}`));
  }
}

// 检查Cookie状态
async function checkStatus() {
  const cookie = config.getCookie();

  if (!cookie) {
    return {
      valid: false,
      message: '未设置Cookie'
    };
  }

  // 尝试解析过期时间
  let expiry = null;
  try {
    const authMatch = cookie.match(/Authorization=Bearer%20([^;]+)/);
    if (authMatch) {
      const token = decodeURIComponent(authMatch[1]);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.exp) {
        expiry = new Date(payload.exp * 1000).toLocaleString('zh-CN');
      }
    }
  } catch (error) {
    // 忽略解析错误
  }

  // 验证Cookie是否有效
  const isValid = await verifyCookie();

  return {
    valid: isValid,
    expiry,
    message: isValid ? 'Cookie有效' : 'Cookie无效或已过期'
  };
}

module.exports = {
  setCookie,
  verifyCookie,
  setCookieByQRCode,
  checkStatus
};
