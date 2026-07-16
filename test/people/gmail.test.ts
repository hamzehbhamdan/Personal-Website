// test/people/gmail.test.ts
import { describe, it, expect } from "vitest";
import { parseAddrs, encodeSubject, buildDraftRaw } from "@/lib/gmail";

describe("gmail helpers", () => {
  describe("parseAddrs", () => {
    it("extracts <bracketed> addresses and lowercases", () => {
      expect(parseAddrs("John Doe <John@Corp.com>")).toEqual(["john@corp.com"]);
    });
    it("handles a quoted display name containing a comma (Last, First)", () => {
      expect(parseAddrs('"Smith, John" <john@corp.com>')).toEqual(["john@corp.com"]);
    });
    it("splits multiple bracketed recipients", () => {
      expect(parseAddrs('"Doe, J" <j@x.com>, "Roe, R" <r@y.com>')).toEqual(["j@x.com", "r@y.com"]);
    });
    it("falls back to bare comma-separated addresses when no brackets", () => {
      expect(parseAddrs("a@x.com, b@y.com")).toEqual(["a@x.com", "b@y.com"]);
    });
    it("drops non-email junk in bare mode", () => {
      expect(parseAddrs("not-an-email, real@x.com")).toEqual(["real@x.com"]);
    });
  });
  describe("encodeSubject", () => {
    it("passes pure ASCII through unchanged", () => expect(encodeSubject("Hello there")).toBe("Hello there"));
    it("collapses CR/LF (header-injection defense in depth)", () => {
      expect(encodeSubject("hi\r\nBcc: evil@x.com")).toBe("hi Bcc: evil@x.com");
      expect(/[\r\n]/.test(encodeSubject("a\nb"))).toBe(false);
    });
    it("RFC-2047 base64-encodes non-ASCII", () => {
      const out = encodeSubject("café ☕");
      expect(out.startsWith("=?UTF-8?B?")).toBe(true);
      expect(out.endsWith("?=")).toBe(true);
    });
  });
  describe("buildDraftRaw", () => {
    it("includes To + Subject, omits Bcc when empty", () => {
      const decoded = Buffer.from(buildDraftRaw(["a@x.com"], [], "Hi", "body"), "base64url").toString("utf8");
      expect(decoded).toContain("To: a@x.com");
      expect(decoded).toContain("Subject: Hi");
      expect(decoded).not.toContain("Bcc:");
      expect(decoded).toContain("\r\n\r\nbody");
    });
    it("adds a Bcc header only when bcc is non-empty", () => {
      const decoded = Buffer.from(buildDraftRaw(["me@x.com"], ["g1@x.com", "g2@y.com"], "Hi", "b"), "base64url").toString("utf8");
      expect(decoded).toContain("Bcc: g1@x.com, g2@y.com");
    });
  });
});
