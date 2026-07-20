// test/people/suggestions.test.ts
import { describe, it, expect } from "vitest";
import { buildSuggestions } from "@/lib/dashboard/people/suggestions";
import { emptyDb } from "@/lib/dashboard/people/backup";
import type { GmailMap, CalMap } from "@/lib/dashboard/people/types";

describe("buildSuggestions", () => {
  it("cross-format: picks the newest `last` by instant across gmail 'Z' and calendar offset strings (#37)", () => {
    const gmail: GmailMap = { "x@y.com": { last: "2026-06-22T01:00:00.000Z", lastDir: "in", count: 2, msgs: [] } };
    // 23:00-05:00 == 04:00Z on the 22nd — newest instant, lexicographically smaller
    const cal: CalMap = { "x@y.com": { lastPast: "2026-06-21T23:00:00-05:00", next: null, events: [{ date: "2026-06-21T23:00:00-05:00", summary: "s" }] } };
    const [s] = buildSuggestions(emptyDb(), gmail, cal);
    expect(s.email).toBe("x@y.com");
    expect(s.score).toBe(5); // 2 msgs + 3×1 event
    expect(s.last).toBe("2026-06-21T23:00:00-05:00");
  });
});
