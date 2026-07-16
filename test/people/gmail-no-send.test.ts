// test/people/gmail-no-send.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Durability guard for the create-never-send invariant.
 *
 * The Gmail integration uses the `gmail.compose` scope (required for drafts.create). That scope
 * ALSO technically permits sending — so the "nothing is ever sent" guarantee rests entirely on the
 * code never calling a Gmail send endpoint. This test fails CI if any send path is (re)introduced
 * into the Gmail server code, keeping the guarantee durable rather than convention-only.
 */
const FILES = [
  "lib/gmail.ts",
  "app/api/gmail/draft/route.ts",
  "app/api/gmail/search/route.ts",
];
const SEND = /\/messages\/send|\/drafts\/[^"'`\s]*\/send|messages\.send|drafts\.send/;

describe("gmail: create-never-send invariant", () => {
  for (const f of FILES) {
    it(`${f} contains no Gmail send path`, () => {
      const src = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
      expect(SEND.test(src)).toBe(false);
    });
  }
});
