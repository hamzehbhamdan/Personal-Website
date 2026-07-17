import { describe, it, expect } from "vitest";
import { parseList, parseGoalsBlock, parseSuggestedTasks } from "../../lib/dashboard/coach/parse";

describe("parseList", () => {
  it("prefers a JSON array", () => expect(parseList('junk ["a","b"] tail')).toEqual(["a", "b"]));
  it("falls back to bullet lines", () => expect(parseList("- one\n2) two\n* three")).toEqual(["one", "two", "three"]));
  it("empty -> []", () => expect(parseList("")).toEqual([]));
});

describe("parseGoalsBlock", () => {
  it("extracts fenced ```goals JSON and strips it from prose", () => {
    const raw = 'Here you go:\n```goals\n[{"horizon":"year","title":"Y","laddersTo":null}]\n```\nDone.';
    const { goals, text } = parseGoalsBlock(raw);
    expect(goals).toEqual([{ horizon: "year", title: "Y", laddersTo: null }]);
    expect(text).not.toContain("```");
  });
  it("no block -> [] and original text", () => {
    const { goals, text } = parseGoalsBlock("just talking");
    expect(goals).toEqual([]); expect(text).toBe("just talking");
  });
});

describe("parseSuggestedTasks", () => {
  it("parses [{goal,label,pts}]", () => {
    const arr = parseSuggestedTasks('ok [{"goal":"G","label":"do","pts":3}] end');
    expect(arr).toEqual([{ goal: "G", label: "do", pts: 3 }]);
  });
  it("bad JSON -> []", () => expect(parseSuggestedTasks("nope")).toEqual([]));
});
