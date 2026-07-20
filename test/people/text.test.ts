import { describe, it, expect } from "vitest";
import { lc, isMine, daysBetween, fmtDate, titleCase, nameFromEmail, initials, toEpochMs } from "@/lib/dashboard/people/text";

describe("text helpers", () => {
  it("lc trims + lowercases", () => expect(lc("  A@X.Com ")).toBe("a@x.com"));
  it("isMine matches MY_EMAILS case-insensitively", () => {
    expect(isMine("HamdanHamzeh0@gmail.com")).toBe(true);
    expect(isMine("stranger@x.com")).toBe(false);
  });
  it("daysBetween floors day difference", () => {
    expect(daysBetween(new Date("2026-07-11"), new Date("2026-07-01"))).toBe(10);
  });
  it("fmtDate → 'Mon D, YY'; null → em dash", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate("2026-03-01T00:00:00Z")).toMatch(/Mar/);
  });
  it("titleCase splits ._- and caps words", () => expect(titleCase("amir.khan_jr")).toBe("Amir Khan Jr"));
  it("nameFromEmail titlecases the local part", () => expect(nameFromEmail("Amir.Khan@x.com")).toBe("Amir Khan"));
  it("initials takes ≤2 uppercase leading letters", () => {
    expect(initials("Amir Khan")).toBe("AK");
    expect(initials("")).toBe("?");
  });
});

describe("toEpochMs", () => {
  it("parses gmail 'Z' ISO to the exact UTC instant", () => {
    expect(toEpochMs("2026-07-18T20:00:00.000Z")).toBe(Date.UTC(2026, 6, 18, 20, 0, 0));
  });
  it("parses RFC3339 with a local offset to the exact UTC instant", () => {
    expect(toEpochMs("2026-07-18T18:00:00-05:00")).toBe(Date.UTC(2026, 6, 18, 23, 0, 0));
  });
  it("parses all-day YYYY-MM-DD as LOCAL midnight (== UTC midnight under the pinned test TZ)", () => {
    expect(toEpochMs("2026-07-18")).toBe(new Date(2026, 6, 18).getTime());
  });
  it("orders mixed formats by instant, not by string", () => {
    // lexicographic says "...T18:00:00-05:00" < "...T20:00:00.000Z"; the instant is 3h LATER
    expect(toEpochMs("2026-07-18T18:00:00-05:00")).toBeGreaterThan(toEpochMs("2026-07-18T20:00:00.000Z"));
    // lexicographic says all-day "2026-06-22" > "2026-06-21T23:00:00-05:00"; the instant is EARLIER
    expect(toEpochMs("2026-06-22")).toBeLessThan(toEpochMs("2026-06-21T23:00:00-05:00"));
  });
});
