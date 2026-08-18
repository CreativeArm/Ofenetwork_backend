const http = require('http');

async function main() {
  // 1. GET rates
  const getRes = await fetch("http://127.0.0.1:4000/api/rates");
  const getBody = await getRes.json();
  console.log("INITIAL RATES:", getBody);

  if (getBody.length === 0) {
    console.log("No rates");
    return;
  }

  const target = getBody[0];

  // 2. PATCH rate
  const patchRes = await fetch(`http://127.0.0.1:4000/api/rates/${target.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ depositRate: "N9,999.00 / $1", withdrawalRate: "N10,000.00 / $1" })
  });
  const patchBody = await patchRes.json();
  console.log("PATCH RESPONSE:", patchBody);

  // 3. GET rates again
  const getRes2 = await fetch("http://127.0.0.1:4000/api/rates");
  const getBody2 = await getRes2.json();
  console.log("FINAL RATES:", getBody2);
}

main().catch(console.error);
