import { describe, it, expect } from "vitest";
import { parseSearchReq, parseDraftReq, parseSendReq } from "@/lib/dashboard/people/gmail-schema";

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

describe("gmail schema — cc + send", () => {
  it("draft cc validated + counted toward the recipient cap", () => {
    const r = parseDraftReq({ to: ["a@x.com"], cc: ["c@x.com"], subject: "hi", body: "b" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.value.cc).toEqual(["c@x.com"]);
    expect(parseDraftReq({ to: ["a@x.com"], cc: ["not-an-email"], subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseDraftReq({ to: Array(150).fill("a@x.com"), cc: Array(60).fill("c@x.com"), subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseDraftReq({ to: ["a@x.com"], subject: "hi", body: "b" }).ok).toBe(true); // no cc → cc:[]
  });
  it("parseSendReq requires a draftId + reuses the draft guards", () => {
    expect(parseSendReq({ draftId: "d123", to: ["a@x.com"], subject: "hi", body: "b" }).ok).toBe(true);
    expect(parseSendReq({ to: ["a@x.com"], subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseSendReq({ draftId: "", to: ["a@x.com"], subject: "hi", body: "b" }).ok).toBe(false);
    expect(parseSendReq({ draftId: "d", to: ["a@x.com"], subject: "hi\r\nBcc: evil@x.com", body: "b" }).ok).toBe(false);
    expect(parseSendReq({ draftId: "d", to: ["bad"], subject: "hi", body: "b" }).ok).toBe(false);
  });
});
