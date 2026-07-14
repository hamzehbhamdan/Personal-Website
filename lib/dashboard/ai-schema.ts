const TASKS = new Set(["draft_checkin", "group_update", "coach_chat", "suggest_tasks", "suggest_goals", "intake", "ask_people", "suggest_tags"]);
export const MAX_PROMPT = 40_000;
export type AiRequest = { task: string; prompt: string; system?: string };
export type ParseResult = { ok: true; value: AiRequest } | { ok: false; reason: string };

export function parseAiRequest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, reason: "bad body" };
  const b = body as Record<string, unknown>;
  if (typeof b.task !== "string" || !TASKS.has(b.task)) return { ok: false, reason: "unknown task" };
  if (typeof b.prompt !== "string" || b.prompt.length === 0) return { ok: false, reason: "missing prompt" };
  if (b.prompt.length > MAX_PROMPT) return { ok: false, reason: "prompt too large" };
  const system = typeof b.system === "string" ? b.system.slice(0, MAX_PROMPT) : undefined;
  return { ok: true, value: { task: b.task, prompt: b.prompt, system } };
}
