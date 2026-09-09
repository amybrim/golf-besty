import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./tts", () => ({
  textToSpeech: vi.fn(async () => Buffer.from("demo-audio")),
}));

import { appRouter } from "./routers";

function makeCtx(visitor: string): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": visitor },
      socket: { remoteAddress: visitor },
    } as unknown as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Elena demo endpoint guard", () => {
  it("limits the Elena voice demo but does not apply that demo limit to Wally", async () => {
    const caller = appRouter.createCaller(makeCtx("demo-test-visitor"));

    for (let request = 0; request < 90; request += 1) {
      await expect(caller.tts.speak({ text: "A short demo phrase.", profile: "elena" })).resolves.toMatchObject({ mimeType: "audio/mpeg" });
    }

    await expect(caller.tts.speak({ text: "One too many.", profile: "elena" }))
      .rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    await expect(caller.tts.speak({ text: "Wally stays outside the demo quota.", profile: "wally" }))
      .resolves.toMatchObject({ mimeType: "audio/mpeg" });
  });
});
