// Test the favorite seats status API
const axios = require("axios");

async function testAPI() {
  try {
    const response = await axios.get("http://127.0.0.1:8899/lib/getFavoriteSeatsStatus");
    console.log("API Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testAPI();
