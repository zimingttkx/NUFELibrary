// Set cookie from OAuth URL
const axios = require("axios");

async function setCookie() {
  try {
    const oauthUrl = "http://wechat.v2.traceint.com/index.php/graphql/?operationName=index&query=query%7BuserAuth%7BtongJi%7Brank%7D%7D%7D&code=091Q7CGa1nMDIK0FKfJa1EeJ041Q7CGh&state=1";

    console.log("Setting cookie with OAuth URL...");

    // Call the backend setCookieByCode API
    const response = await axios.post("http://127.0.0.1:8899/lib/setCookieByCode", {
      codeOrUrl: oauthUrl
    });

    console.log("\nResponse:");
    console.log(JSON.stringify(response.data, null, 2));

    // Check the Cookie status
    const statusResponse = await axios.get("http://127.0.0.1:8899/lib/getCookieStatus");
    console.log("\nCookie Status:");
    console.log(JSON.stringify(statusResponse.data, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

setCookie();
