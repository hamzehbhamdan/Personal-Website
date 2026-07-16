// lib/gmail.ts
import type { GmailHeaderRow } from "@/lib/dashboard/people/types";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";
// Multiple labelIds are ANDed by the Gmail API, so use a SINGLE label per mailbox.
// "INBOX" alone (NOT INBOX+CATEGORY_PERSONAL, which would require both labels and return
// nothing on accounts without category tabs, e.g. Workspace). Non-person senders are filtered
// downstream by isPerson. (Category exclusion isn't possible under gmail.metadata — q is forbidden.)
const LABELS: Record<"sent" | "inbox", string[]> = { sent: ["SENT"], inbox: ["INBOX"] };

function header(headers: any[], name: string): string {
  return headers?.find((h) => (h.name || "").toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Extract email addresses from a From/To header, robust to quoted display names containing commas
 *  (e.g. `"Smith, John" <john@corp.com>`). Prefers <addr> forms; falls back to bare email tokens. */
export function parseAddrs(v: string): string[] {
  const out: string[] = [];
  const bracket = /<([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = bracket.exec(v)) !== null) out.push(m[1].trim().toLowerCase());
  if (out.length) return [...new Set(out)];
  // No <addr> forms — keep only comma-separated tokens that look like a bare email address.
  return [...new Set(v.split(",").map((s) => s.trim().toLowerCase()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))];
}

/** Metadata-only search. Returns header rows (from/to/date/subject). NO bodies, NO snippets. */
export async function gmailSearch(token: string, mailbox: "sent" | "inbox"): Promise<GmailHeaderRow[]> {
  const cutoff = Date.now() - 365 * 864e5;
  const rows: GmailHeaderRow[] = [];
  let pageToken: string | undefined; let pages = 0;
  try {
    do {
      const u = new URL(`${API}/messages`);
      LABELS[mailbox].forEach((l) => u.searchParams.append("labelIds", l));
      u.searchParams.set("maxResults", "50");
      if (pageToken) u.searchParams.set("pageToken", pageToken);
      const list = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      if (!list.ok) { console.warn("gmail: list failed", list.status); break; }
      const lj = await list.json();
      const ids: string[] = (lj.messages ?? []).map((m: any) => m.id);
      const got = await Promise.all(ids.map(async (id) => {
        try {
          const g = await fetch(`${API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date&metadataHeaders=Subject`, { headers: { Authorization: `Bearer ${token}` } });
          if (!g.ok) return null;
          const j = await g.json(); const h = j.payload?.headers ?? [];
          const dateRaw = header(h, "Date");
          const parsed = dateRaw ? new Date(dateRaw) : null;
          if (!parsed || isNaN(parsed.getTime()) || parsed.getTime() < cutoff) return null;
          // subjects ONLY — j.snippet is deliberately ignored and never returned
          return { from: parseAddrs(header(h, "From"))[0] || "", to: parseAddrs(header(h, "To")), date: parsed.toISOString(), subject: header(h, "Subject"), mailbox } as GmailHeaderRow;
        } catch (e) { console.warn("gmail: message fetch failed", e); return null; }
      }));
      got.forEach((r) => { if (r) rows.push(r); });
      pageToken = lj.nextPageToken; pages++;
    } while (pageToken && pages < 2);
  } catch (e) { console.warn("gmail: search failed", e); }
  return rows;
}

/** CR/LF-strip + RFC-2047-encode a subject for safe placement in a MIME header. */
export function encodeSubject(s: string): string {
  const clean = String(s).replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7E]*$/.test(clean)) return clean;                 // pure ASCII → as-is
  return `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

/** Build a base64url RFC-2822 draft. Never sent — caller uses drafts.create only. */
export function buildDraftRaw(to: string[], bcc: string[], subject: string, body: string): string {
  const lines = [`To: ${to.join(", ")}`];
  if (bcc.length) lines.push(`Bcc: ${bcc.join(", ")}`);
  lines.push("Content-Type: text/plain; charset=UTF-8", `Subject: ${encodeSubject(subject)}`, "", body);
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

export async function gmailCreateDraft(token: string, raw: string): Promise<{ id: string } | null> {
  try {
    const r = await fetch(`${API}/drafts`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { raw } }) });
    if (!r.ok) { console.warn("gmail: draft create failed", r.status); return null; }
    const j = await r.json(); return { id: j.id };
  } catch (e) { console.warn("gmail: draft create failed", e); return null; }
}
