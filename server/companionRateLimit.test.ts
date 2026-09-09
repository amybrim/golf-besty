import { describe, expect, it } from "vitest";
import { createRequestLimiter } from "./companionRateLimit";

describe("createRequestLimiter", () => {
  it("allows the quota, blocks the next request, and resets after the window", () => {
    let clock = 1_000;
    const limiter = createRequestLimiter(() => clock);

    expect(limiter.allow("visitor-a", "garden", 2, 60_000)).toBe(true);
    expect(limiter.allow("visitor-a", "garden", 2, 60_000)).toBe(true);
    expect(limiter.allow("visitor-a", "garden", 2, 60_000)).toBe(false);

    clock += 60_000;
    expect(limiter.allow("visitor-a", "garden", 2, 60_000)).toBe(true);
  });

  it("keeps quota records isolated by visitor and companion feature", () => {
    const limiter = createRequestLimiter(() => 1_000);

    expect(limiter.allow("visitor-a", "tts", 1, 60_000)).toBe(true);
    expect(limiter.allow("visitor-b", "tts", 1, 60_000)).toBe(true);
    expect(limiter.allow("visitor-a", "garden", 1, 60_000)).toBe(true);
    expect(limiter.allow("visitor-a", "tts", 1, 60_000)).toBe(false);
  });
});
