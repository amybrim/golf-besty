const response = await fetch("http://127.0.0.1:3000/api/trpc/companion.gardenGuidance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    json: {
      question: "What could I grow by my sunny front step?",
      wishes: ["Lavender for the front step", "Zinnias for the sunny patio"],
    },
  }),
});

if (!response.ok) {
  throw new Error(`Garden guidance request failed with HTTP ${response.status}`);
}

const payload = await response.json();
const result = payload?.result?.data?.json ?? payload?.result?.data ?? payload;

if (typeof result?.guidance !== "string" || result.guidance.trim().length < 20) {
  throw new Error("Elena garden guidance response was incomplete");
}

console.log(`GARDEN_GUIDANCE_OK chars=${result.guidance.length}`);
