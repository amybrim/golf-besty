const response = await fetch("http://127.0.0.1:3000/api/trpc/tts.speak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    json: {
      text: "Hello, I am Elena. I am here for your day.",
      profile: "elena",
    },
  }),
});

if (!response.ok) {
  throw new Error(`TTS request failed with HTTP ${response.status}`);
}

const payload = await response.json();
const result = payload?.result?.data?.json ?? payload?.result?.data ?? payload;

if (!result?.audio || result?.mimeType !== "audio/mpeg") {
  throw new Error("Elena TTS response did not contain MPEG audio");
}

console.log(`TTS_OK mime=${result.mimeType} base64Chars=${result.audio.length}`);
