import { describe, it, expect } from "vitest";
import { parseAiRequest, MODELS, DEFAULT_MODEL, MAX_PROMPT } from "@/lib/dashboard/ai-schema";

describe("parseAiRequest — model allowlist + distill_voice", () => {
  const base = { task: "ask_people", prompt: "hi" };
  it("passes an allowed model through", () => {
    const r = parseAiRequest({ ...base, model: "claude-opus-4-8" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.model).toBe("claude-opus-4-8");
  });
  it("accepts every MODELS entry", () => {
    for (const m of MODELS) {
      const r = parseAiRequest({ ...base, model: m });
      expect(r.ok && r.value.model).toBe(m);
    }
  });
  it("drops an unknown model to undefined (still ok)", () => {
    const r = parseAiRequest({ ...base, model: "gpt-4" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.model).toBeUndefined();
  });
  it("missing model → undefined", () => {
    const r = parseAiRequest(base);
    expect(r.ok && r.value.model).toBeUndefined();
  });
  it("accepts the new distill_voice task", () => {
    expect(parseAiRequest({ task: "distill_voice", prompt: "x" }).ok).toBe(true);
  });
  it("still rejects unknown task / empty / oversized prompt", () => {
    expect(parseAiRequest({ task: "nope", prompt: "x" }).ok).toBe(false);
    expect(parseAiRequest({ task: "ask_people", prompt: "" }).ok).toBe(false);
    expect(parseAiRequest({ task: "ask_people", prompt: "x".repeat(MAX_PROMPT + 1) }).ok).toBe(false);
  });
  it("caps system to MAX_PROMPT", () => {
    const r = parseAiRequest({ ...base, system: "s".repeat(MAX_PROMPT + 100) });
    expect(r.ok && (r.value.system as string).length).toBe(MAX_PROMPT);
  });
  it("DEFAULT_MODEL is an allowed model", () => {
    expect((MODELS as readonly string[]).includes(DEFAULT_MODEL)).toBe(true);
  });
});
