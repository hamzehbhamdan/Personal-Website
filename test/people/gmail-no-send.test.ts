// test/people/gmail-no-send.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Durability guard for the create-never-send invariant.
 *
 * The Gmail integration uses `gmail.compose` (required for drafts.create), which ALSO permits sending.
 * There is now exactly ONE sanctioned send path — `app/api/gmail/send/route.ts` + `lib/gmail-send.ts`
 * (deliberately NOT in FILES) — gated by auth + a low irreversible rate-limit + a client-side undo.
 * This test keeps the files below strictly send-free so an accidental send can never creep into the
 * draft / search / metadata paths; it fails CI if a send path is (re)introduced into any of them.
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
