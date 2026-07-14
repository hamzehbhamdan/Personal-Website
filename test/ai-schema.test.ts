import { describe, it, expect } from "vitest";
import { parseAiRequest } from "../lib/dashboard/ai-schema";

describe("parseAiRequest", () => {
  it("accepts a task + short prompt", () => {
    const r = parseAiRequest({ task: "draft_checkin", prompt: "hi" });
    expect(r.ok).toBe(true);
  });
  it("rejects unknown task", () => { expect(parseAiRequest({ task: "nuke", prompt: "x" }).ok).toBe(false); });
  it("rejects oversized prompt", () => { expect(parseAiRequest({ task: "coach_chat", prompt: "x".repeat(60_000) }).ok).toBe(false); });
});
