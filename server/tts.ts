/**
 * ElevenLabs Text-to-Speech helper.
 *
 * All API access remains server-side. Voice IDs are chosen from a small,
 * intentional allowlist rather than supplied by a browser request.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export type VoiceProfile = "wally" | "elena";

const VOICE_PROFILES: Record<VoiceProfile, {
  id: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}> = {
  // Brian — deep, resonant and comforting — Wally's currently selected voice.
  wally: {
    id: "nPczCjzI2devNBz1zQrb",
    settings: {
      stability: 0.5,
      similarity_boost: 0.85,
      style: 0.15,
      use_speaker_boost: true,
    },
  },
  // Jessica — warm, bright American female voice for the fictional Elena demo.
  elena: {
    id: "cgSgspJ2msm6clMCkdW9",
    settings: {
      stability: 0.52,
      similarity_boost: 0.8,
      style: 0.12,
      use_speaker_boost: true,
    },
  },
};

export async function textToSpeech(text: string, profile: VoiceProfile = "wally"): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[TTS] ELEVENLABS_API_KEY not set");
    return null;
  }

  const voice = VOICE_PROFILES[profile];

  try {
    const res = await fetch(`${ELEVENLABS_API_URL}/${voice.id}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 2500), // free plan safe limit
        model_id: "eleven_turbo_v2_5", // fastest model — ~50% lower latency than multilingual_v2
        voice_settings: voice.settings,
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
