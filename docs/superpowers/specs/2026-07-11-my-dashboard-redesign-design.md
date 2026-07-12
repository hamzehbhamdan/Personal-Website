# my.hamzehhamdan.com — Dashboard Redesign + Life CRM & Executive Coach

**Date:** 2026-07-11
**Status:** Design — awaiting review
**Author:** Hamzeh (with Claude)

---

## 1. Overview

The private dashboard behind the `my.` subdomain is currently a gutted placeholder: [`components/dashboard/Shell.tsx`](../../../components/dashboard/Shell.tsx) renders "Dashboard Content Placeholder", while ~8,700 lines of old dark/glassmorphic "Personal OS" view components sit orphaned (dark zinc, emerald/blue accents — the opposite of the public site).

This project rebuilds the dashboard as a cohesive **editorial extension of the public site** and, in the process, replaces its core views with two purpose-built apps ported from working Claude artifacts:

- **People** — a Personal Life CRM (ported from `Artifacts/outputs/crm.html`).
- **Coach** — an Executive Coach goal-cascade system (ported from `Artifacts/outputs/coach.html`).

Plus a new editorial **Home** overview and a restyled **Brain** (the existing Second Brain / RAG view).

### Decisions locked in brainstorming

| Decision | Choice |
|---|---|
| Structural ambition | Full editorial reimagining (not a reskin) |
| Design lean | **Site-faithful**: crimson `#A51C30`, hairline-flat + crisp cards, Geist Mono uppercase labels, Playfair serif. The artifacts' olive/orange → crimson; their soft rounded cards → crisp hairline cards. |
| Structure | **Home + People + Coach + Brain** (left editorial nav rail) |
| Card strategy | **Blend**: crisp bordered cards for bounded objects (a contact, a goal section, a metric); flat hairline rows for simple lists (Attention triage, task lists) |
| AI provider | **Claude (Anthropic)** for CRM drafting, Coach chat/intake/suggestions. Brain keeps OpenAI `file_search` (vector stores are OpenAI). |
| Data storage | **Supabase is the source of truth** (per-user JSONB documents, strict RLS). Browser holds an **in-memory working copy only** — no localStorage persistence of sensitive data (§5.7/§5.8). |
| Privacy posture | **Privacy-by-design**: strict RLS (no demo backdoor), least-privilege connector scopes (Gmail **metadata-only**), email/calendar data **never persisted**, secrets server-only, minimal AI egress, drafts-only/never-auto-send. See §5.7. |

---

## 2. Scope & decomposition

This is too large for a single implementation plan. It decomposes into **three sub-projects**, each getting its own plan after this spec is approved. Build in this order:

0. **Milestone A0 — pre-flight security hardening** (§5.10). Closes the **live exposures** the audit found (world-readable data via the anon key, unauthenticated API routes, burned secrets, the `documents` table, the parent-domain cookie, the dual deploy). Much of this is independent of the redesign and should land ASAP; the rebuild does not start on top of an exposed backend. Gated by a `/security-review` pass.
1. **Sub-project A — Design system + Shell + secure spine** (foundation). After A0: the blend design system, the `Home/People/Coach/Brain` shell, per-route auth, command palette, and the storage/AI/connector server routes with encrypted tokens. Prove a **thin vertical slice end-to-end** (auth → RLS → `/api/state` → one connector with encrypted tokens → one `/api/ai` call) before porting B/C onto it. Ends with the editorial Home overview. Nothing else can land cohesively until this exists.
2. **Sub-project B — People (Life CRM)**. Port `crm.html` into React components on the new design system + storage layer + Gmail/Calendar/Claude server routes.
3. **Sub-project C — Coach (Executive Coach)**. Port `coach.html` similarly.

The existing Supabase-backed `CrmView`, `TaskBoard`, `MomentumView` are **superseded** and removed once B/C land. `SecondBrainView` (Brain) and its `/api/vector/*` + `/api/chat` routes are **kept and restyled**.

---

## 3. Design system (the "blend")

The public site tokens (from [`app/globals.css`](../../../app/globals.css) and [`components/site-header.tsx`](../../../components/site-header.tsx)) are the base. We add a small dashboard layer. The artifacts' cream/olive system maps onto it as follows.

### 3.1 Token mapping

| Role | Artifact (cream) | Dashboard (site-faithful) |
|---|---|---|
| Page background | `#f4efe4` | `#f9f8f6` (site off-white) |
| Card / panel surface | `#fcf9f2` | `#ffffff` |
| Secondary surface | `#ece2cf` | `stone-100 #f5f5f4` |
| Hairline / border | `#e4dac6` | `stone-200 #e7e5e4` (softer `#f0eeea` for inner rows) |
| Primary text | `#332e23` | `stone-900 #1c1917` |
| Muted text | `#938b78` | `stone-400 #a8a29e` / `stone-500 #78716c` |
| **Accent** (all olive + orange) | `#6d7740`, `#bf6129` | **crimson `#A51C30`** |
| Heading / numeral serif | Iowan Old Style | **Playfair Display** (`var(--font-playfair)`) |
| Label / meta type | system sans | **Geist Mono**, uppercase, `letter-spacing 0.16–0.22em`, 10–11px |
| Body type | system sans | Geist Sans |

**Semantic colors** stay minimal and mostly monochrome to preserve the editorial calm. Status is carried by **mono uppercase labels**, not a rainbow of badge colors:

- Overdue / needs-attention / owe-a-reply → **crimson** text or a crimson-tint chip (`#faf0f1` bg).
- Neutral status ("in touch", "on track", tags, tiers) → stone (`#78716c` on `#f0eeea`).
- The single exception where a second hue earns its place: **progress rings** may use crimson for in-progress and a muted stone/ink for complete — no green/blue. (Open sub-decision, see §8.)

### 3.2 Component vocabulary

- **Card** — bounded object container. `background:#fff; border:1px solid #e7e5e4; border-radius:10–12px; box-shadow:none; padding:12–16px`. No soft shadows (the artifacts' `box-shadow` drops).
- **Hairline row** — simple list item. `padding:11–13px 0; border-bottom:1px solid #f0eeea`. Used for Attention triage, task lists, timelines.
- **Segmented control** — `#f0eeea` track, `padding:3px`, active segment `#fff` with **crimson** label + `border-radius:6–8px`. (Replaces the artifacts' olive-fill active state.)
- **Sub-tabs / view markers** — Geist Mono uppercase; active gets a crimson underline (mirrors the site's section nav).
- **Numbered section header** — `01 — Focus` in Geist Mono + a flex-1 hairline, exactly like the site's `01 — Experience`.
- **Buttons** — primary action = crimson-outline pill/rect (site "Consulting" button style: `border:1px solid rgba(165,28,48,0.32); color:#A51C30`), not a filled orange button. Filled crimson reserved for the single most important CTA per surface.
- **Badge / chip** — mono uppercase, 9–10px; crimson-tint for attention, stone-tint otherwise.
- **Progress ring** — SVG ring (kept from `coach.html`), recolored to crimson/stone with a Playfair numeral in the center.
- **Avatar** — initials circle, Playfair initials; default stone bg, crimson-tint for attention items. Photo upload preserved.
- **Modal** — `#fff` card, hairline border, Playfair title, `rgba(40,35,22,.45)` scrim. Kept structurally from the artifacts.
- **Floating chat FAB** (CRM) and **Coach pill** (Coach) — crimson.

Two reference mockups were produced during brainstorming (CRM Attention view, Option A flat vs Option B carded); the agreed direction is the blend of the two.

### 3.3 Typography rules

- Playfair Display: page/section titles, all standout **numerals** (KPIs, ring centers, streaks), the Home greeting, occasional italic editorial lines (e.g. current Focus).
- Geist Mono: nav, labels, meta, dates, tiers, tags, badges, timers (mono is ideal for the running stopwatch).
- Geist Sans: body, task titles, notes, form inputs.

---

## 4. Shell & navigation (Sub-project A)

Replaces the placeholder [`Shell.tsx`](../../../components/dashboard/Shell.tsx). Rendered for `my.` via the existing rewrite in [`middleware.ts`](../../../middleware.ts).

### 4.1 Layout

- **Left editorial rail** (~150–160px), warm bg, hairline right border:
  - `HH.` wordmark (crimson dot), mirroring the site header.
  - Numbered nav: `01 Home · 02 People · 03 Coach · 04 Brain`. Geist Mono uppercase; active item = stone-900 text + 2px crimson left border + white bg; inactive = stone-400.
  - Footer: `⌘K` command hint, Settings, Sign out.
- **Main column**: max content width, generous padding, per-view editorial header (mono meta line → Playfair title → hairline divider).
- **Command palette** (`⌘K`): ported/kept from [`CommandPalette.tsx`](../../../components/dashboard/CommandPalette.tsx), restyled; jumps between apps and runs quick actions.
- **Mobile**: rail collapses to a top bar + sheet (reuse the site's `Sheet` pattern). Each app is already responsive in the artifacts; preserve their `@media` breakpoints, retuned to the new tokens.

### 4.2 Auth & routing

- Keep Supabase auth + `ALLOWED_EMAIL` gate in `middleware.ts` (already protects `/dashboard` and `my.`).
- Client views hydrate from server state (see §5), so an unauthenticated user never receives data.

### 4.3 Home (overview)

New editorial landing surface (the mock shown in brainstorming): mono date line → Playfair greeting → numbered sections that surface the **top of each app**:

- `01 — Focus`: current Coach focus / running timer, if any.
- `02 — Today`: today's unfinished Coach tasks (hairline rows) + CRM "needs attention" count.
- `03 — Momentum`: a few Playfair-numeral metrics (tasks cleared this week, day streak, follow-ups due) pulled from Coach + CRM.

Home is read-only aggregation; all editing happens in the apps.

---

## 5. Data & security architecture (Sub-project A)

### 5.1 Storage — Supabase as source of truth

The artifacts are document-shaped (nested goals/tasks/subtasks/timers, `weekPlan` maps, contact/group graphs). Rather than a large relational rewrite, store each app's state as a **JSONB document per user**:

```sql
create table app_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  app        text not null,           -- 'lifeCRM' | 'execCoach'
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table app_state enable row level security;
-- STRICT: scoped to the authenticated user ONLY. No demo/backdoor clause.
create policy "state_select" on app_state for select using (auth.uid() = user_id);
create policy "state_insert" on app_state for insert with check (auth.uid() = user_id);
create policy "state_update" on app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "state_delete" on app_state for delete using (auth.uid() = user_id);
```

- `data` holds the artifact's `DB` object verbatim (`lifeCRM_v1` / `execCoach_v1` shape). **The artifacts' logic is reused almost unchanged**; only `load()`/`save()` are swapped from `localStorage` to a tiny state API.
- **Access control** is server-enforced by RLS + the `ALLOWED_EMAIL` gate — never by obscurity.
- Rationale over full-relational: preserves the artifacts' proven logic, ships cross-device sync + durability now, defers normalization until querying/reporting genuinely needs it (YAGNI). Migrating to relational later is a contained change behind the same API.

> ⚠️ **Mandatory pre-work — audit existing RLS.** Every current table in [`supabase/schema.sql`](../../../supabase/schema.sql) uses `USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000')`. That demo-user clause, combined with the **public anon key** shipped to the browser, makes all demo-owned rows world-readable/writable. Before any new work: (1) remove the `OR user_id = '000…0'` clause from **all** policies, (2) add explicit `WITH CHECK`, (3) audit and purge any rows currently owned by the demo user, (4) remove the `INSERT INTO auth.users … demo@example.com` seed. This is tracked as the first task of Sub-project A.

### 5.2 State API

- `GET /api/state?app=lifeCRM` → returns `data` for the authed user (empty seed if absent).
- `PUT /api/state?app=lifeCRM` → upserts `data` (debounced client-side, ~500ms after mutations; last-write-wins by `updated_at`).
- Client keeps the in-memory `DB` object (as today) and may mirror to `localStorage` **only as a fast-load cache**, reconciled against the server on load. Cache is never authoritative.

### 5.3 Backup/restore & CSV import

The artifacts' JSON export/restore and CRM CSV import are preserved as client features operating on the in-memory `DB` (then synced). This satisfies the guide's backup requirement without weakening the server-of-record model.

### 5.4 Secrets & connectors — all server-side

Replace every `window.cowork.callMcpTool` / `askClaude` with Next.js API routes. **No API key or OAuth token ever reaches the browser.**

| Artifact call | New server route | Backing |
|---|---|---|
| `askClaude(...)` (drafts, coach, intake, suggest, tags) | `POST /api/ai` | Anthropic API (`ANTHROPIC_API_KEY`), model `claude-sonnet-5` default |
| `search_threads` (Gmail) | `POST /api/gmail/search` | Google Gmail API w/ stored OAuth token |
| `create_draft` (Gmail) | `POST /api/gmail/draft` | Gmail API |
| `list_events` (Calendar) | `POST /api/calendar/events` | Google Calendar API (already-configured OAuth) |

- **Every route self-authenticates.** ⚠️ Middleware does **not** run on `/api/*` (the matcher's `(?!api…)` lookahead excludes it — the `isProtectedApi` block in [`middleware.ts`](../../../middleware.ts) is dead code). So each route must independently: create a server Supabase client from the request cookies, call `getUser()` (validates the JWT server-side), and reject unless `user.email === ALLOWED_EMAIL`. Return 401/403 with no body on failure.
- **Use the user-scoped Supabase client, not the service role.** State reads/writes go through a client authenticated as the user so RLS applies as defense-in-depth. The service-role key is never used in request-handling routes.
- **CSRF + abuse controls.** Mutating routes (`PUT /api/state`, `POST /api/gmail/draft`) verify the `Origin` header matches the site; `/api/ai` is rate-limited (per-user, small ceiling) and caps input size.
- Prompts move server-side; the client sends only the structured context the artifact already builds (`askContext()`, `ctx()`), keeping payloads minimal (see §5.8 for egress minimization).

### 5.5 Google / Gmail OAuth

- Calendar OAuth exists (`GCAL_CLIENT_ID/SECRET`, `calendar.readonly` via Supabase — see [`CALENDAR_SETUP.md`](../../../CALENDAR_SETUP.md)).
- **Gmail is new — least privilege.** Use **`gmail.metadata`** (message headers only: from/to/date/subject — **no bodies, no snippets**) for suggested contacts, last-talked, and replies-owed, plus **`gmail.compose`** (create drafts only — cannot send). We deliberately do **not** request `gmail.readonly`; the CRM works from subjects + participants alone. Both are restricted scopes — fine for a single test user with the OAuth app in "testing" mode; public rollout (needing Google verification) is out of scope.
  - Consequence: drop the artifacts' use of email *snippets* (subjects only). Update the CRM's "recent interactions" text and auto-tags prompt accordingly.
- **Server-side OAuth code flow, encrypted tokens.** Do **not** use Supabase's client-side `provider_token` (it lands in the browser). A Next.js route handles the Google callback and stores the **refresh token encrypted at rest** (AES-GCM, key from a server-only env var) in an RLS-protected table; access tokens are minted server-side per request. No Google token ever reaches the client.
- Every AI/connector surface degrades gracefully when a connector isn't linked (the artifacts already handle "no runtime" states — we keep those as "connect Gmail to enable this").

### 5.6 XSS / rendering

- Porting to React/JSX removes the artifacts' heavy `innerHTML` usage; JSX auto-escapes. **No `dangerouslySetInnerHTML` on any Gmail-/user-derived content.** The one place needing light markdown (AI answers) uses a vetted renderer (e.g. `react-markdown` with raw HTML disabled), not raw HTML injection.
- Avatar uploads are validated as images and shrunk client-side (kept from the artifacts); stored as bounded data URLs.

### 5.7 Security & privacy — threat model & controls

The data here is high-sensitivity: a full personal relationship graph, Gmail-derived metadata, calendar participation, private notes about real people, and AI-generated drafts. Controls, by threat:

| Threat | Control |
|---|---|
| Public anon key + permissive RLS → data exfiltration | Strict RLS scoped to `auth.uid()`, demo backdoor removed, `WITH CHECK` on writes (§5.1). Existing tables audited first. |
| Unauthenticated API access (middleware skips `/api`) | Every route self-authenticates via `getUser()` + `ALLOWED_EMAIL` (§5.4). |
| Secret/token theft | All secrets server-only env (never `NEXT_PUBLIC_*`); Google refresh token encrypted at rest, server-side flow (§5.5); Anthropic/OpenAI keys server-only. |
| Over-broad mailbox access | `gmail.metadata` (no bodies/snippets) + `gmail.compose` (drafts only, cannot send) (§5.5). |
| CSRF on mutating routes | `Origin` check + SameSite=Lax cookies (§5.4). |
| Cost/abuse | Per-user rate limit + input caps on `/api/ai` (§5.4). |
| Prompt injection via email subjects / notes | Untrusted content is data, not instructions; **all AI output is a reviewable draft — nothing is ever auto-sent** (hard invariant). |
| Third-party PII to model providers | Egress minimization + rely on API no-training default; consider ZDR (§5.8). |
| XSS reading in-memory data | JSX escaping; no `dangerouslySetInnerHTML` on user/email content (§5.6). |
| Data-at-rest disclosure | Supabase encrypts at rest; only user-authored docs stored — Gmail/Calendar never persisted (§5.8). Optional field-level encryption of `notes` (§9). |
| Logging leaks | **No route logs message content or PII.** Remove the existing `debug-chat.log` file logger in [`/api/chat`](../../../app/api/chat/route.ts). |
| Lost/shared device | No browser persistence of sensitive data — in-memory only (§5.8). |
| Transport | HTTPS only (Netlify); cookies `Secure`, `HttpOnly`, `SameSite=Lax` (Supabase SSR defaults verified). |

**E2E-encryption trade-off (stated honestly):** true end-to-end encryption is *incompatible* with server-side AI + Gmail matching, because the server must read the data to perform them. We therefore rely on RLS + encryption-at-rest + strict access control, not E2E. Optional field-level encryption of the most sensitive free-text (`notes`) is offered in §9, with the caveat that AI cannot read encrypted fields.

**Security review gate:** run `/security-review` on the branch after Sub-project A's spine lands and again before deploy, plus a manual checklist (RLS scoped, routes self-auth, tokens encrypted & server-only, scopes minimal, no PII in logs, no `NEXT_PUBLIC` secrets).

### 5.8 Data minimization & lifecycle

- **Stored at rest (Supabase):** only user-authored data — contacts, notes, tiers, goals, tasks, What-matters/Memory. Nothing else.
- **Fetched live, never persisted:** Gmail metadata and Calendar events — pulled per session, computed in memory, discarded. Derived only a `lastTouch` timestamp is written back.
- **Sent to the model, only on explicit action, minimized:** send the smallest context needed; **strip emails and phone numbers** from AI payloads unless a specific draft requires them; a Settings toggle governs what may be shared with the model. Rely on Anthropic/OpenAI **API no-training** defaults; pursue a **Zero-Data-Retention** agreement if available.
- **No browser persistence by default:** in-memory working copy hydrated from Supabase on load; no localStorage of sensitive data. (A non-sensitive UI-prefs cache is acceptable.)
- **Deletion & revocation:** a "Delete all data" action purges the user's `app_state` rows and revokes/erases stored Google tokens. JSON export stays local (user-initiated download).

### 5.9 Current-stack audit — verified findings

A 6-dimension adversarial audit of the existing stack (each finding independently re-verified against the code) produced 47 confirmed findings. Deduped and ranked below. **"Live"** = exploitable on the current deployment today, independent of the rebuild. All must be resolved as part of Sub-project A (most in the pre-flight milestone §5.10).

| # | Sev | Live | Finding | Evidence |
|---|---|---|---|---|
| C1 | 🔴 crit | ✅ | **RLS nil-UUID backdoor + all data stored under it.** Every table's policy is `USING (auth.uid()=user_id OR user_id='000…0')`, and the app writes *all real rows* under that nil UUID. The public anon key (in the client bundle) can therefore read/write/delete the entire dataset via direct PostgREST, bypassing Next.js + middleware + `ALLOWED_EMAIL`. | `schema.sql` all policies; `ImportContactsModal.tsx:35`, `CrmView.tsx:401`, `TaskBoard.tsx:812`, `SecondBrainView.tsx:245` |
| C2 | 🔴 crit | ✅ | **`documents` table (Second Brain corpus) has RLS *disabled* and no owner column.** Full note/file text world-readable/writable via anon key; `match_documents` RPC is anon-executable and returns unfiltered content. | `schema.sql:175`, `:185` |
| C3 | 🔴 crit | ✅ | **All `/api/*` routes are unauthenticated** (middleware's matcher excludes `/api`, so its `isProtectedApi` block is dead code). `/api/chat` returns contacts/tasks/notes to anyone and spends `OPENAI_API_KEY`; `/api/vector/*` is IDOR-able (anon create/delete stores + files); `/api/briefing` proxies a caller-supplied Google token; `/api/neural-sort` skips `ALLOWED_EMAIL`. | `middleware.ts:7,103`; `chat/route.ts:78`; `vector/stores/route.ts:15,93` |
| C4 | 🔴 crit | ✅ | **Secrets to treat as burned.** `.env` holds `SUPABASE_DB_PASSWORD` (a direct Postgres connection that bypasses **all** RLS), `OPENAI_API_KEY`, `GCAL_CLIENT_SECRET`. Given C1–C3, assume all are compromised; rotate every one and scan git history for the *values* (not just the `.env` filename, which was never committed). | `.env` |
| H1 | 🟠 high | ✅ | Outdated **Next.js 16.1.4** — audit against Next security advisories (middleware/auth-bypass class) and upgrade to the latest patch. | `package.json:40` |
| H2 | 🟠 high | ✅ | `ALLOWED_EMAIL` enforced only in middleware → any signed-in Google user (or direct PostgREST/API call) bypasses the single-user gate. | `middleware.ts:80` |
| H3 | 🟠 high | ✅ | **Netlify secret-scanner blinded** (`SECRETS_SCAN_OMIT_PATHS=.next,.netlify,public`) while a module-level Supabase client is imported by client components — a server-secret bundle-leak would go undetected. | `netlify.toml`; `lib/supabase.ts` |
| H4 | 🟠 high | ⚠️ | **AI confused-deputy / tool-calling exfiltration.** `/api/chat` gives the model `getTasks`/`getContacts`/`searchLocalNodes` with `tool_choice:auto`; a poisoned note retrieved via `match_documents` can make the model dump the network in its reply. The rebuild adds Gmail-draft + calendar tools → attacker-controlled *side effects*. No per-tool authz, output DLP, untrusted-content delimiting, or human-confirm. | `chat/route.ts` |
| H5 | 🟠 high | ✅ | `/api/vector/ingest` has no size limit, no server-side type validation, and trusts client MIME. | `vector/ingest/route.ts:22` |
| M1 | 🟡 med | ✅ | Google Calendar **`provider_token` persisted in `localStorage`** — a live Google access token sitting in the browser. (The rebuild must never do this — §5.5.) | `QuickCalendarPopUp.tsx:119` |
| M2 | 🟡 med | ✅ | `debug-chat.log` writes full message content + model output to disk (not gitignored; may also crash on Netlify's read-only FS). | `chat/route.ts:10` |
| M3 | 🟡 med | ⚠️ | No rate limiting on any route (cost/DoS, amplified by the missing auth). | routes |
| M4 | 🟡 med | ✅ | `match_documents()` anon-executable, unfiltered content, mutable `search_path`. Post-rebuild it must filter by `auth.uid()` (or be `SECURITY INVOKER`), pin `search_path`, and `REVOKE EXECUTE … FROM anon, public`. | `schema.sql:185` |
| M5 | 🟡 med | ✅ | Write policies lack explicit `WITH CHECK` → with the backdoor, anon can inject rows the AI later ingests (stored prompt injection). | `schema.sql:222` |
| M6 | 🟡 med | ✅ | Vector-store ownership never verified → IDOR across the entire OpenAI account (read/delete any store's files). | `vector/files/route.ts:21` |
| M7 | 🟡 med | ✅ | **Parent-domain, non-HttpOnly session cookie** (`.hamzehhamdan.com`) → session theft *and* CSRF: any subdomain (the static site, the injection lab, any `*.hamzehhamdan.com` XSS) can drive authenticated state-changing calls to `my.…/api/*`. | session cookie |
| M8 | 🟡 med | ⚠️ | **`mcp-injection-lab/`** (a prompt-injection payload corpus) is served on-origin via `public/playground/` — a ready poisoning source if it reaches Second Brain ingest. | `public/playground/mcp-injection-lab/` |
| L1 | ⚪ low | ✅ | **Dual public deploy**: GitHub Pages static export (no middleware/auth) alongside Netlify; CI uses unpinned actions, `id-token:write` on every push, no Dependabot/`npm audit`/secret-scanning. | `.github/workflows/deploy.yml` |
| L2 | ⚪ low | ✅ | No security headers anywhere (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). | `next.config.ts`/`netlify.toml` |
| L3 | ⚪ low | ✅ | Verbose error leakage (raw `error.message`) across routes; `login/actions.ts` logs error + Supabase-URL prefix. | routes; `login/actions.ts` |
| L4 | ⚪ low | ✅ | PostgREST filter injection in `getContacts` via unescaped search term in `.or()`. | `chat/route.ts` |
| L5 | ⚪ low | ✅ | Latent: `dangerouslySetInnerHTML` + KaTeX `trust:true`; `profiles.background` free-text interpolated into an inline `style` (CSS/URL-injection + outbound-fetch privacy beacon). | `SecondBrainView`; `SettingsModal.tsx` |
| L6 | ⚪ low | ⚠️ | No data minimization to OpenAI (full notes/files/images uploaded); no delete-on-source-delete at OpenAI/Google; no export/retention accounting. | `vector/ingest/route.ts` |

Two candidate findings were **refuted** on verification (CommandPalette localStorage client; "background accepts arbitrary URL" as a high finding — downgraded to the latent L5). 46 existing safe patterns were catalogued to preserve (RLS *is* enabled on most tables, `getUser()` used in middleware, SSR cookie helpers, `.env` gitignored, avatar size caps, the `isPerson` filter, etc.).

### 5.10 Remediation plan

**Milestone A0 — pre-flight hardening (first work item of Sub-project A; several are live exposures to close ASAP):**

1. **Rotate every secret** (DB password, OpenAI, GCAL secret; regenerate Supabase anon/service keys) and `git log -p -S` the *values* across history. Confirm no app path uses `SUPABASE_DB_PASSWORD` (app talks PostgREST only). *(C4)*
2. **Fix RLS on all ~11 tables**: strip the `OR user_id='000…0'` clause, add strict `auth.uid()=user_id` + `WITH CHECK`, delete the seeded demo user, and **backfill/purge** — for each table count nil-UUID rows, reassign real data to Hamzeh's uid, purge the rest. Includes `neural_chats` (full AI transcripts — decide wipe) and `calendar_events` (drop persistence per §5.8). *(C1, H2, M5)*
3. **Enable RLS + owner column on `documents`**; harden `match_documents` (filter by `auth.uid()` or `SECURITY INVOKER`, pin `search_path`, revoke anon/public EXECUTE). *(C2, M4)*
4. **Authenticate every `/api/*` route** (`getUser()` + `ALLOWED_EMAIL`), remove the dead middleware block, add `Origin`/`Sec-Fetch-Site` checks + rate limits, verify vector-store ownership, stop trusting client MIME, cap upload size, and strip verbose errors. *(C3, H5, M3, M6, L3, L4)*
5. **Remove `debug-chat.log`** and add a redaction logging policy (no bodies/tokens/key-prefixes; no filesystem writes). *(M2)*
6. **Cookie model**: switch to host-only (`my.hamzehhamdan.com`), `HttpOnly`, `SameSite`. *(M7)*
7. **Upgrade Next.js**; add security headers (CSP/HSTS/etc.). *(H1, L2)*
8. **Resolve the dual deployment**: decide whether GitHub Pages should serve the app at all; if kept, ensure it exposes no data path. Pin CI actions by SHA, enable Dependabot + secret scanning/push-protection, add an `npm audit` gate; re-tune the Netlify secret-scan omits + grep the production build for secret prefixes. *(L1, H3)*
9. **Isolate `mcp-injection-lab`** from the app origin and hard-exclude it from any ingest pipeline. *(M8)*

**New-surface controls (design requirements for B/C, beyond §5.4–5.8):**

- **`/api/state`**: validate the JSONB payload against a schema with a hard size cap on write; treat stored content as untrusted at render (no markup smuggling into the DOM). *(all data in one row — one slip exposes everything)*
- **Token crypto**: unique random IV per encryption, AEAD (AES-GCM), key **versioning/rotation**, and defined **revocation + refresh-failure** paths; encryption key server-only, never bundled.
- **AI tool-calling**: side-effecting tools (Gmail draft, calendar) require **explicit human confirmation**; retrieved/email content is delimited as untrusted; recipients are constrained + echoed back before a draft is created; per-tool authorization; constrain tool-output egress. *(H4)*
- **Gmail egress**: send only the minimum header fields to the model; never persist Gmail metadata server-side.
- **Data lifecycle**: deletion also removes corresponding OpenAI files/vector entries + Google tokens; document exactly what egresses to OpenAI/Anthropic/Google and pursue zero/limited-retention settings. *(L6)*

---

## 6. People — Life CRM (Sub-project B)

Port of `crm.html`. Data model preserved exactly: `DB = { version, contacts[], groups[], dismissed[], tiers[], settings }`.

- **Contact**: `{ id, name, emails[], phone, tier, cadenceDays, birthday(MM-DD), howWeMet, tags[], notes, avatar*, lastTouch, snoozeUntil, log[] }`.
- **Views** (segmented control → mono tabs + crimson underline): **Attention** (default, merged triage list — overdue + replies-owed + birthdays, hairline rows), **People** (filter by tier/tag, sort, search; Contacts / Suggested sub-toggle), **Groups** (manual + smart groups with count badge).
- **Computed state** (`state(c)`): last-contact from merged Gmail + Calendar + manual log; overdue/soon/owe-reply/birthday logic — ported verbatim.
- **Suggested contacts**: the `isPerson()` filter (newsletters/no-reply/role/marketing/calendar-system exclusion) ported verbatim; suggestions mined from Gmail + Calendar minus known/dismissed.
- **Contact detail modal**: tier/cadence, how-met, tags, groups, merged **Recent interactions** timeline (email direction arrows, 📅 meetings, logged touches). Actions: **Draft check-in** (Claude), **Log interaction**, **Snooze 30d**, **Edit**.
- **Tiers & cadence**: editable in Settings; safe migration of contacts + smart-group rules on rename/delete (ported).
- **Smart groups**: rule kinds `all | tier | tag | overdue`; **group update draft** (Claude, ~150–200 words) with **BCC/TO** send-mode → Gmail draft.
- **Avatars**: photo upload (canvas-shrink to thumbnail) or initials+color — client-side, preserved.
- **Ask panel** (floating crimson FAB): "Ask about your people" with suggested chips, answered by Claude over `askContext()`.
- **Settings**: auto-tags (Claude, off by default), backup/restore, CSV import, tier management.

Styling: crimson/stone/serif/mono per §3. Attention = flat hairline rows; contact/group/suggestion items and the detail modal = crisp cards; tier/tag/status = mono labels (no multi-hue tier palette by default — see §8).

---

## 7. Coach — Executive Coach (Sub-project C)

Port of `coach.html`. Data model preserved: `DB = { version, goals[], tasks[], matters, memory, intakeDone, weekPlan, planDone }`.

- **Horizon switcher** (segmented): `Week · Month · Quarter · Year`, with a period bar (`‹ ›` nav, label, progress read-out with on-pace/behind-pace).
- **Week (working surface)**: goal sections (each a goal pulled in for the week, with progress ring + horizon tag + ♻ recur marker), **rich tasks** (point estimate, subtasks, tags, notes), **built-in timers** (play/pause/reset, single-runner, persisted, auto-pause on complete — ported exactly, incl. the 1s tick), a **points meter + next-up** card, and an **Unfiled** catch-all. Empty week = one calm card with `Work toward a goal · ✦ Plan this week · Quick task`.
- **Roll-up math** (`subtree`, `progressOf`, points-based): ported verbatim — weekly effort climbs the whole ladder.
- **Higher horizons (Month/Quarter/Year)**: goal cards with ring, "ladders up to" parent link, child chips, task/time summary, collapsed-by-default task lists, auto/manual progress, recurring flag.
- **Roll-forward** ("Plan this week"): refresh recurring goals, carry over unfinished, **Claude-suggested** tasks decomposed from month/quarter goals + What matters + Memory. Approve/edit/skip; never auto-applies.
- **Insights**: metric cards, time-by-goal + tasks-by-goal bars, needs-more-time callout, points-over-time, projected finish. Restyled to §3 (Playfair numerals, crimson/stone bars).
- **Search overlay**: find any goal/task, jump to its horizon/period.
- **Coach panel** (crimson `✦ Coach` pill): tabs **Chat** (Claude over `ctx()`), **What matters**, **Memory**.
- **Intake**: guided top-down year→quarter→month chat; first-run captures What matters + seeds Memory; proposes goals as an approvable checklist. Prompt logic ported; runs through `/api/ai`.

Styling: goal sections/cards = crisp cards; task lists = hairline rows; rings/tags/timers recolored per §3.

---

## 8. Brain (Sub-project A tail)

Keep [`SecondBrainView.tsx`](../../../components/dashboard/SecondBrainView.tsx) and its `/api/vector/*` + `/api/chat` (OpenAI `file_search`) functionally intact; **restyle only** to the new tokens so it sits consistently in the shell. No data-model or provider change here (vector stores are OpenAI). This is the smallest piece.

---

## 8.5 Testing & verification

- **TDD the pure logic first.** Before UI, port and unit-test the artifacts' pure functions: Coach roll-up (`subtree`, `progressOf`, `taskPts/DonePts`), CRM `state()` (overdue/soon/owe-reply/birthday), `isPerson()` suggestion filter, cadence math, and tier-rename/delete migration. These are the correctness-critical, security-adjacent pieces.
- **Reuse the artifacts' own harnesses as golden oracles.** `Artifacts/outputs/` ships the test harnesses the originals were validated with (`crmharness.js`, `coachharness.js`, `coachcheck.js`, `coachmig.js`, `verify.py`, `chk*.js`, `crmseed*.js`). Adapt them into the repo's test suite to lock behavioral parity with the source artifacts.
- **Security tests.** Assert: unauthenticated + wrong-user requests to every `/api/*` route get 401/403; RLS blocks cross-user reads (a second user sees nothing); no route response or log contains a secret/token; AI payloads contain no email/phone unless a draft path requires it.
- **Verification before "done"** (per the `verification-before-completion` discipline): drive each app end-to-end in the preview, confirm parity against the source HTML, and run the security checklist — evidence before claims.

## 9. Open sub-decisions (for spec review)

1. **Progress-ring / accent duality.** Pure crimson-only reads calm but makes "done" vs "in-progress" rings low-contrast. Options: (a) crimson in-progress + ink/stone complete; (b) allow one muted secondary (a desaturated olive nod to the artifacts) *only* for ring-complete and positive insight bars. Recommend (a).
2. **Tier colors.** Artifacts give each tier a color. Site-faithful default = mono stone labels only. Keep an optional muted per-tier dot? Recommend mono-only for launch, revisit if it hurts scanability.
3. **AI model tier.** `claude-sonnet-5` default for drafting/coach; consider a stronger tier for intake synthesis. Recommend Sonnet everywhere to start.
4. **Netlify + connectors.** Confirm the deploy target (current `netlify.toml`) can hold the Google refresh-token flow, the token-encryption key, and the Anthropic key as server env — vs. moving `my.` to a runtime that better supports server routes. Needs a quick verification during Sub-project A's thin slice.
5. **Field-level encryption of `notes`.** Optionally encrypt contact `notes` (and Coach `memory`/`matters`?) at the field level so even a DB compromise doesn't expose free-text — at the cost of AI being unable to read those fields. Recommend: not for launch (RLS + at-rest is sufficient for a single-user app); revisit if desired.
6. **AI sharing controls granularity.** How much to expose in the Settings "what may be shared with the model" toggle — all-or-nothing vs per-field. Recommend a simple on/off for launch, defaulting to minimized context.

---

## 10. Explicitly out of scope (YAGNI)

- Multi-user / sharing (single-user app, `ALLOWED_EMAIL`).
- Full relational schema for CRM/Coach (JSONB document is sufficient now).
- The old dark "Personal OS" start-page, background images, glassmorphism, and unused widgets ([`FocusTimerPopUp`](../../../components/dashboard/FocusTimerPopUp.tsx), `NeuralChatPopUp`, `QuickCalendarPopUp`, etc.) — removed unless a specific feature above needs them.
- Finance dashboard artifacts (explicitly excluded by Hamzeh).
- Google OAuth verification for public use (single test user only).

---

## 11. Success criteria

- `my.hamzehhamdan.com` renders a cohesive editorial dashboard indistinguishable in design language from `hamzehhamdan.com`.
- People and Coach reproduce the artifacts' behavior (verified against the source HTML), with data persisted securely in Supabase and synced across devices.
- No secret or OAuth token is ever exposed to the browser; strict RLS + per-route auth gate all data; the demo-user backdoor is gone and existing tables are audited.
- Gmail (metadata-only) + Calendar sync populate the CRM without persisting email/calendar data; Claude powers drafting/coach/intake; all degrade gracefully when a connector is unlinked; nothing is ever auto-sent.
- The security review gate passes (RLS scoped, routes self-auth, tokens encrypted & server-only, minimal scopes, no PII in logs).
- Brain continues to work, restyled.
