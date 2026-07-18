import { describe, it, expect } from "vitest";
import { quoteForDay, DEFAULT_QUOTES } from "@/lib/dashboard/home/quotes";
import type { HomeSettings } from "@/lib/dashboard/home/types";

const on: HomeSettings = { showQuotes: true };

describe("quoteForDay", () => {
  it("is stable within the same calendar day", () => {
    const a = quoteForDay([], on, new Date(2026, 6, 17, 8, 0, 0));
    const b = quoteForDay([], on, new Date(2026, 6, 17, 22, 0, 0));
    expect(a).toEqual(b);
  });

  it("returns null when quotes are disabled", () => {
    expect(quoteForDay(DEFAULT_QUOTES, { showQuotes: false }, new Date(2026, 6, 17))).toBeNull();
  });

  it("falls back to DEFAULT_QUOTES when the pool is empty", () => {
    const q = quoteForDay([], on, new Date(2026, 6, 17));
    expect(q).not.toBeNull();
    expect(DEFAULT_QUOTES).toContainEqual(q!);
  });

  it("prefers user quotes when present", () => {
    const q = quoteForDay([{ text: "only one", author: "me" }], on, new Date(2026, 6, 17));
    expect(q).toEqual({ text: "only one", author: "me" });
  });

  it("cycles across days", () => {
    const pool = [
      { text: "a" },
      { text: "b" },
      { text: "c" },
    ];
    const days = [10, 11, 12, 13].map((d) => quoteForDay(pool, on, new Date(2026, 0, d))!.text);
    // three-quote pool over four consecutive days → cycles back
    expect(new Set(days).size).toBeGreaterThan(1);
  });
});
