import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

/**
 * useAnalytics — fire-and-forget event tracking hook.
 *
 * Usage:
 *   const { track } = useAnalytics("jamie-guest-id");
 *   track("page_view", { page: "/voice-aid" });
 *   track("voice_aid_phrase_tap", { label: "I need water" });
 */

export type TrackEvent =
  | "page_view"
  | "voice_aid_phrase_tap"
  | "voice_aid_typed_speak"
  | "voice_aid_say_again"
  | "chat_message_sent"
  | "showdown_pick_made"
  | "showdown_pick_changed"
  | "morning_briefing_opened"
  | "morning_briefing_skipped"
  | "family_drop_played"
  | "family_drop_received"
  | "trivia_answered"
  | "round_logged"
  | "memory_added";

interface TrackOptions {
  page?: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export function useAnalytics(guestId?: string) {
  const logMutation = trpc.analytics.log.useMutation();

  const track = useCallback(
    (event: TrackEvent, options: TrackOptions = {}) => {
      // Fire and forget — never await, never block the user
      logMutation.mutate({
        guestId: guestId ?? undefined,
        event,
        page: options.page,
        label: options.label,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      });
    },
    [guestId, logMutation]
  );

  return { track };
}
