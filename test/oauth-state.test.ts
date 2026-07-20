import { describe, it, expect } from "vitest";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_PATH,
  OAUTH_STATE_COOKIE_MAX_AGE,
  readCookieValue,
  oauthStateMatches,
} from "@/lib/oauth-state";

describe("oauth-state constants", () => {
  it("pins the cookie contract shared by connect and callback", () => {
    expect(OAUTH_STATE_COOKIE).toBe("g_oauth_state");
    expect(OAUTH_STATE_COOKIE_PATH).toBe("/api/google");
    expect(OAUTH_STATE_COOKIE_MAX_AGE).toBe(600);
  });
});

describe("readCookieValue", () => {
  it("finds the named cookie among several", () => {
    expect(readCookieValue("a=1; g_oauth_state=abc-123; b=2", "g_oauth_state")).toBe("abc-123");
  });
  it("handles a single cookie with no spaces", () => {
    expect(readCookieValue("g_oauth_state=xyz", "g_oauth_state")).toBe("xyz");
  });
  it("does not match a cookie whose name merely ends with the target", () => {
    expect(readCookieValue("not_g_oauth_state=evil; b=2", "g_oauth_state")).toBeNull();
  });
  it("returns null when the header is null", () => {
    expect(readCookieValue(null, "g_oauth_state")).toBeNull();
  });
  it("returns null when the cookie is absent", () => {
    expect(readCookieValue("a=1; b=2", "g_oauth_state")).toBeNull();
  });
  it("percent-decodes the value", () => {
    expect(readCookieValue("g_oauth_state=a%3Db", "g_oauth_state")).toBe("a=b");
  });
  it("returns the raw value when percent-decoding fails", () => {
    expect(readCookieValue("g_oauth_state=%E0%A4%A", "g_oauth_state")).toBe("%E0%A4%A");
  });
  it("does not match a cookie whose name is the target plus a suffix (prefix collision)", () => {
    expect(readCookieValue("g_oauth_state_x=evil", "g_oauth_state")).toBeNull();
  });
  it("finds the target cookie when it is listed first among several", () => {
    expect(readCookieValue("g_oauth_state=first; a=1; b=2", "g_oauth_state")).toBe("first");
  });
  it("finds the target cookie when it is listed last among several", () => {
    expect(readCookieValue("a=1; b=2; g_oauth_state=last", "g_oauth_state")).toBe("last");
  });
});

describe("oauthStateMatches", () => {
  it("matches when query state equals cookie state", () => {
    expect(oauthStateMatches("nonce-1", "nonce-1")).toBe(true);
  });
  it("rejects a mismatch", () => {
    expect(oauthStateMatches("nonce-1", "nonce-2")).toBe(false);
  });
  it("rejects a missing query state even when the cookie exists", () => {
    expect(oauthStateMatches(null, "nonce-1")).toBe(false);
  });
  it("rejects a missing cookie even when the query state exists", () => {
    expect(oauthStateMatches("nonce-1", null)).toBe(false);
  });
  it("rejects both missing (null must never equal null)", () => {
    expect(oauthStateMatches(null, null)).toBe(false);
  });
  it("rejects empty strings on both sides", () => {
    expect(oauthStateMatches("", "")).toBe(false);
  });
  it("rejects an empty query state against a non-empty cookie", () => {
    expect(oauthStateMatches("", "x")).toBe(false);
  });
  it("rejects a non-empty query state against an empty cookie", () => {
    expect(oauthStateMatches("x", "")).toBe(false);
  });
  it("rejects a null query state against an empty cookie", () => {
    expect(oauthStateMatches(null, "")).toBe(false);
  });
  it("rejects an empty query state against a null cookie", () => {
    expect(oauthStateMatches("", null)).toBe(false);
  });
});
