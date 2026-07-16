// lib/gmail-read.ts
// SANCTIONED body-reader for voice distillation ONLY. This is the ONE file that reads Gmail message
// BODIES (format=full) — it reverses the metadata-only posture (lib/gmail.ts stays format=metadata)
// and is security-reviewed separately. Bodies read here are attacker-influenceable (a forwarded email)
// and are delimited before going to the model (buildDistillPrompt). Never persisted; never logged.
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

function header(headers: any[], name: string): string {
  return headers?.find((h) => (h.name || "").toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Decode Gmail base64url part data to UTF-8 text. */
export function decodeB64Url(data: string): string {
  try { return Buffer.from(String(data || ""), "base64url").toString("utf8"); } catch { return ""; }
}

/** Recursively return the first text/plain body from a Gmail message payload. */
export function extractPlainBody(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return decodeB64Url(payload.body.data);
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      const t = extractPlainBody(p);
      if (t) return t;
    }
  }
  return "";
}

/** Trim quoted-reply history + cap length so distillation sees the user's own prose. */
export function cleanBody(raw: string, cap = 3000): string {
  let s = String(raw || "").replace(/\r\n/g, "\n");
  const markers = [/\n>+/, /\nOn .+ wrote:/, /\n-{2,}\s*Original Message\s*-{2,}/i, /\nFrom: .+\nSent: /i];
  for (const m of markers) {
    const idx = s.search(m);
    if (idx > 0) s = s.slice(0, idx);
  }
  return s.trim().slice(0, cap);
}

/** SANCTIONED: read the last n SENT messages' plaintext bodies (one-time voice distillation).
 *  Graceful on any failure (returns []); bodies/recipients never logged. */
export async function gmailRecentSent(token: string, n = 5): Promise<{ subject: string; date: string; body: string }[]> {
  try {
    const count = Math.min(Math.max(n, 1), 20);
    const u = new URL(`${API}/messages`);
    u.searchParams.append("labelIds", "SENT");
    u.searchParams.set("maxResults", String(count));
    const list = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!list.ok) { console.warn("gmail-read: list failed", list.status); return []; }
    const lj = await list.json();
    const ids: string[] = (lj.messages ?? []).slice(0, count).map((m: any) => m.id);
    const got = await Promise.all(ids.map(async (id) => {
      try {
        const g = await fetch(`${API}/messages/${id}?format=full`, { headers: { Authorization: `Bearer ${token}` } });
        if (!g.ok) return null;
        const j = await g.json();
        const body = cleanBody(extractPlainBody(j.payload));
        if (!body) return null;
        const h = j.payload?.headers ?? [];
        return { subject: header(h, "Subject").slice(0, 300), date: header(h, "Date").slice(0, 60), body };
      } catch (e) { console.warn("gmail-read: message fetch failed", e); return null; }
    }));
    return got.filter(Boolean) as { subject: string; date: string; body: string }[];
  } catch (e) { console.warn("gmail-read: recent-sent failed", e); return []; }
}
