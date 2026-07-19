// test/keepalive.test.ts
import { describe, it, expect } from "vitest";
import { fitsKeepalive, KEEPALIVE_MAX_BODY_BYTES } from "@/lib/dashboard/keepalive";

describe("fitsKeepalive", () => {
  it("accepts a small body well under the cap", () => {
    const body = JSON.stringify({ data: { items: ["a", "b"] }, baseVersion: 3 });
    expect(fitsKeepalive(body)).toBe(true);
  });

  it("rejects a body at or over the cap", () => {
    // A single-byte-char string whose length equals the cap → size === max → not < max.
    const atCap = "x".repeat(KEEPALIVE_MAX_BODY_BYTES);
    expect(fitsKeepalive(atCap)).toBe(false);
    const overCap = "x".repeat(KEEPALIVE_MAX_BODY_BYTES + 1);
    expect(fitsKeepalive(overCap)).toBe(false);
  });

  it("is byte-accurate, not length-accurate (multi-byte UTF-8 counts by bytes)", () => {
    // "€" is 3 UTF-8 bytes. A string of length just under the cap in code units
    // is actually ~3x over the cap in bytes, so it must NOT fit.
    const euros = "€".repeat(Math.ceil(KEEPALIVE_MAX_BODY_BYTES / 2));
    expect(euros.length).toBeLessThan(KEEPALIVE_MAX_BODY_BYTES); // fits by char count
    expect(new Blob([euros]).size).toBeGreaterThan(KEEPALIVE_MAX_BODY_BYTES);
    expect(fitsKeepalive(euros)).toBe(false); // but not by byte count
  });

  it("counts the baseVersion wrapper toward the budget", () => {
    // A data blob that alone fits, but whose { data, baseVersion } wrapper tips
    // it over, must be rejected — the gate measures the real serialized body.
    const dataOnly = "y".repeat(KEEPALIVE_MAX_BODY_BYTES - 5);
    expect(fitsKeepalive(dataOnly)).toBe(true);
    const wrapped = JSON.stringify({ data: dataOnly, baseVersion: 12 });
    expect(new Blob([wrapped]).size).toBeGreaterThan(KEEPALIVE_MAX_BODY_BYTES);
    expect(fitsKeepalive(wrapped)).toBe(false);
  });

  it("honors a custom max override", () => {
    expect(fitsKeepalive("hello", 10)).toBe(true);
    expect(fitsKeepalive("hello world!!", 10)).toBe(false);
  });
});
