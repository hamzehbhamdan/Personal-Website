import { describe, it, expect } from "vitest";
import { extractPlainBody, cleanBody, decodeB64Url } from "@/lib/gmail-read";

describe("gmail-read pure helpers", () => {
  it("decodeB64Url decodes base64url to utf8", () => {
    const enc = Buffer.from("héllo — hi", "utf8").toString("base64url");
    expect(decodeB64Url(enc)).toBe("héllo — hi");
  });
  it("extractPlainBody finds the text/plain part recursively (prefers plain over html)", () => {
    const payload = { mimeType: "multipart/alternative", parts: [
      { mimeType: "text/html", body: { data: Buffer.from("<b>hi</b>", "utf8").toString("base64url") } },
      { mimeType: "text/plain", body: { data: Buffer.from("hey there\n-H", "utf8").toString("base64url") } },
    ] };
    expect(extractPlainBody(payload)).toBe("hey there\n-H");
  });
  it("extractPlainBody returns '' when no plain part / null", () => {
    expect(extractPlainBody({ mimeType: "text/html", body: { data: "x" } })).toBe("");
    expect(extractPlainBody(null)).toBe("");
  });
  it("cleanBody strips quoted-reply history and caps length", () => {
    const c = cleanBody("My actual message here.\n\nOn Mon, Amir wrote:\n> old stuff\n> more old");
    expect(c).toContain("My actual message here.");
    expect(c).not.toContain("old stuff");
    expect(cleanBody("x".repeat(5000)).length).toBe(3000);
  });
  it("cleanBody strips a Gmail wrapped 'On … wrote:' header (address + 'wrote:' on separate lines)", () => {
    const raw = "My reply text.\n\nOn Tue, Jul 14, 2026 at 4:27 PM Jen Winston <jen@x.com>\nwrote:\n\n> old thread\n> more";
    const c = cleanBody(raw);
    expect(c).toBe("My reply text.");
    expect(c).not.toContain("wrote:");
    expect(c).not.toContain("Jen Winston");
  });
});
