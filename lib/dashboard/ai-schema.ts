import { clampInt } from "@/lib/dashboard/brain/seed";

export const MODELS = ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001"] as const;
export const DEFAULT_MODEL = "claude-sonnet-5";
const TASKS = new Set(["draft_checkin", "group_update", "coach_chat", "suggest_tasks", "suggest_goals", "intake", "ask_people", "suggest_tags", "distill_voice", "plan_day"]);
export const MAX_PROMPT = 40_000;
export type AiRequest = { task: string; prompt: string; system?: string; model?: string };
export type ParseResult = { ok: true; value: AiRequest } | { ok: false; reason: string };

export function parseAiRequest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, reason: "bad body" };
  const b = body as Record<string, unknown>;
  if (typeof b.task !== "string" || !TASKS.has(b.task)) return { ok: false, reason: "unknown task" };
  if (typeof b.prompt !== "string" || b.prompt.length === 0) return { ok: false, reason: "missing prompt" };
  if (b.prompt.length > MAX_PROMPT) return { ok: false, reason: "prompt too large" };
  const system = typeof b.system === "string" ? b.system.slice(0, MAX_PROMPT) : undefined;
  const model = typeof b.model === "string" && (MODELS as readonly string[]).includes(b.model) ? b.model : undefined;
  return { ok: true, value: { task: b.task, prompt: b.prompt, system, model } };
}

// ── /api/chat ingress validation (report #14) ──
// Validates only what the CLIENT sends (BrainChatMsg in lib/dashboard/brain/types.ts
// is role: "user" | "assistant"). The chat route's internal tool loop appends its own
// system/assistant/tool messages AFTER this gate and is deliberately exempt.
export const MAX_CHAT_MESSAGES = 100; // client persists up to MAX_MSGS=80 (lib/dashboard/brain/seed.ts:4)

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatRequest = { messages: ChatMessage[]; retrievalCount: number; activeStoreId?: string };
export type ChatParseResult = { ok: true; value: ChatRequest } | { ok: false; reason: string };

export function parseChatRequest(body: unknown): ChatParseResult {
  if (!body || typeof body !== "object") return { ok: false, reason: "bad body" };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return { ok: false, reason: "missing messages" };
  if (b.messages.length > MAX_CHAT_MESSAGES) return { ok: false, reason: "too many messages" };

  const messages: ChatMessage[] = [];
  let totalChars = 0;
  for (const raw of b.messages) {
    if (!raw || typeof raw !== "object") return { ok: false, reason: "bad message" };
    const m = raw as Record<string, unknown>;
    const role = m.role;
    const content = m.content;
    if (role !== "user" && role !== "assistant") return { ok: false, reason: "bad role" };
    if (typeof content !== "string") return { ok: false, reason: "bad content" };
    totalChars += content.length;
    if (totalChars > MAX_PROMPT) return { ok: false, reason: "messages too large" };
    messages.push({ role, content });
  }

  const params = b.params && typeof b.params === "object" ? (b.params as Record<string, unknown>) : {};
  const retrievalCount = clampInt(params.retrievalCount, 1, 20, 5);
  const activeStoreId = typeof params.activeStoreId === "string" && params.activeStoreId.length > 0 ? params.activeStoreId : undefined;
  return { ok: true, value: { messages, retrievalCount, activeStoreId } };
}
