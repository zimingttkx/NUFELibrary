// Find seat "101" in library 35
const axios = require("axios");
const fs = require("fs");

async function findSeat() {
  try {
    const data = JSON.parse(fs.readFileSync("./fuckinglib/data.json", "utf-8"));
    const cookie = data.CookeObj.Cookie;

    const query = {
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
      variables: { libId: 35, libType: 1 },
    };

    const response = await axios.post(
      "http://wechat.v2.traceint.com/index.php/graphql/reserveSeat",
      query,
      { headers: { Cookie: cookie, "Content-Type": "application/json" } }
    );

    const lib = response.data.data.userAuth.reserve.libs[0];
    const seats = lib.lib_layout.seats;

    // Find all seats with "101" in the name
    const matching = seats.filter(s => s.name && s.name.includes("101"));

    console.log(`Total seats in library 35: ${seats.length}`);
    console.log(`\nSeats containing "101":`);
    if (matching.length > 0) {
      matching.forEach(s => console.log(`  - key: "${s.key}", name: "${s.name}", status: ${s.seat_status}`));
    } else {
      console.log("  (None found)");
    }

    // Show all numbered seats (not "null" or "")
    const numberedSeats = seats.filter(s => s.name && s.name !== "null" && s.name !== "" && /^\d+$/.test(s.name));
    console.log(`\nTotal numbered seats: ${numberedSeats.length}`);
    console.log("\nFirst 50 numbered seats:");
    numberedSeats.slice(0, 50).forEach((s, i) => {
      console.log(`  ${i+1}. key: "${s.key}", name: "${s.name}", status: ${s.seat_status}`);
    });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

findSeat();
