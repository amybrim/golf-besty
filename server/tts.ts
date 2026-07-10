/**
 * ElevenLabs Text-to-Speech helper
 * Uses Adam voice (pNInz6obpgDQGcFmaJgB) — available on free plan
 * When Pro plan activates, swap VOICE_ID to gUABw7pXQjhjt0kNFBTF (Andrew)
 * or to Jamie's cloned voice ID once created.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Adam — deep, warm, American male narrator (free plan)
// To upgrade: swap to gUABw7pXQjhjt0kNFBTF (Andrew) or Jamie's clone ID
export const WALLY_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

export async function textToSpeech(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[TTS] ELEVENLABS_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(`${ELEVENLABS_API_URL}/${WALLY_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 2500), // free plan safe limit
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[TTS] ElevenLabs error:", res.status, err);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[TTS] Fetch failed:", err);
    return null;
  }
}
