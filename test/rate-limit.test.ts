import { describe, it, expect } from "vitest";
import { allow } from "../lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit then blocks", () => {
    const key = "u1:test";
    let ok = true;
    for (let i = 0; i < 5; i++) ok = allow(key, 5, 60_000);
    expect(ok).toBe(true);
    expect(allow(key, 5, 60_000)).toBe(false);
  });
});
