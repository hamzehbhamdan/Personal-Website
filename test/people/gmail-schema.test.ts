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

import { sentRecipientQuery, parseSentSearchReq, parseSentBodiesReq } from "@/lib/dashboard/people/gmail-schema";

describe("sentRecipientQuery", () => {
  it("returns '' when there is no recipient", () => {
    expect(sentRecipientQuery("")).toBe("");
    expect(sentRecipientQuery("   ")).toBe("");
  });
  it("builds a to: term, strips newlines + caps length", () => {
    expect(sentRecipientQuery("alex@acme.com")).toBe("to:alex@acme.com");
    expect(sentRecipientQuery("a\nb")).toBe("to:a b");
    expect(sentRecipientQuery("x".repeat(300)).length).toBeLessThan(130);
  });
});

describe("parseSentSearchReq", () => {
  it("accepts optional fields and defaults to empty strings", () => {
    const r = parseSentSearchReq({ to: "a@b.com" });
    expect(r.ok && r.value).toEqual({ to: "a@b.com", pageToken: "" });
  });
  it("coerces non-strings to empty + caps", () => {
    const r = parseSentSearchReq({ to: 5, pageToken: 7 });
    expect(r.ok && r.value.to).toBe("");
    expect(r.ok && r.value.pageToken).toBe("");
  });
  it("caps an over-long recipient", () => {
    const r = parseSentSearchReq({ to: "k".repeat(500) });
    expect(r.ok && r.value.to.length).toBe(120);
  });
  it("rejects a non-object body", () => {
    expect(parseSentSearchReq("nope").ok).toBe(false);
  });
});

describe("parseSentBodiesReq", () => {
  it("accepts 1..20 string ids", () => {
    const r = parseSentBodiesReq({ ids: ["a", "b"] });
    expect(r.ok && r.value.ids).toEqual(["a", "b"]);
  });
  it("rejects empty, >20, non-array, or newline ids", () => {
    expect(parseSentBodiesReq({ ids: [] }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: Array(21).fill("x") }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: "x" }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: ["a\nb"] }).ok).toBe(false);
  });
});
