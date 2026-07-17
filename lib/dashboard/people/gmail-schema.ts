const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 200, MAX_SUBJECT = 500, MAX_BODY = 20_000;

export type SearchReq = { mailbox: "sent" | "inbox" };
export function parseSearchReq(body: unknown): { ok: true; value: SearchReq } | { ok: false; reason: string } {
  const b = body as any;
  if (b?.mailbox !== "sent" && b?.mailbox !== "inbox") return { ok: false, reason: "mailbox must be sent|inbox" };
  return { ok: true, value: { mailbox: b.mailbox } };
}

export type DraftReq = { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string };
function emails(v: unknown): string[] | null {
  if (v == null) return [];
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => String(x).trim().toLowerCase());
  if (out.some((e) => !EMAIL.test(e))) return null;
  return out;
}
export function parseDraftReq(body: unknown): { ok: true; value: DraftReq } | { ok: false; reason: string } {
  const b = body as any;
  const to = emails(b?.to), cc = emails(b?.cc), bcc = emails(b?.bcc);
  if (!to || !cc || !bcc) return { ok: false, reason: "invalid recipient email" };
  if (to.length < 1) return { ok: false, reason: "at least one 'to' recipient required" };
  if (to.length + cc.length + bcc.length > MAX_RECIPIENTS) return { ok: false, reason: "too many recipients" };
  const subject = String(b?.subject ?? ""), body_ = String(b?.body ?? "");
  if (/[\r\n]/.test(subject)) return { ok: false, reason: "subject must not contain newlines" };
  if (subject.length > MAX_SUBJECT) return { ok: false, reason: "subject too long" };
  if (body_.length === 0 || body_.length > MAX_BODY) return { ok: false, reason: "body size invalid" };
  return { ok: true, value: { to, cc, bcc, subject, body: body_ } };
}

const MAX_DRAFT_ID = 256;
export type SendReq = DraftReq & { draftId: string };
export function parseSendReq(body: unknown): { ok: true; value: SendReq } | { ok: false; reason: string } {
  const b = body as any;
  const draftId = typeof b?.draftId === "string" ? b.draftId.trim() : "";
  if (!draftId || draftId.length > MAX_DRAFT_ID) return { ok: false, reason: "invalid draftId" };
  const d = parseDraftReq(body);
  if (!d.ok) return d;
  return { ok: true, value: { ...d.value, draftId } };
}

const MAX_Q_FIELD = 120, MAX_IDS = 20, MAX_ID_LEN = 256;
const stripQ = (s: string) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

/** Gmail `q` for the sent-mail voice picker. Always scoped to in:sent; to/keyword sanitized + capped. */
export function buildSentQuery(f: { to?: string; keyword?: string }): string {
  const parts = ["in:sent"];
  const to = stripQ(f?.to ?? "").slice(0, MAX_Q_FIELD);
  const keyword = stripQ(f?.keyword ?? "").slice(0, MAX_Q_FIELD);
  if (to) parts.push(`to:${to}`);
  if (keyword) parts.push(keyword);
  return parts.join(" ");
}

export type SentSearchReq = { to: string; keyword: string; pageToken: string };
export function parseSentSearchReq(body: unknown): { ok: true; value: SentSearchReq } | { ok: false; reason: string } {
  if (body != null && typeof body !== "object") return { ok: false, reason: "invalid body" };
  const b = body as any;
  const to = typeof b?.to === "string" ? b.to.slice(0, MAX_Q_FIELD) : "";
  const keyword = typeof b?.keyword === "string" ? b.keyword.slice(0, MAX_Q_FIELD) : "";
  const pageToken = typeof b?.pageToken === "string" ? b.pageToken.slice(0, 4096) : "";
  return { ok: true, value: { to, keyword, pageToken } };
}

export type SentBodiesReq = { ids: string[] };
export function parseSentBodiesReq(body: unknown): { ok: true; value: SentBodiesReq } | { ok: false; reason: string } {
  const b = body as any;
  if (!Array.isArray(b?.ids)) return { ok: false, reason: "ids must be an array" };
  if (b.ids.length < 1) return { ok: false, reason: "at least one id required" };
  if (b.ids.length > MAX_IDS) return { ok: false, reason: "too many ids (max 20)" };
  const ids: string[] = b.ids.map((x: unknown) => String(x));
  if (ids.some((id) => !id || id.length > MAX_ID_LEN || /[\r\n]/.test(id))) return { ok: false, reason: "invalid id" };
  return { ok: true, value: { ids } };
}
