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
export async function createGmailDraft(to: string[], bcc: string[], subject: string, body: string, cc: string[] = []) {
  const r = await fetch("/api/gmail/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, cc, bcc, subject, body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "draft failed");
  return j as { ok: true; draftId: string; to: string[]; cc: string[]; bcc: string[] };
}
export async function sendGmail(draftId: string, msg: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string }) {
  const r = await fetch("/api/gmail/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, ...msg }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "send failed");
  return j as { ok: true; sent: true; to: string[]; cc: string[]; bcc: string[] };
}

export async function fetchSentSearch(params: { to?: string; keyword?: string; pageToken?: string }): Promise<{ connected: boolean; messages: { id: string; subject: string; to: string; date: string; snippet: string }[]; nextPageToken?: string }> {
  const r = await fetch("/api/gmail/sent-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
  if (r.status === 409) return { connected: false, messages: [] };
  if (!r.ok) throw new Error("search failed");
  const j = await r.json();
  return { connected: true, messages: Array.isArray(j.messages) ? j.messages : [], nextPageToken: j.nextPageToken };
}

export async function fetchSentBodies(ids: string[]): Promise<{ connected: boolean; samples: { id: string; subject: string; date: string; body: string }[] }> {
  const r = await fetch("/api/gmail/sent-bodies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
  if (r.status === 409) return { connected: false, samples: [] };
  if (!r.ok) throw new Error("body fetch failed");
  const j = await r.json();
  return { connected: true, samples: Array.isArray(j.samples) ? j.samples : [] };
}
