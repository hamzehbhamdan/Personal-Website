import { describe, it, expect } from "vitest";
import { gateResult, isGatedPath } from "../lib/auth";

const ALLOWED = "owner@example.com";

describe("gateResult", () => {
  it("401 when no user", () => {
    expect(gateResult(null, ALLOWED)).toEqual({ ok: false, status: 401 });
  });
  it("403 when wrong email", () => {
    expect(gateResult({ id: "x", email: "someone@else.com" }, ALLOWED)).toEqual({ ok: false, status: 403 });
  });
  it("ok for the allowed email (case-insensitive)", () => {
    expect(gateResult({ id: "u1", email: "OWNER@example.com" }, ALLOWED)).toEqual({ ok: true, userId: "u1" });
  });
  it("403 when ALLOWED_EMAIL unset (fail closed)", () => {
    expect(gateResult({ id: "u1", email: "owner@example.com" }, undefined)).toEqual({ ok: false, status: 403 });
  });
  it("403 when ALLOWED_EMAIL is whitespace-only (fail closed)", () => {
    expect(gateResult({ id: "u1", email: "owner@example.com" }, "   ")).toEqual({ ok: false, status: 403 });
  });
  it("403 when user has no email even if allow-list is whitespace (fail closed)", () => {
    expect(gateResult({ id: "u1", email: null }, "   ")).toEqual({ ok: false, status: 403 });
  });
});

describe("isGatedPath", () => {
  it("gates /dashboard on any host", () => {
    expect(isGatedPath("/dashboard", "www")).toBe(true);
    expect(isGatedPath("/dashboard/settings", "hamzehhamdan")).toBe(true);
  });
  it("gates every my.* path EXCEPT the auth surfaces (the way in must stay reachable)", () => {
    expect(isGatedPath("/", "my")).toBe(true);
    expect(isGatedPath("/anything", "my")).toBe(true);
    expect(isGatedPath("/login", "my")).toBe(false);
    expect(isGatedPath("/auth", "my")).toBe(false);          // no trailing slash
    expect(isGatedPath("/auth/callback", "my")).toBe(false);
  });
  it("gates paths that merely START WITH the auth/login letters (segment-exact, not prefix)", () => {
    // A raw startsWith("/auth") would wrongly exempt these from the gate.
    expect(isGatedPath("/authors", "my")).toBe(true);
    expect(isGatedPath("/auth-debug", "my")).toBe(true);
    expect(isGatedPath("/dashboard/auth-debug", "www")).toBe(true);
    expect(isGatedPath("/login-admin", "my")).toBe(true);
  });
  it("leaves the public site ungated", () => {
    expect(isGatedPath("/", "www")).toBe(false);
    expect(isGatedPath("/blog", "hamzehhamdan")).toBe(false);
  });
});
