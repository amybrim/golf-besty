import { describe, expect, it } from "vitest";
import {
  buildElenaDailyMessageSystemPrompt,
  buildElenaDailyMessageUserPrompt,
  getElenaDailyMessageFallback,
} from "./elenaDailyMessage";

describe("Elena daily message helpers", () => {
  const input = {
    dateLabel: "Thursday, September 11",
    gardenWishes: ["lavender for the front step"],
    hasSavedFramePhoto: true,
  };

  it("keeps the LLM brief grounded in supplied fictional companion context", () => {
    expect(buildElenaDailyMessageSystemPrompt()).toContain("Do not invent messages");
    expect(buildElenaDailyMessageUserPrompt(input)).toContain("lavender for the front step");
    expect(buildElenaDailyMessageUserPrompt(input)).toContain("saved on her device");
  });

  it("provides a warm deterministic fallback when generation is unavailable", () => {
    const fallback = getElenaDailyMessageFallback(input);
    expect(fallback).toContain("Good morning, Elena.");
    expect(fallback).toContain("lavender for the front step");
    expect(fallback).toContain("Living Frame");
  });
});
