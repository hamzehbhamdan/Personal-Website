// lib/dashboard/people/client-ai.ts
export async function askAi(task: string, prompt: string, opts?: { system?: string; model?: string }): Promise<string> {
  const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, prompt, system: opts?.system, model: opts?.model }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "AI unavailable");
  return (await r.json()).text as string;
}
/** Fetch a handful of the user's own recent sent-email bodies for the one-time "learn my voice"
 * distill flow. Bodies are read once client-side into memory and forwarded to /api/ai for
 * distillation by the caller — never persisted here or by this fetcher. */
export async function fetchSentSamples(): Promise<{ connected: boolean; samples: { subject: string; date: string; body: string }[] }> {
  const r = await fetch("/api/gmail/sent-samples", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const j = await r.json().catch(() => ({ connected: false, samples: [] }));
  return { connected: !!j.connected, samples: Array.isArray(j.samples) ? j.samples : [] };
}
export async function createGmailDraft(to: string[], bcc: string[], subject: string, body: string) {
  const r = await fetch("/api/gmail/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, bcc, subject, body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "draft failed");
  return j as { ok: true; draftId: string; to: string[]; bcc: string[] };
}
