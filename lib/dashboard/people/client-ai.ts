// lib/dashboard/people/client-ai.ts
export async function askAi(task: string, prompt: string, system?: string): Promise<string> {
  const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, prompt, system }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "AI unavailable");
  return (await r.json()).text as string;
}
export async function createGmailDraft(to: string[], bcc: string[], subject: string, body: string) {
  const r = await fetch("/api/gmail/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, bcc, subject, body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "draft failed");
  return j as { ok: true; draftId: string; to: string[]; bcc: string[] };
}
