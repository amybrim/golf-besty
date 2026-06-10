/**
 * useGuestId — creates a persistent guest session ID stored in localStorage.
 * Jamie never needs to log in. His data is tied to this ID on his device.
 */
import { useState, useEffect } from "react";

const GUEST_KEY = "wally_guest_id";

function generateGuestId(): string {
  // Simple UUID-like ID
  return "guest_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useGuestId(): string {
  const [guestId, setGuestId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) return stored;
      const fresh = generateGuestId();
      localStorage.setItem(GUEST_KEY, fresh);
      return fresh;
    } catch {
      return generateGuestId();
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_KEY);
      if (!stored) {
        localStorage.setItem(GUEST_KEY, guestId);
      }
    } catch {
      // localStorage unavailable — guestId still works in memory for this session
    }
  }, [guestId]);

  return guestId;
}
