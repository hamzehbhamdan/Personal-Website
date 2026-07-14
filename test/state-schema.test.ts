import { describe, it, expect } from "vitest";
import { validateStateWrite, MAX_STATE_BYTES } from "../lib/dashboard/state-schema";

describe("validateStateWrite", () => {
  it("accepts a small object for a known app", () => {
    expect(validateStateWrite("lifeCRM", { contacts: [] }).ok).toBe(true);
  });
  it("rejects an unknown app", () => {
    expect(validateStateWrite("evil", {}).ok).toBe(false);
  });
  it("rejects a non-object payload", () => {
    expect(validateStateWrite("lifeCRM", [1, 2, 3]).ok).toBe(false);
  });
  it("rejects an oversized payload", () => {
    const big = { blob: "x".repeat(MAX_STATE_BYTES + 10) };
    expect(validateStateWrite("lifeCRM", big).ok).toBe(false);
  });
});
