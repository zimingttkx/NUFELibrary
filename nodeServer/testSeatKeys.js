// Test script to check seat key format from GraphQL API
const axios = require("axios");
const fs = require("fs");

async function testSeatKeys() {
  try {
    // Read cookie from data.json
    const data = JSON.parse(
      fs.readFileSync("./fuckinglib/data.json", "utf-8")
    );
    const cookie = data.CookeObj.Cookie;

    // Test library 35 (一楼电梯前厅) - looking for seat "101"
    console.log("\n=== Testing Library 35 (一楼电梯前厅) ===");
    const query1 = {
      operationName: "libLayout",
      query: `query libLayout($libId: Int, $libType: Int) {
        userAuth {
          reserve {
            libs(libType: $libType, libId: $libId) {
              lib_id
              lib_name
              lib_layout {
                seats {
                  key
                  name
                  seat_status
                }
              }
            }
          }
        }
      }`,
      variables: {
        libId: 35,
        libType: 1,
      },
    };

    const response1 = await axios.post(
      "http://wechat.v2.traceint.com/index.php/graphql/reserveSeat",
      query1,
      {
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
      }
    );

    if (response1.data.errors) {
      console.log("GraphQL Errors:", response1.data.errors);
      return;
    }

    const lib1 = response1.data.data.userAuth.reserve.libs[0];
    console.log("Library ID:", lib1.lib_id);
    console.log("Library Name:", lib1.lib_name);
    console.log("Total seats:", lib1.lib_layout.seats.length);

    // Find ALL seats with non-empty names (actual bookable seats)
    const namedSeats = lib1.lib_layout.seats.filter(s => s.name && s.name !== "null" && s.name !== "");
    console.log(`\nFound ${namedSeats.length} named seats out of ${lib1.lib_layout.seats.length} total`);
    console.log("\nFirst 30 named seats:");
    namedSeats.slice(0, 30).forEach((seat, idx) => {
      console.log(`  [${idx}] key: "${seat.key}", name: "${seat.name}", status: ${seat.seat_status}`);
    });

    // Find seat with name "101"
    const seat101 = lib1.lib_layout.seats.find(s => s.name === "101");
    if (seat101) {
      console.log('\n✓ Found seat "101":');
      console.log(`  key: "${seat101.key}"`);
      console.log(`  name: "${seat101.name}"`);
      console.log(`  seat_status: ${seat101.seat_status}`);
    } else {
      console.log('\n✗ Seat "101" not found');
      // Try to find any seat with "1" in it
      const seat1 = namedSeats.find(s => s.name.includes("1"));
      if (seat1) {
        console.log(`  First seat with "1": key="${seat1.key}", name="${seat1.name}"`);
      }
    }

    // Check the stored key
    console.log('\n--- Checking stored key "1,2." ---');
    const storedSeat1 = lib1.lib_layout.seats.find(s => s.key === "1,2." || s.key === "1,2");
    if (storedSeat1) {
      console.log(`✓ Found seat with key "1,2" or "1,2.":`, storedSeat1);
    } else {
      console.log('✗ No seat found with key "1,2" or "1,2."');
    }

    // Test library 429 (一楼东区东一) - looking for seat "179"
    console.log("\n\n=== Testing Library 429 (一楼东区东一) ===");
    const query2 = {
      operationName: "libLayout",
      query: `query libLayout($libId: Int, $libType: Int) {
        userAuth {
          reserve {
            libs(libType: $libType, libId: $libId) {
              lib_id
              lib_name
              lib_layout {
                seats {
                  key
                  name
                  seat_status
                }
              }
            }
          }
        }
      }`,
      variables: {
        libId: 429,
        libType: 1,
      },
    };

    const response2 = await axios.post(
      "http://wechat.v2.traceint.com/index.php/graphql/reserveSeat",
      query2,
      {
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
      }
    );

    if (response2.data.errors) {
      console.log("GraphQL Errors:", response2.data.errors);
      return;
    }

    const lib2 = response2.data.data.userAuth.reserve.libs[0];
    console.log("Library ID:", lib2.lib_id);
    console.log("Library Name:", lib2.lib_name);
    console.log("Total seats:", lib2.lib_layout.seats.length);

    // Find seat with name "179"
    const seat179 = lib2.lib_layout.seats.find(s => s.name === "179");
    if (seat179) {
      console.log('\n✓ Found seat "179":');
      console.log(`  key: "${seat179.key}"`);
      console.log(`  name: "${seat179.name}"`);
      console.log(`  seat_status: ${seat179.seat_status}`);
    } else {
      console.log('\n✗ Seat "179" not found');
    }

    // Check the stored key
    console.log('\n--- Checking stored key "32,3." ---');
    const storedSeat2 = lib2.lib_layout.seats.find(s => s.key === "32,3." || s.key === "32,3");
    if (storedSeat2) {
      console.log(`✓ Found seat with key "32,3" or "32,3.":`, storedSeat2);
    } else {
      console.log('✗ No seat found with key "32,3" or "32,3."');
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

testSeatKeys();
