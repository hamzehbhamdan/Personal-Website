import { describe, it, expect } from "vitest";
import { parseSearchReq, parseDraftReq } from "@/lib/dashboard/people/gmail-schema";

describe("gmail schemas", () => {
  it("search accepts sent|inbox, rejects others", () => {
    expect(parseSearchReq({ mailbox: "sent" }).ok).toBe(true);
    expect(parseSearchReq({ mailbox: "bodies" }).ok).toBe(false);
  });
  it("draft requires ≥1 valid recipient, caps count, rejects bad emails", () => {
    expect(parseDraftReq({ to: ["a@x.com"], subject: "hi", body: "b" }).ok).toBe(true);
    expect(parseDraftReq({ to: [], subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseDraftReq({ to: ["not-an-email"], subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseDraftReq({ to: Array(300).fill("a@x.com"), subject: "hi", body: "b" }).ok).toBe(false);
  });
  it("draft caps subject/body size and validates bcc list", () => {
    expect(parseDraftReq({ to: ["a@x.com"], bcc: ["b@y.com"], subject: "hi", body: "b" }).ok).toBe(true);
    expect(parseDraftReq({ to: ["a@x.com"], subject: "x".repeat(2000), body: "b" }).ok).toBe(false);
  });
  it("draft rejects CR/LF in subject (header-injection guard)", () => {
    expect(parseDraftReq({ to: ["a@x.com"], subject: "hi\r\nBcc: evil@x.com", body: "b" }).ok).toBe(false);
    expect(parseDraftReq({ to: ["a@x.com"], subject: "hi\nX-Injected: 1", body: "b" }).ok).toBe(false);
  });
});
