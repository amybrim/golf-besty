import { describe, it, expect } from "vitest";

describe("ElevenLabs API key validation", () => {
  it("should have a valid API key with TTS access", async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    expect(key, "ELEVENLABS_API_KEY must be set").toBeTruthy();

    // Test TTS directly with Adam voice (free plan)
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB", {
      method: "POST",
      headers: { "xi-api-key": key!, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: "Hello Jamie", model_id: "eleven_multilingual_v2" }),
    });
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000); // valid MP3 file
  });

  it("should be able to list voices from the shared voice library", async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    const res = await fetch("https://api.elevenlabs.io/v1/shared-voices?page_size=1", {
      headers: { "xi-api-key": key! },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("voices");
  });
});
