/**
 * Fixed payload test comparing POST /api/price-prediction and POST /api/ai/price-estimate
 */

async function testEndpoints() {
  const payload = {
    city: "Mogadishu",
    type: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    parking: 1,
    isFurnished: false,
    askingPrice: 70000,
  };

  console.log("Fixed Input Payload:", JSON.stringify(payload, null, 2));

  // 1. Call POST /api/price-prediction
  console.log("\n--- Calling POST http://localhost:3000/api/price-prediction ---");
  const res1 = await fetch("http://localhost:3000/api/price-prediction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data1 = await res1.json();
  console.log("Status:", res1.status);
  console.log("Raw Response 1 (price-prediction):", JSON.stringify(data1, null, 2));

  // 2. Call POST /api/ai/price-estimate
  console.log("\n--- Calling POST http://localhost:3000/api/ai/price-estimate ---");
  const res2 = await fetch("http://localhost:3000/api/ai/price-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      features: {
        city: payload.city,
        propertyType: payload.type,
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        area: payload.area,
        parking: payload.parking,
        isFurnished: payload.isFurnished,
      },
      askingPrice: payload.askingPrice,
    }),
  });
  const data2 = await res2.json();
  console.log("Status:", res2.status);
  console.log("Raw Response 2 (ai/price-estimate):", JSON.stringify(data2, null, 2));

  console.log("\n--- Prediction Price Comparison ---");
  const price1 = data1.prediction?.predictedPrice;
  const price2 = data2.estimatedPrice;
  console.log(`Endpoint 1 (price-prediction) predictedPrice: ${price1}`);
  console.log(`Endpoint 2 (ai/price-estimate) estimatedPrice: ${price2}`);
  console.log(`State: ${price1 === price2 ? "IDENTICAL" : "DIFFERENT"}`);
}

testEndpoints().catch((err) => {
  console.error("Test endpoints failed:", err);
  process.exit(1);
});
