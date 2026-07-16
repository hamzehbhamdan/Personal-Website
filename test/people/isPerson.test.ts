// test/people/isPerson.test.ts
import { describe, it, expect } from "vitest";
import { isPerson } from "@/lib/dashboard/people/isPerson";

describe("isPerson", () => {
  it("accepts a normal personal address", () => expect(isPerson("amir.khan@company.com")).toBe(true));
  it("rejects empty / non-email", () => { expect(isPerson("")).toBe(false); expect(isPerson("nope")).toBe(false); });
  it("rejects my own address", () => expect(isPerson("hamdanhamzeh0@gmail.com")).toBe(false));
  it("rejects BADWORDS local parts", () => {
    expect(isPerson("noreply@x.com")).toBe(false);
    expect(isPerson("newsletter@x.com")).toBe(false);
    expect(isPerson("info@x.com")).toBe(false);
  });
  it("filters role local-parts by exact match (info@, team@, hello@) — fixes latent artifact bug", () => {
    expect(isPerson("info@x.com")).toBe(false);
    expect(isPerson("team@x.com")).toBe(false);
    expect(isPerson("hello@x.com")).toBe(false);
  });
  it("does NOT regress real people whose local-part merely contains a role word", () => {
    expect(isPerson("ismail@x.com")).toBe(true);   // contains "mail" but isn't the role "mail"
    expect(isPerson("newsome@x.com")).toBe(true);  // contains "news" but isn't the role "news"
  });
  it("rejects marketing/ESP domains", () => expect(isPerson("a@mail.substack.com")).toBe(false));
  it("rejects calendar system senders", () => expect(isPerson("x@group.calendar.google.com")).toBe(false));
  it("rejects marketing subdomain prefixes (3+ labels)", () => expect(isPerson("hi@email.brand.com")).toBe(false));
  it("rejects long hex local parts and 1-char locals", () => {
    expect(isPerson("0123456789abcdef@x.com")).toBe(false);
    expect(isPerson("a@x.com")).toBe(false);
  });
  it("requires a dotted domain", () => expect(isPerson("a@localhost")).toBe(false));
});
