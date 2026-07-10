/**
 * useTTS — ElevenLabs Text-to-Speech hook
 * Calls the server-side /api/trpc/tts.speak endpoint and plays the returned audio.
 * Falls back to browser speechSynthesis if the API call fails.
 */
import { useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakMutation = trpc.tts.speak.useMutation();

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Also stop any browser TTS fallback
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      if (!text.trim()) return;

      // Stop any current speech
      stop();
      setSpeaking(true);

      try {
        const result = await speakMutation.mutateAsync({ text });
        const binary = atob(result.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setSpeaking(false);
          onEnd?.();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setSpeaking(false);
          onEnd?.();
          // Fallback to browser TTS
          browserFallback(text, onEnd);
        };

        await audio.play();
      } catch {
        setSpeaking(false);
        // Fallback to browser TTS if API fails
        browserFallback(text, onEnd);
      }
    },
    [speakMutation, stop]
  );

  return { speak, stop, speaking };
}

function browserFallback(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes("Daniel") ||
      v.name.includes("Alex") ||
      v.name.includes("Google UK English Male") ||
      v.name.includes("Google US English")
  );
  if (preferred) utterance.voice = preferred;
  utterance.onend = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
