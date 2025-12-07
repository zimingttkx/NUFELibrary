// 测试Cookie获取的完整流程
const axios = require('axios');

async function testGetCookieByCode() {
  const code = process.argv[2];

  if (!code) {
    console.log('用法: node test-cookie.js <code>');
    console.log('示例: node test-cookie.js 081xxxxx');
    process.exit(1);
  }

  console.log('1. 测试code:', code);

  try {
    const authUrl = `http://wechat.v2.traceint.com/index.php/urlNew/auth.html?r=https%3A%2F%2Fweb.traceint.com%2Fweb%2Findex.html&code=${code}&state=1`;

    console.log('2. 请求URL:', authUrl);

    const response = await axios.get(authUrl, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    console.log('3. 响应状态:', response.status);
    console.log('4. 响应头set-cookie:', response.headers['set-cookie']);

    const cookies = response.headers['set-cookie'];

    if (cookies && cookies.length >= 2) {
      const cookie1 = cookies[1].split(';')[0];
      const cookie2 = cookies[0].split(';')[0];
      const finalCookie = `${cookie1}; ${cookie2}`;

      console.log('5. Cookie1:', cookie1);
      console.log('6. Cookie2:', cookie2);
      console.log('7. 最终Cookie:', finalCookie);

      // 检查Cookie格式
      console.log('8. 包含Authorization:', finalCookie.includes('Authorization'));
      console.log('9. 包含SERVERID:', finalCookie.includes('SERVERID'));

      // 测试验证
      console.log('\n10. 验证Cookie...');
      const { AxiosRequest, DOMAIN } = require('./lib/http');
      const config = require('./lib/config');

      config.setCookie(finalCookie);

      const verifyResponse = await AxiosRequest.post(`${DOMAIN}/index.php/graphql/`, {
        operationName: 'libLayout',
        query: 'query libLayout($libId: Int, $libType: Int) {\n userAuth {\n reserve {\n libs(libType: $libType, libId: $libId) {\n lib_id\n is_open\n lib_floor\n lib_name\n lib_type\n lib_layout {\n seats_total\n seats_booking\n seats_used\n max_x\n max_y\n seats {\n x\n y\n key\n type\n name\n seat_status\n status\n }\n }\n }\n }\n }\n}',
        variables: {}
      });

      console.log('11. 验证响应data:', verifyResponse.data);
      console.log('12. userAuth存在:', verifyResponse.data?.data?.userAuth != null);

    } else {
      console.log('❌ Cookie不足2个');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testGetCookieByCode();
