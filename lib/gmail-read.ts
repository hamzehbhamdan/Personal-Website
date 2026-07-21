// lib/gmail-read.ts
// SANCTIONED body-reader for voice distillation ONLY. This is the ONE file that reads Gmail message
// BODIES (format=full) — it reverses the metadata-only posture (lib/gmail.ts stays format=metadata)
// and is security-reviewed separately. Bodies read here are attacker-influenceable (a forwarded email)
// and are delimited before going to the model (buildDistillPrompt). Never persisted; never logged.
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailHeader { name?: string; value?: string; }
interface GmailMessagePart { mimeType?: string; body?: { data?: string }; parts?: GmailMessagePart[]; }
interface GmailListResponse { messages?: { id: string }[]; nextPageToken?: string; }

function header(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => (h.name || "").toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Decode Gmail base64url part data to UTF-8 text. */
export function decodeB64Url(data: string): string {
  try { return Buffer.from(String(data || ""), "base64url").toString("utf8"); } catch { return ""; }
}

/** Recursively return the first text/plain body from a Gmail message payload. */
export function extractPlainBody(payload: GmailMessagePart | null | undefined): string {
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
  // `[\s\S]+?` (any char incl. newlines) on the "On … wrote:" marker so it matches Gmail's wrapped
  // header, where the address and "wrote:" land on separate lines ("On <date> <name> <email>\nwrote:").
  // Using [\s\S] instead of the dotAll `s` flag keeps it valid under the repo's TS target.
  const markers = [/\nOn [\s\S]+?wrote:/, /\n>+/, /\n-{2,}\s*Original Message\s*-{2,}/i, /\nFrom: .+\nSent: /i];
  for (const m of markers) {
    const idx = s.search(m);
    if (idx > 0) s = s.slice(0, idx);
  }
  return s.trim().slice(0, cap);
}


/** SANCTIONED: list recent SENT messages via labelIds=SENT (same mechanism as the interaction sync —
 *  works under any Gmail read scope, incl. the older metadata scope), optionally narrowed to a
 *  recipient with `q` (a `to:…` term; that narrowing uses the Gmail search param, which requires the
 *  gmail.readonly scope). Returns header metadata + Gmail's short `snippet` (a body excerpt — hence
 *  this lives here, not in the metadata-only lib/gmail.ts). NO full body. `ok:false` means the Gmail
 *  list call itself failed (e.g. missing readonly scope for a recipient search), so the caller can
 *  prompt reconnect instead of showing a misleading "no results". Nothing logged beyond generic status. */
export async function gmailListSent(
  token: string,
  opts: { q?: string; pageToken?: string; max?: number },
): Promise<{ ok: boolean; messages: { id: string; subject: string; to: string; date: string; snippet: string }[]; nextPageToken?: string }> {
  try {
    const max = Math.min(Math.max(opts.max ?? 25, 1), 50);
    const u = new URL(`${API}/messages`);
    u.searchParams.append("labelIds", "SENT");
    u.searchParams.set("maxResults", String(max));
    if (opts.q) u.searchParams.set("q", opts.q);
    if (opts.pageToken) u.searchParams.set("pageToken", opts.pageToken);
    const list = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!list.ok) { console.warn("gmail-read: sent list failed", list.status); return { ok: false, messages: [] }; }
    const lj: GmailListResponse = await list.json();
    const ids: string[] = (lj.messages ?? []).map((m) => m.id);
    const rows = await Promise.all(ids.map(async (id) => {
      try {
        const g = await fetch(`${API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${token}` } });
        if (!g.ok) return null;
        const j = await g.json();
        const h = j.payload?.headers ?? [];
        return { id, subject: header(h, "Subject").slice(0, 300), to: header(h, "To").slice(0, 300), date: header(h, "Date").slice(0, 60), snippet: String(j.snippet || "").slice(0, 300) };
      } catch { console.warn("gmail-read: sent meta fetch failed"); return null; }
    }));
    return { ok: true, messages: rows.filter(Boolean) as { id: string; subject: string; to: string; date: string; snippet: string }[], nextPageToken: lj.nextPageToken };
  } catch { console.warn("gmail-read: sent list failed"); return { ok: false, messages: [] }; }
}

/** SANCTIONED: read the plaintext BODIES for the given selected SENT ids (voice distillation).
 *  Order preserved; failed ids skipped; bodies/recipients never logged. Hard cap 20. */
export async function gmailFetchBodies(token: string, ids: string[]): Promise<{ id: string; subject: string; date: string; body: string }[]> {
  try {
    const got = await Promise.all(ids.slice(0, 20).map(async (id) => {
      try {
        const g = await fetch(`${API}/messages/${id}?format=full`, { headers: { Authorization: `Bearer ${token}` } });
        if (!g.ok) return null;
        const j = await g.json();
        const body = cleanBody(extractPlainBody(j.payload));
        if (!body) return null;
        const h = j.payload?.headers ?? [];
        return { id, subject: header(h, "Subject").slice(0, 300), date: header(h, "Date").slice(0, 60), body };
      } catch { console.warn("gmail-read: body fetch failed"); return null; }
    }));
    return got.filter(Boolean) as { id: string; subject: string; date: string; body: string }[];
  } catch { console.warn("gmail-read: fetch bodies failed"); return []; }
}
