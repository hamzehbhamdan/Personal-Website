import { describe, it, expect } from "vitest";
import { emptyHome } from "@/lib/dashboard/home/seed";
import { todaysIntentions, addIntention, toggleIntention, removeIntention } from "@/lib/dashboard/home/intentions";

describe("intentions", () => {
  it("adds a date-stamped, not-done intention (trimming) and ignores blanks", () => {
    let s = emptyHome();
    s = addIntention(s, "  ship the thing  ", "2026-07-17");
    expect(s.dailyIntentions).toHaveLength(1);
    expect(s.dailyIntentions[0]).toMatchObject({ text: "ship the thing", done: false, date: "2026-07-17" });
    const same = addIntention(s, "   ", "2026-07-17");
    expect(same).toBe(s); // blank → no-op, same reference
  });

  it("todaysIntentions filters by day key (daily reset)", () => {
    let s = emptyHome();
    s = addIntention(s, "today", "2026-07-17");
    s = addIntention(s, "yesterday", "2026-07-16");
    expect(todaysIntentions(s, "2026-07-17").map((i) => i.text)).toEqual(["today"]);
    expect(todaysIntentions(s, "2026-07-16").map((i) => i.text)).toEqual(["yesterday"]);
  });

  it("toggles and removes by id", () => {
    let s = addIntention(emptyHome(), "x", "2026-07-17");
    const id = s.dailyIntentions[0].id;
    s = toggleIntention(s, id);
    expect(s.dailyIntentions[0].done).toBe(true);
    s = toggleIntention(s, id);
    expect(s.dailyIntentions[0].done).toBe(false);
    s = removeIntention(s, id);
    expect(s.dailyIntentions).toHaveLength(0);
  });
});
