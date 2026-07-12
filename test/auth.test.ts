import { describe, it, expect } from "vitest";
import { gateResult } from "../lib/auth";

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
