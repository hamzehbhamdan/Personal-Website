import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Guards that the readonly scope broadening did NOT loosen lib/gmail.ts — it must stay metadata-only.
describe("lib/gmail.ts stays metadata-only", () => {
  it("uses format=metadata and never format=full/raw", () => {
    const src = readFileSync(new URL("../../lib/gmail.ts", import.meta.url), "utf8");
    expect(src).toContain("format=metadata");
    expect(/format=full|format=raw/.test(src)).toBe(false);
  });
});
