import { describe, it, expect } from "vitest";
import { lc, isMine, daysBetween, fmtDate, titleCase, nameFromEmail, initials } from "@/lib/dashboard/people/text";

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
