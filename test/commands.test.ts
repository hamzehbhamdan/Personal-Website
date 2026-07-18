import { describe, it, expect } from "vitest";
import { COMMANDS, filterCommands } from "@/lib/dashboard/commands";

describe("filterCommands", () => {
  it("returns all commands for an empty query", () => {
    expect(filterCommands(COMMANDS, "")).toHaveLength(COMMANDS.length);
    expect(filterCommands(COMMANDS, "   ")).toHaveLength(COMMANDS.length);
  });

  it("matches on label", () => {
    expect(filterCommands(COMMANDS, "people").some((c) => c.id === "nav-people")).toBe(true);
    expect(filterCommands(COMMANDS, "note").some((c) => c.id === "new-note")).toBe(true);
  });

  it("matches on keywords", () => {
    expect(filterCommands(COMMANDS, "schedule").some((c) => c.id === "plan-day")).toBe(true);
    expect(filterCommands(COMMANDS, "question").some((c) => c.id === "ask-ai")).toBe(true);
  });

  it("matches on category", () => {
    expect(filterCommands(COMMANDS, "navigate").length).toBeGreaterThanOrEqual(4);
  });

  it("returns nothing for a nonsense query", () => {
    expect(filterCommands(COMMANDS, "zzzzxqq")).toHaveLength(0);
  });
});
