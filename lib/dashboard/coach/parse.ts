export function parseList(text: string | null): string[] {
  if (!text) return [];
  let arr: unknown = null;
  try { const a = text.indexOf("["), b = text.lastIndexOf("]"); if (a >= 0 && b > a) arr = JSON.parse(text.slice(a, b + 1)); } catch {}
  if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
  return text.split("\n").map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter((l) => l && l.length < 140).slice(0, 8);
}

export interface ProposedGoal { horizon: string; title: string; laddersTo: string | null; }
function isWellShapedGoal(x: unknown): x is ProposedGoal {
  if (!x || typeof x !== "object") return false;
  const { title, horizon } = x as Record<string, unknown>;
  return typeof title === "string" && !!title.trim() && typeof horizon === "string";
}
export function parseGoalsBlock(text: string): { goals: ProposedGoal[]; text: string } {
  const m = text.match(/```goals\s*([\s\S]*?)```/i);
  let goals: ProposedGoal[] = [];
  if (m) {
    try { const arr = JSON.parse(m[1].trim()); if (Array.isArray(arr)) goals = arr.filter(isWellShapedGoal); } catch {}
    text = text.replace(/```goals[\s\S]*?```/i, "").trim();
  }
  return { goals, text: text || "Here are some goals to consider below." };
}

export interface SuggestedTask { goal?: string; label: string; pts?: number; }
function isWellShapedTask(x: unknown): x is SuggestedTask {
  if (!x || typeof x !== "object") return false;
  const { label } = x as Record<string, unknown>;
  return typeof label === "string" && !!label.trim();
}
export function parseSuggestedTasks(text: string | null): SuggestedTask[] {
  if (!text) return [];
  try {
    const a = text.indexOf("["), b = text.lastIndexOf("]");
    const arr = JSON.parse(text.slice(a, b + 1));
    return Array.isArray(arr) ? arr.filter(isWellShapedTask) : [];
  } catch { return []; }
}
