import { describe, it, expect } from "vitest";
import { emptyBrain, normalizeBrain, trimBrain } from "@/lib/dashboard/brain/seed";
import { noteTitle } from "@/lib/dashboard/brain/types";
import type { BrainDoc, BrainChat } from "@/lib/dashboard/brain/types";

describe("emptyBrain", () => {
  it("has empty collections and sane defaults", () => {
    const d = emptyBrain();
    expect(d).toEqual({
      version: 1,
      captures: [],
      notes: [],
      chats: [],
      settings: { retrievalCount: 5, activeStoreId: null },
    });
  });
});

describe("normalizeBrain", () => {
  it("coerces garbage to an empty valid doc", () => {
    expect(normalizeBrain(null)).toEqual(emptyBrain());
    expect(normalizeBrain(42)).toEqual(emptyBrain());
    expect(normalizeBrain({ notes: "nope", chats: 5 })).toEqual(emptyBrain());
  });

  it("keeps valid notes and drops malformed ones", () => {
    const raw = {
      notes: [
        { id: "n1", text: "hello", tags: ["a", 1, "b"], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" },
        { id: "n2" }, // no text → dropped
        { text: "orphan" }, // no id → dropped
      ],
    };
    const d = normalizeBrain(raw);
    expect(d.notes).toHaveLength(1);
    expect(d.notes[0].id).toBe("n1");
    expect(d.notes[0].tags).toEqual(["a", "b"]); // non-strings filtered
    expect(d.notes[0].docId).toBeNull();
  });

  it("clamps retrievalCount into [1,20] and defaults to 5", () => {
    expect(normalizeBrain({ settings: { retrievalCount: 100 } }).settings.retrievalCount).toBe(20);
    expect(normalizeBrain({ settings: { retrievalCount: 0 } }).settings.retrievalCount).toBe(1);
    expect(normalizeBrain({ settings: { retrievalCount: "x" } }).settings.retrievalCount).toBe(5);
    expect(normalizeBrain({ settings: { retrievalCount: 8 } }).settings.retrievalCount).toBe(8);
  });

  it("only accepts a string activeStoreId", () => {
    expect(normalizeBrain({ settings: { activeStoreId: "vs_1" } }).settings.activeStoreId).toBe("vs_1");
    expect(normalizeBrain({ settings: { activeStoreId: 5 } }).settings.activeStoreId).toBeNull();
  });

  it("drops chat messages with bad roles", () => {
    const d = normalizeBrain({
      chats: [{ id: "c1", messages: [{ role: "user", content: "hi" }, { role: "system", content: "x" }, { role: "assistant", content: "yo" }] }],
    });
    expect(d.chats[0].messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "yo" },
    ]);
  });
});

describe("trimBrain", () => {
  const chat = (id: string, msgs: number, updatedAt: string, pinned = false): BrainChat => ({
    id,
    title: id,
    pinned,
    createdAt: updatedAt,
    updatedAt,
    messages: Array.from({ length: msgs }, (_, i) => ({ role: i % 2 === 0 ? ("user" as const) : ("assistant" as const), content: String(i) })),
  });

  it("caps messages per chat to the newest 80", () => {
    const d: BrainDoc = { ...emptyBrain(), chats: [chat("c", 200, "2026-01-01T00:00:00Z")] };
    const out = trimBrain(d);
    expect(out.chats[0].messages).toHaveLength(80);
    expect(out.chats[0].messages[79].content).toBe("199"); // kept the tail
  });

  it("caps chats to 50, keeping pinned + newest unpinned", () => {
    const chats: BrainChat[] = [];
    for (let i = 0; i < 60; i++) chats.push(chat(`c${i}`, 1, `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`));
    chats.push(chat("pinned", 1, "2020-01-01T00:00:00Z", true)); // old but pinned → must survive
    const out = trimBrain({ ...emptyBrain(), chats });
    expect(out.chats).toHaveLength(50);
    expect(out.chats.some((c) => c.id === "pinned")).toBe(true);
  });

  it("caps captures to the newest 200 (index 0 is newest — captures are prepended)", () => {
    // Build app-shaped: descending recency, index 0 = newest ("249").
    const captures = Array.from({ length: 250 }, (_, i) => ({
      id: `x${249 - i}`,
      text: String(249 - i),
      createdAt: "2026-01-01T00:00:00Z",
    }));
    const out = trimBrain({ ...emptyBrain(), captures });
    expect(out.captures).toHaveLength(200);
    expect(out.captures[0].text).toBe("249");    // newest survives
    expect(out.captures[199].text).toBe("50");   // oldest 50 dropped
  });
});

describe("noteTitle", () => {
  const base = { id: "n", text: "", tags: [], createdAt: "", updatedAt: "" };
  it("uses the title when present", () => {
    expect(noteTitle({ ...base, title: "My note", text: "body" })).toBe("My note");
  });
  it("falls back to the first non-empty line of text", () => {
    expect(noteTitle({ ...base, title: "", text: "\n  \nFirst real line\nsecond" })).toBe("First real line");
  });
  it("returns a placeholder when empty", () => {
    expect(noteTitle({ ...base, title: "", text: "   " })).toBe("Untitled note");
  });
});
