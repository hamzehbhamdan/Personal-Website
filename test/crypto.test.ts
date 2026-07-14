import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encryptToken, decryptToken } from "../lib/crypto";

beforeAll(() => { process.env.TOKEN_ENC_KEY = randomBytes(32).toString("base64"); });

describe("token crypto", () => {
  it("round-trips", () => {
    const s = "1//refresh-token-value";
    expect(decryptToken(encryptToken(s))).toBe(s);
  });
  it("produces a versioned, unique ciphertext per call (random IV)", () => {
    expect(encryptToken("x")).not.toBe(encryptToken("x"));
    expect(encryptToken("x").startsWith("v1:")).toBe(true);
  });
  it("rejects tampered ciphertext", () => {
    const c = encryptToken("secret").replace(/.$/, (ch) => (ch === "A" ? "B" : "A"));
    expect(() => decryptToken(c)).toThrow();
  });
});
