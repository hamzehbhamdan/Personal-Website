# Voice Sample Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed "learn my voice from the last 5 sent emails" with a wizard that filters sent mail by recipient + keyword, hand-picks up to 20 specific messages, then distills them — plus a "Reconnect Google" affordance.

**Architecture:** A dedicated `LearnVoiceModal` drives a filter → browse → select → distill → approve flow. Browsing hits a new metadata+snippet search route (`/api/gmail/sent-search`); only the explicitly-selected ids get full bodies read (`/api/gmail/sent-bodies`). All body-derived reads (snippet + full body) live in the sanctioned `lib/gmail-read.ts`; `lib/gmail.ts` stays strictly metadata/header-only. Pure logic (query builder, request validators, contact autocomplete) is unit-tested first.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest (TZ=UTC), Tailwind v4, `@anthropic-ai/sdk` (via existing `/api/ai`), Gmail REST (readonly + compose scopes already in place).

## Global Constraints

- **Security — sanctioned reader boundary:** any function returning message body-derived content (Gmail `snippet` OR full body) lives ONLY in `lib/gmail-read.ts`. `lib/gmail.ts` stays `format=metadata`, snippet-free; its guard test must stay green.
- **Bodies:** full message bodies are read only for explicitly-selected ids (≤20), sent to Claude once at distill time, delimited via `DELIM`/`stripTagChars` (already in `buildDistillPrompt`), and NEVER persisted. Approve persists only `styleSummary` + selected `{subject, date}`.
- **Snippets:** display-only — shown to the owner, never persisted, never sent to Claude.
- **Every new route:** `requireUser(req)` (auth + single-user allow-list + same-origin/CSRF) → `allow(key, limit, windowMs)` rate-limit → request validation, before any Gmail call. Never log recipients/bodies/snippets.
- **State writes:** use `setState((prev) => { const d = normalizeDb(prev); return { ...d, /* derived from d */ }; })` — never derive a write from a captured `db` prop.
- **Render safety:** no `dangerouslySetInnerHTML`; snippets/subjects render as plain JSX text.
- **Design system:** Playfair serif headings, Geist-Mono 10px uppercase labels (`var(--font-geist-mono)`), crimson `#A51C30`, stone hairlines. No new colors/fonts.
- **No new Google scope:** uses the `gmail.readonly` scope already added in sub-project C.
- **Model allowlist:** distillation goes through the existing `askAi("distill_voice", …)` (server-side model allowlist unchanged).

---

### Task 1: Sent-mail query builder + request validators (+ raise sample cap to 20)

**Files:**
- Modify: `lib/dashboard/people/gmail-schema.ts` (append new exports)
- Modify: `lib/dashboard/people/backup.ts` (`normalizeVoice`: sentSamples cap 10 → 20)
- Test: `test/people/gmail-schema.test.ts` (extend), `test/people/backup.test.ts` (update cap assertion)

**Interfaces:**
- Produces: `buildSentQuery({ to?: string; keyword?: string }): string`; `parseSentSearchReq(body): { ok:true; value:{ to:string; keyword:string; pageToken:string } } | { ok:false; reason:string }`; `parseSentBodiesReq(body): { ok:true; value:{ ids:string[] } } | { ok:false; reason:string }`.

- [ ] **Step 1: Write failing tests** — append to `test/people/gmail-schema.test.ts`:

```ts
import { buildSentQuery, parseSentSearchReq, parseSentBodiesReq } from "@/lib/dashboard/people/gmail-schema";

describe("buildSentQuery", () => {
  it("always scopes to in:sent", () => {
    expect(buildSentQuery({})).toBe("in:sent");
  });
  it("adds to: and keyword when present, strips newlines + caps length", () => {
    expect(buildSentQuery({ to: "alex@acme.com", keyword: "intro" })).toBe("in:sent to:alex@acme.com intro");
    expect(buildSentQuery({ keyword: "a\nb" })).toBe("in:sent a b");
    expect(buildSentQuery({ to: "x".repeat(300) }).length).toBeLessThan(140);
  });
});

describe("parseSentSearchReq", () => {
  it("accepts optional fields and defaults to empty strings", () => {
    const r = parseSentSearchReq({ to: "a@b.com" });
    expect(r.ok && r.value).toEqual({ to: "a@b.com", keyword: "", pageToken: "" });
  });
  it("coerces non-strings to empty + caps", () => {
    const r = parseSentSearchReq({ to: 5, keyword: "k".repeat(500) });
    expect(r.ok && r.value.to).toBe("");
    expect(r.ok && r.value.keyword.length).toBe(120);
  });
  it("rejects a non-object body", () => {
    expect(parseSentSearchReq("nope").ok).toBe(false);
  });
});

describe("parseSentBodiesReq", () => {
  it("accepts 1..20 string ids", () => {
    const r = parseSentBodiesReq({ ids: ["a", "b"] });
    expect(r.ok && r.value.ids).toEqual(["a", "b"]);
  });
  it("rejects empty, >20, non-array, or newline ids", () => {
    expect(parseSentBodiesReq({ ids: [] }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: Array(21).fill("x") }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: "x" }).ok).toBe(false);
    expect(parseSentBodiesReq({ ids: ["a\nb"] }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TZ=UTC npx vitest run test/people/gmail-schema.test.ts`
Expected: FAIL — `buildSentQuery is not a function`.

- [ ] **Step 3: Append the implementation** to `lib/dashboard/people/gmail-schema.ts`:

```ts
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
  const ids = b.ids.map((x: unknown) => String(x));
  if (ids.some((id) => !id || id.length > MAX_ID_LEN || /[\r\n]/.test(id))) return { ok: false, reason: "invalid id" };
  return { ok: true, value: { ids } };
}
```

- [ ] **Step 4: Raise the sentSamples cap 10 → 20** in `lib/dashboard/people/backup.ts` `normalizeVoice` — change the `slice(0, 10)` on the `sentSamples` line to `slice(0, 20)`:

```ts
    const ss = v.sentSamples.filter((s: any) => s && typeof s === "object").slice(0, 20).map((s: any) => ({ subject: String(s.subject ?? "").slice(0, 300), date: String(s.date ?? "").slice(0, 40) }));
```

- [ ] **Step 5: Update the cap assertion** in `test/people/backup.test.ts` — the test that feeds `sentSamples: Array(50).fill(...)` asserts `.length` is 10; change it to 20:

```ts
    expect(v.sentSamples!.length).toBe(20);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `TZ=UTC npx vitest run test/people/gmail-schema.test.ts test/people/backup.test.ts`
Expected: PASS (all).

- [ ] **Step 7: Commit**

```bash
git add lib/dashboard/people/gmail-schema.ts lib/dashboard/people/backup.ts test/people/gmail-schema.test.ts test/people/backup.test.ts
git commit -m "feat(people): sent-mail query builder + search/bodies validators; sentSamples cap 20 (tested)"
```

---

### Task 2: `matchContacts` autocomplete selector

**Files:**
- Modify: `lib/dashboard/people/select.ts` (append)
- Test: `test/people/select.test.ts` (extend)

**Interfaces:**
- Consumes: `lc` (from `./text`), `contactEmails` (from `./interactions`) — already imported in `select.ts`.
- Produces: `matchContacts(db: CrmDB, query: string, limit = 6): { name: string; email: string }[]`.

- [ ] **Step 1: Write failing tests** — append to `test/people/select.test.ts` (reuse the file's existing db fixture pattern; contacts need `name` + `emails`):

```ts
import { matchContacts } from "@/lib/dashboard/people/select";

describe("matchContacts", () => {
  const db: any = { contacts: [
    { id: "1", name: "Alex Rivera", emails: ["alex@acme.com"], tier: "1" },
    { id: "2", name: "Alexa Stone", emails: ["astone@x.com"], tier: "1" },
    { id: "3", name: "Bob Lin", emails: ["bob@x.com"], tier: "1" },
    { id: "4", name: "No Email", emails: [], tier: "1" },
  ], groups: [] };
  it("returns [] for an empty query", () => {
    expect(matchContacts(db, "  ")).toEqual([]);
  });
  it("matches on name or email substring, prefix-first, skips contacts with no email", () => {
    const r = matchContacts(db, "alex");
    expect(r.map((x) => x.email)).toEqual(["alex@acme.com", "astone@x.com"]); // both start with "alex"
    expect(r.some((x) => x.name === "No Email")).toBe(false);
  });
  it("matches by email fragment and respects the limit", () => {
    expect(matchContacts(db, "acme").map((x) => x.email)).toEqual(["alex@acme.com"]);
    expect(matchContacts(db, "x.com", 1).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TZ=UTC npx vitest run test/people/select.test.ts`
Expected: FAIL — `matchContacts is not a function`.

- [ ] **Step 3: Append the implementation** to `lib/dashboard/people/select.ts`:

```ts
/** Rank CRM contacts whose name or primary email matches `query` (case-insensitive substring).
 *  Prefix matches rank above interior matches; empty query → []. Contacts without an email are skipped. */
export function matchContacts(db: CrmDB, query: string, limit = 6): { name: string; email: string }[] {
  const q = lc(String(query || "").trim());
  if (!q) return [];
  const scored: { name: string; email: string; score: number }[] = [];
  for (const c of db.contacts) {
    const email = contactEmails(c)[0] || "";
    if (!email) continue;
    const name = c.name || "";
    const nl = lc(name), el = lc(email);
    let score = -1;
    if (nl.startsWith(q) || el.startsWith(q)) score = 0;
    else if (nl.includes(q) || el.includes(q)) score = 1;
    if (score >= 0) scored.push({ name, email, score });
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map(({ name, email }) => ({ name, email }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `TZ=UTC npx vitest run test/people/select.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard/people/select.ts test/people/select.test.ts
git commit -m "feat(people): matchContacts autocomplete selector (tested)"
```

---

### Task 3: Sanctioned sent-mail reader (`gmailSearchSent` + `gmailFetchBodies`)

**Files:**
- Modify: `lib/gmail-read.ts` (add two exports; keep `gmailRecentSent` for now — removed in Task 7)
- Test: `test/people/gmail-metadata-guard.test.ts` (add a cross-file guard)

**Interfaces:**
- Consumes: existing `header`, `extractPlainBody`, `cleanBody`, `API` (module-local in `gmail-read.ts`).
- Produces:
  - `gmailSearchSent(token: string, opts: { q: string; pageToken?: string; max?: number }): Promise<{ messages: { id: string; subject: string; to: string; date: string; snippet: string }[]; nextPageToken?: string }>`
  - `gmailFetchBodies(token: string, ids: string[]): Promise<{ id: string; subject: string; date: string; body: string }[]>`

- [ ] **Step 1: Add the two functions** to `lib/gmail-read.ts` (append after `gmailRecentSent`):

```ts
/** SANCTIONED: search SENT messages, returning header metadata + Gmail's short `snippet` (a body
 *  excerpt — hence this lives here, not in the metadata-only lib/gmail.ts) for browsing. NO full body.
 *  Graceful on failure ([]); nothing logged beyond generic status. */
export async function gmailSearchSent(
  token: string,
  opts: { q: string; pageToken?: string; max?: number },
): Promise<{ messages: { id: string; subject: string; to: string; date: string; snippet: string }[]; nextPageToken?: string }> {
  try {
    const max = Math.min(Math.max(opts.max ?? 25, 1), 50);
    const u = new URL(`${API}/messages`);
    u.searchParams.set("q", opts.q);
    u.searchParams.set("maxResults", String(max));
    if (opts.pageToken) u.searchParams.set("pageToken", opts.pageToken);
    const list = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!list.ok) { console.warn("gmail-read: search list failed", list.status); return { messages: [] }; }
    const lj = await list.json();
    const ids: string[] = (lj.messages ?? []).map((m: any) => m.id);
    const rows = await Promise.all(ids.map(async (id) => {
      try {
        const g = await fetch(`${API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${token}` } });
        if (!g.ok) return null;
        const j = await g.json();
        const h = j.payload?.headers ?? [];
        return { id, subject: header(h, "Subject").slice(0, 300), to: header(h, "To").slice(0, 300), date: header(h, "Date").slice(0, 60), snippet: String(j.snippet || "").slice(0, 300) };
      } catch { console.warn("gmail-read: search meta fetch failed"); return null; }
    }));
    return { messages: rows.filter(Boolean) as { id: string; subject: string; to: string; date: string; snippet: string }[], nextPageToken: lj.nextPageToken };
  } catch { console.warn("gmail-read: search failed"); return { messages: [] }; }
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
```

- [ ] **Step 2: Add a cross-file guard test** to `test/people/gmail-metadata-guard.test.ts` (inside the existing `describe`):

```ts
  it("full-body reads (format=full) live ONLY in the sanctioned lib/gmail-read.ts", () => {
    const gmailSrc = readFileSync(new URL("../../lib/gmail.ts", import.meta.url), "utf8");
    expect(/format=full/.test(gmailSrc)).toBe(false);
    const readSrc = readFileSync(new URL("../../lib/gmail-read.ts", import.meta.url), "utf8");
    expect(readSrc.includes("format=full")).toBe(true);
  });
```

- [ ] **Step 3: Run the guard + existing reader tests**

Run: `TZ=UTC npx vitest run test/people/gmail-metadata-guard.test.ts test/people/gmail-read.test.ts`
Expected: PASS. (The network functions themselves are verified live in Phase 5, consistent with how `gmailRecentSent`/`gmailSearch` are treated — no fetch-mock unit tests in this codebase.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/gmail-read.ts test/people/gmail-metadata-guard.test.ts
git commit -m "feat(gmail-read): sanctioned gmailSearchSent (headers+snippet) + gmailFetchBodies (selected)"
```

---

### Task 4: Search + bodies routes and client fetchers

**Files:**
- Create: `app/api/gmail/sent-search/route.ts`, `app/api/gmail/sent-bodies/route.ts`
- Modify: `lib/dashboard/people/client-ai.ts` (add two fetchers; keep `fetchSentSamples` for now — removed in Task 7)

**Interfaces:**
- Consumes: `requireUser`, `allow`, `getGoogleAccessToken`, `gmailSearchSent`, `gmailFetchBodies`, `buildSentQuery`, `parseSentSearchReq`, `parseSentBodiesReq`.
- Produces:
  - `fetchSentSearch(params: { to?: string; keyword?: string; pageToken?: string }): Promise<{ connected: boolean; messages: { id: string; subject: string; to: string; date: string; snippet: string }[]; nextPageToken?: string }>`
  - `fetchSentBodies(ids: string[]): Promise<{ connected: boolean; samples: { id: string; subject: string; date: string; body: string }[] }>`

- [ ] **Step 1: Create `app/api/gmail/sent-search/route.ts`:**

```ts
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailSearchSent } from "@/lib/gmail-read";
import { parseSentSearchReq, buildSentQuery } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Browse SENT mail by recipient/keyword — returns headers + Gmail snippet (display-only), no full body.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-search`, 15, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSentSearchReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, messages: [] }, { status: 409 });
  const q = buildSentQuery({ to: parsed.value.to, keyword: parsed.value.keyword });
  const r = await gmailSearchSent(token, { q, pageToken: parsed.value.pageToken || undefined });
  return Response.json({ connected: true, ...r });
}
```

- [ ] **Step 2: Create `app/api/gmail/sent-bodies/route.ts`:**

```ts
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailFetchBodies } from "@/lib/gmail-read";
import { parseSentBodiesReq } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read FULL bodies for the explicitly-selected SENT ids (≤20) for one-time voice distillation.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-bodies`, 5, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSentBodiesReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, samples: [] }, { status: 409 });
  const samples = await gmailFetchBodies(token, parsed.value.ids);
  return Response.json({ connected: true, samples });
}
```

- [ ] **Step 3: Add the two client fetchers** to `lib/dashboard/people/client-ai.ts` (append; do NOT remove `fetchSentSamples` yet). Both distinguish 409 (reconnect) from other failures (throw → caller shows "try again"):

```ts
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
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean. (Both new routes compile; `sent-samples` still present and working.)

- [ ] **Step 5: Commit**

```bash
git add app/api/gmail/sent-search/route.ts app/api/gmail/sent-bodies/route.ts lib/dashboard/people/client-ai.ts
git commit -m "feat(api): /api/gmail/sent-search (metadata+snippet) + /api/gmail/sent-bodies (selected) + client fetchers"
```

---

### Task 5: `RecipientAutocomplete` component

**Files:**
- Create: `components/dashboard/people/RecipientAutocomplete.tsx`

**Interfaces:**
- Consumes: `matchContacts` (Task 2), `cn` (from `@/lib/utils`), `CrmDB` type.
- Produces: `RecipientAutocomplete({ db, value, onChange, placeholder }: { db: CrmDB; value: string; onChange: (v: string) => void; placeholder?: string })`.

- [ ] **Step 1: Create the component:**

```tsx
"use client";
import { useState } from "react";
import { matchContacts } from "@/lib/dashboard/people/select";
import { cn } from "@/lib/utils";
import type { CrmDB } from "@/lib/dashboard/people/types";

const inputCls = "w-full rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

/**
 * Recipient input with CRM-contact autocomplete. Tab/Enter completes to the highlighted suggestion;
 * ArrowUp/Down move the highlight. Escape is intentionally NOT handled here so it closes the modal.
 */
export function RecipientAutocomplete({ db, value, onChange, placeholder }: {
  db: CrmDB; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const suggestions = open ? matchContacts(db, value, 6) : [];
  const pick = (email: string) => { onChange(email); setOpen(false); setHi(0); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Tab" || e.key === "Enter") {
      const s = suggestions[hi] || suggestions[0];
      if (s) { e.preventDefault(); pick(s.email); }
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputCls}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <li key={s.email}>
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s.email); }}
                className={cn("flex w-full items-baseline justify-between gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-[#f9f8f6]", i === hi && "bg-[#f9f8f6]")}>
                <span className="font-medium text-stone-800">{s.name}</span>
                <span className="shrink-0 text-[11px] text-stone-400">{s.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/people/RecipientAutocomplete.tsx
git commit -m "feat(people): RecipientAutocomplete — CRM contact autocomplete (Tab to complete)"
```

---

### Task 6: `LearnVoiceModal` wizard

**Files:**
- Create: `components/dashboard/people/LearnVoiceModal.tsx`

**Interfaces:**
- Consumes: `Modal` (`@/components/dashboard/ui`), `RecipientAutocomplete` (Task 5), `fetchSentSearch`/`fetchSentBodies` + `askAi` (`client-ai`), `buildDistillPrompt` (`ai-prompts`), `normalizeDb` (`backup`), `CrmDB` type.
- Produces: `LearnVoiceModal({ db, setState, onClose }: { db: CrmDB; setState: (u: (prev: CrmDB) => CrmDB) => void; onClose: () => void })`.

Behavior contract:
- One scrollable `Modal` titled "Learn my voice from sent mail". In-memory-only state: `to`, `keyword`, `results: SentRow[]`, `nextPageToken?`, `selected: Set<string>`, `busy`, `notConnected: boolean`, `msg: string|null`, `summary: string`.
- **Filter row:** a `RecipientAutocomplete` (Recipient), a keyword `<input>`, and a **Search** button → `fetchSentSearch({ to, keyword })`. On `connected:false` set `notConnected=true`. On success replace `results`, set `nextPageToken`, clear `selected`.
- **Reconnect state:** when `notConnected`, render an emphasized **"Reconnect Google"** anchor `href="/api/google/connect"` (crimson primary) with a one-line explanation; hide the list.
- **Browse list:** each row shows `subject` (bold), `to · date` (muted), and `snippet` (plain text), with a checkbox. Checking is disabled once `selected.size >= 20` for unchecked rows. A live counter "**{selected.size} / 20 selected**". A **Load more** button when `nextPageToken` is set → `fetchSentSearch({ to, keyword, pageToken })`, appending to `results` and updating `nextPageToken`.
- **Distill** button (enabled when `1..20` selected and not busy) → `fetchSentBodies([...selected])` → if `connected:false` set `notConnected`; else `askAi("distill_voice", buildDistillPrompt(samples))` → set `summary`.
- **Summary + approve:** editable `<textarea>` bound to `summary`; **Approve & save** persists via the state convention, then `onClose()`:

```tsx
setState((prev) => {
  const d = normalizeDb(prev);
  const selectedRows = results.filter((r) => selected.has(r.id));
  const voice = {
    ...(d.settings.voice ?? {}),
    styleSummary: summary.trim(),
    sentSamples: selectedRows.map((r) => ({ subject: r.subject, date: r.date })),
  };
  return { ...d, settings: { ...d.settings, voice } };
});
```
Raw bodies from `fetchSentBodies` are used only to build the distill prompt and are never stored in state or persisted; closing the modal discards everything.

- [ ] **Step 1: Create the component** (`components/dashboard/people/LearnVoiceModal.tsx`):

```tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { RecipientAutocomplete } from "./RecipientAutocomplete";
import { fetchSentSearch, fetchSentBodies, askAi } from "@/lib/dashboard/people/client-ai";
import { buildDistillPrompt } from "@/lib/dashboard/people/ai-prompts";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import type { CrmDB } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const inputCls = "w-full rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";
const labelCls = "font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400";
const MAX = 20;

type Row = { id: string; subject: string; to: string; date: string; snippet: string };

export function LearnVoiceModal({ db, setState, onClose }: { db: CrmDB; setState: (u: (prev: CrmDB) => CrmDB) => void; onClose: () => void }) {
  const [to, setTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState("");

  const search = async (append = false) => {
    setBusy(true); setMsg(null); setNotConnected(false);
    try {
      const r = await fetchSentSearch({ to, keyword, pageToken: append ? pageToken : undefined });
      if (!r.connected) { setNotConnected(true); return; }
      setResults((prev) => (append ? [...prev, ...r.messages] : r.messages));
      setPageToken(r.nextPageToken);
      if (!append) { setSelected(new Set()); if (!r.messages.length) setMsg("No sent emails match that filter."); }
    } catch { setMsg("Something went wrong — try again in a moment."); }
    finally { setBusy(false); }
  };

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX) next.add(id);
    return next;
  });

  const distill = async () => {
    setBusy(true); setMsg(null); setNotConnected(false);
    try {
      const r = await fetchSentBodies([...selected]);
      if (!r.connected) { setNotConnected(true); return; }
      if (!r.samples.length) { setMsg("Couldn't read those emails — try different ones."); return; }
      setSummary((await askAi("distill_voice", buildDistillPrompt(r.samples))).trim());
    } catch { setMsg("Something went wrong — try again in a moment."); }
    finally { setBusy(false); }
  };

  const approve = () => {
    setState((prev) => {
      const d = normalizeDb(prev);
      const rows = results.filter((r) => selected.has(r.id));
      const voice = { ...(d.settings.voice ?? {}), styleSummary: summary.trim(), sentSamples: rows.map((r) => ({ subject: r.subject, date: r.date })) };
      return { ...d, settings: { ...d.settings, voice } };
    });
    onClose();
  };

  return (
    <Modal title="Learn my voice from sent mail" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-stone-500">
          Filter your sent mail, pick up to {MAX} emails, and I&apos;ll distill your writing voice from them. The text of the emails you pick goes to Claude only for this step and is never stored — only the resulting summary is kept.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1"><label className={labelCls}>Recipient</label>
            <RecipientAutocomplete db={db} value={to} onChange={setTo} placeholder="name or email (Tab to complete)" />
          </div>
          <div className="flex-1"><label className={labelCls}>Keyword / subject</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="optional" className={inputCls} />
          </div>
          <button type="button" onClick={() => search(false)} disabled={busy} className={btnPrimary} style={mono}>{busy ? "…" : "Search"}</button>
        </div>

        {notConnected ? (
          <div className="rounded-[8px] border border-[#A51C30]/40 bg-[#f9f8f6] p-3 text-[12px] text-stone-600">
            <div className="mb-2">Reading your sent mail needs the newer Google permission. Reconnect to grant it, then search again.</div>
            <a href="/api/google/connect" className={btnPrimary} style={mono}>Reconnect Google</a>
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-stone-500">Pick the emails to learn from:</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={mono}>{selected.size} / {MAX} selected</span>
                </div>
                <ul className="flex max-h-[46vh] flex-col gap-1.5 overflow-auto">
                  {results.map((r) => {
                    const on = selected.has(r.id);
                    const disabled = !on && selected.size >= MAX;
                    return (
                      <li key={r.id}>
                        <label className={`flex cursor-pointer gap-2.5 rounded-[8px] border p-2.5 ${on ? "border-[#A51C30]/50 bg-[#f9f8f6]" : "border-stone-200"} ${disabled ? "opacity-40" : ""}`}>
                          <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(r.id)} className="mt-1 accent-[#A51C30]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-[13px] font-medium text-stone-800">{r.subject || "(no subject)"}</span>
                              <span className="shrink-0 text-[11px] text-stone-400">{r.date}</span>
                            </div>
                            <div className="truncate text-[11.5px] text-stone-500">{r.to}</div>
                            <div className="mt-0.5 line-clamp-2 text-[11.5px] text-stone-500">{r.snippet}</div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {pageToken && (
                  <button type="button" onClick={() => search(true)} disabled={busy} className={btnGhost} style={mono}>Load more</button>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2.5">
                  <button type="button" onClick={distill} disabled={busy || selected.size < 1} className={btnPrimary} style={mono}>{busy ? "Distilling…" : `Distill ${selected.size || ""}`.trim()}</button>
                </div>
              </>
            )}
          </>
        )}

        {summary && (
          <div className="border-t border-stone-100 pt-2.5">
            <label className={labelCls}>Learned voice summary <span className="normal-case tracking-normal text-stone-400">(editable)</span></label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} className={`${inputCls} min-h-[120px]`} />
            <div className="mt-2.5"><button type="button" onClick={approve} disabled={busy} className={btnPrimary} style={mono}>Approve &amp; save</button></div>
          </div>
        )}

        {msg && <div className="text-[11.5px] text-stone-500">{msg}</div>}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/people/LearnVoiceModal.tsx
git commit -m "feat(people): LearnVoiceModal — filter/browse/pick sent mail + distill + approve"
```

---

### Task 7: Rewire settings, add Reconnect link, retire the old fixed flow

**Files:**
- Modify: `components/dashboard/people/CrmSettingsModal.tsx` (open the modal; keep Clear + saved status; drop the inline fetch/list/distill + `fetchSentSamples` usage)
- Modify: `components/dashboard/people/PeopleView.tsx` (subtle "Reconnect Google" link in the Google-status row)
- Delete: `app/api/gmail/sent-samples/route.ts`
- Modify: `lib/gmail-read.ts` (remove `gmailRecentSent`), `lib/dashboard/people/client-ai.ts` (remove `fetchSentSamples`)

**Interfaces:**
- Consumes: `LearnVoiceModal` (Task 6).

- [ ] **Step 1: Rewire `CrmSettingsModal.tsx` "Your voice" learn section.** Replace the inline learn-from-sent-mail block (the `learnFetch`/`vSamples` list/`learnDistill`/`vSummary`/`learnApprove` UI and their state + the `fetchSentSamples` import) with a button that opens `LearnVoiceModal`. Keep `learnClear` + the "A learned voice is currently saved…" status line. Concretely:
  - Add `import { LearnVoiceModal } from "./LearnVoiceModal";` and `const [showLearn, setShowLearn] = useState(false);`.
  - Remove the `fetchSentSamples` import and the now-unused voice-learn state (`vSamples`, `vSummary`, `vBusy`, `vMsg`) and functions (`learnFetch`, `learnDistill`, `learnApprove`) — but KEEP `learnClear` and the `db.settings.voice?.styleSummary` status display.
  - The learn section becomes:

```tsx
<div className="mt-4 border-t border-stone-100 pt-3">
  <label className={labelCls}>Learn my voice from sent mail</label>
  <div className={noteCls}>Filter and hand-pick specific sent emails to learn your tone. The text of the emails you pick goes to Claude only for that step and is not stored — only the summary is kept.</div>
  {db.settings.voice?.styleSummary && (
    <div className="mt-2 text-[11.5px] text-stone-500">A learned voice is currently saved and woven into drafts.</div>
  )}
  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
    <button type="button" onClick={() => setShowLearn(true)} className={btnAlt} style={mono}>Learn my voice from sent mail…</button>
    {db.settings.voice?.styleSummary && (
      <button type="button" onClick={learnClear} className={btnGhost} style={mono}>Clear learned voice</button>
    )}
  </div>
</div>
```
  - Render the modal near the other nested modal (e.g. next to `showTiers`): `{showLearn && <LearnVoiceModal db={db} setState={setState} onClose={() => setShowLearn(false)} />}`. (Nesting under the settings Modal is fine — Escape is topmost-only.)

- [ ] **Step 2: Add the Reconnect link to `PeopleView.tsx`.** In the Google-status area (near the `googleStatus === "connected"` message / the existing connect banner), add a subtle always-available reconnect link, e.g. immediately after the connect banner block:

```tsx
{live.connected && (
  <a href="/api/google/connect" className="mb-4 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 underline decoration-stone-300 underline-offset-2 hover:text-[#A51C30]" style={mono}>
    Reconnect Google
  </a>
)}
```

- [ ] **Step 3: Delete the retired route + functions.**
  - `git rm app/api/gmail/sent-samples/route.ts`
  - Remove `gmailRecentSent` from `lib/gmail-read.ts`.
  - Remove `fetchSentSamples` from `lib/dashboard/people/client-ai.ts`.

- [ ] **Step 4: Verify nothing else references the retired symbols**

Run: `grep -rn "fetchSentSamples\|gmailRecentSent\|sent-samples" app components lib test`
Expected: NO matches. (If any remain, fix them.)

- [ ] **Step 5: Typecheck + build + full suite**

Run: `npx tsc --noEmit && npm run build && TZ=UTC npx vitest run`
Expected: tsc clean, build clean, all tests pass (`gmail-metadata-guard` still green — `format=full` only in `gmail-read.ts`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(people): open LearnVoiceModal from settings + Reconnect Google link; retire fixed sent-samples flow"
```

---

## Phase 5 — Verification & gates (controller-run, not a task)

1. **Suite/build:** `TZ=UTC npx vitest run` (new: `gmail-schema` cases, `select` matchContacts, guard cross-file; updated `backup` cap), `npx tsc --noEmit`, `npm run build`, and confirm the three changed files add no NEW lint errors (`npx eslint <files>`).
2. **Security gate:** `/security-review` on the new body-reading surface — `lib/gmail-read.ts` (`gmailSearchSent` snippet + `gmailFetchBodies`), `/api/gmail/sent-search`, `/api/gmail/sent-bodies` — plus a final whole-branch review. Confirm: bodies read only for selected ids; snippet + full body reads live only in `lib/gmail-read.ts` (guard green); auth→rate-limit→validate ordering; no recipient/body/snippet logging; approve persists only summary + `{subject,date}`.
3. **Owner re-consent (one-time):** the `gmail.readonly` scope must be granted — walk the owner through the Google Cloud scope add + the "Reconnect Google" button (now in the UI).
4. **Live checks:** filter by a recipient (with Tab autocomplete), keyword-search, Load more, pick a few (verify the 20-cap disables further checks), Distill, edit the summary, Approve; then inspect `/api/state` to confirm ONLY `styleSummary` + `{subject,date}` persisted (no bodies/snippets); trigger the 409 path (before re-consent) and confirm the in-wizard "Reconnect Google" button appears.

## Highest-risk callout
This expands the sanctioned body-read surface (arbitrary sent-mail search + snippet display + selected-body reads) but keeps the boundary intact: all body-derived reads stay in `lib/gmail-read.ts` (cross-file guard test), `lib/gmail.ts` stays snippet-free, browsing is header+snippet only, full bodies are read solely for explicit ≤20 picks, and nothing but the reviewed summary + sample `{subject,date}` is persisted.
