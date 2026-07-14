# Sub-project A1 — Design System, Shell & Secure Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the editorial dashboard foundation — the "blend" design-system primitives, the `Home / People / Coach / Brain` shell, and the secure server spine (`/api/state`, encrypted Google tokens + one live connector, `/api/ai` on Claude) — so the People (B) and Coach (C) ports drop straight onto it.

**Architecture:** Supabase-as-source-of-truth via a per-user JSONB `app_state` document behind `/api/state`; the artifacts' logic keeps an in-memory copy synced through a `useAppState` hook (no sensitive localStorage). All secrets/connectors are server-side: Google refresh tokens are AES-GCM-encrypted at rest, minted to short-lived access tokens per request; Claude powers AI via `/api/ai`. The UI is a left editorial rail switching between view components, styled with a small set of crimson/stone/Playfair/Geist-Mono primitives.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase (`@supabase/ssr`) · Tailwind v4 · Framer Motion · `@anthropic-ai/sdk` (Claude) · `zod` · Node `crypto` (AES-256-GCM) · Vitest.

**Depends on:** `2026-07-11-a0-security-hardening.md` (DONE — executed + deployed to production 2026-07-13). Source spec: `docs/superpowers/specs/2026-07-11-my-dashboard-redesign-design.md` (§3, §4, §5.2–5.8). People (B) and Coach (C) plans follow this one.

---

## ⚠️ Reconciliation with A0 (as-built, 2026-07-13) — READ THIS FIRST

A0 was executed and **deployed to production** on a **fresh Supabase project**. Several of its choices change this plan's assumptions. Do not start A1 without absorbing this.

**A0 spine that already exists — build on it, do NOT recreate:**
- `lib/auth.ts` → `gateResult(user, allowedEmail)` (pure allow-list, fail-closed incl. whitespace-only email).
- `lib/supabase-server.ts` → `createServerSupabase()` (cookie-bound, **HttpOnly** cookies) + `requireUser(req?)` (validates the JWT via `getUser()`, enforces `ALLOWED_EMAIL`, same-origin check on non-GET/HEAD). Every A1 route uses this gate.
- `lib/rate-limit.ts` → `allow(key, limit, windowMs)`; `lib/vector-store-ownership.ts` → `ownsStore()` (used by the Brain's vector routes + `/api/chat` file_search).
- Baseline security headers already in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) + a `noindex` header on `/playground/mcp-injection-lab/*`. **CSP is still deferred to A1 → new Task 18.**
- Vitest is set up with a `@/` path alias and a `test.env` block (dummy `OPENAI_API_KEY` + `NEXT_PUBLIC_SUPABASE_*`) so route modules import under test. New A1 tests inherit this — don't re-add the alias/env.
- Next.js is **16.2.10** (not 16.1.4). Next 16.2 deprecates the `middleware.ts` file convention in favour of `proxy.ts` — an eventual rename (still works with a build warning; low priority, fold into any middleware task).

**Fresh Supabase project — `supabase/migrations/` no longer exists.** The old project was unrecoverable (free-tier 90-day pause), so A0 stood up a NEW project (ref `naznvfdhizdpteslyqpm`) and **deleted the migrations directory**; `supabase/schema.sql` is now the single, idempotent, **secure** bootstrap (13 legacy tables, strict per-owner RLS with `USING`+`WITH CHECK`, secure `documents`/`match_documents`, no demo user, no nil-UUID; each policy is `drop policy if exists … ; create policy …` so it's re-runnable). Consequences:
- **Task 4 (`0002_app_state.sql`) and Task 8 (`0003_google_tokens.sql`) should be APPENDED TO `supabase/schema.sql`** (same idempotent style: `create table if not exists`, `enable row level security`, `drop policy if exists` before each `create policy`) — there is no `migrations/` dir to add files to. Hamzeh runs the appended block in the Supabase SQL editor.
- The 13 legacy relational tables (contacts, tasks, projects, notes, focus_sessions, neural_chats, sprints, calendar_events, subtasks, contact_connections) are **superseded** by the `app_state` JSONB model for People/Coach — they go unused once B/C land (empty + RLS-secured = harmless; drop in a later cleanup if desired). **Brain KEEPS** `documents` + `user_vector_stores` + `match_documents` + `/api/chat`.

**HttpOnly cookies change the client auth model (affects the shell):** the session cookie is now **HttpOnly**, so the *browser* Supabase client (`lib/supabase-browser.ts`) can no longer read or clear the session. All authed work is **server-side**:
- **Sign-out must be a server action/route** that clears the cookie server-side. `createSupabaseBrowserClient().auth.signOut()` in Task 12's Shell will NOT work (JS can't touch an HttpOnly cookie) — replace it with a `signout` server action mirroring `app/login/actions.ts`, called by the Rail.
- Data reads already go through server routes (`/api/state`, etc.) that read the cookie server-side via `requireUser` — those work; `fetch` sends the cookie same-origin. Keep client components fetching `/api/*`, never the browser Supabase client for authed reads.

**Google LOGIN is a NEW requirement (from the deploy chat) — distinct from the Google *connector*.** Hamzeh wants "Continue with Google" **plus** email/password on the login page. Do not conflate the two Google OAuth flows:
- **Login** = Supabase Auth's Google provider: `supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo:<origin>/auth/callback}})` → Google → `https://<ref>.supabase.co/auth/v1/callback` → the app's `app/auth/callback/route.ts` calls `exchangeCodeForSession` (sets the HttpOnly session). Config lives in **Supabase → Authentication → Providers → Google** (set up during the deploy chat). → new **Task 16**.
- **Connector** = a *separate* OAuth client for Calendar/Gmail data access (Tasks 8–10 here), redirect `https://my.hamzehhamdan.com/api/google/callback`, storing an encrypted refresh token. Unchanged.
- `ALLOWED_EMAIL` + strict RLS gate both — a non-matching Google account gets a session but is bounced by middleware/`requireUser` (Task 16 should also sign such a user out for a clean UX).

**Marketing site / GitHub Pages (task chip `task_3d7f3463`).** The Pages build for `hamzehhamdan.com` has been failing since ~Jan 31 (a dynamic `/consulting/opengraph-image` route is incompatible with `output: export`), so the marketing site is a stale January snapshot. Fixing it naively would publish `/dashboard` **unauthenticated** on the Pages host (no middleware there). → new **Task 17**: fix the export AND exclude `/dashboard`, `/login`, `/auth`, `/api` from it.

**Env baseline (already set in `.env` + Netlify from A0):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fresh project), `ALLOWED_EMAIL`, `OPENAI_API_KEY` (rolled), `GCAL_CLIENT_SECRET`. **No `service_role`/secret key is used — keep it that way.** P1 below adds the rest; also confirm `GCAL_CLIENT_ID` is set (Task 9 uses it).

**Minor A0 lessons for A1:**
- Local `next build` needs the runtime env set — module-level `new OpenAI()` / `new Anthropic()` throw without a key. Either export dummies when building locally (`OPENAI_API_KEY=x ANTHROPIC_API_KEY=x NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npm run build`) or construct those clients lazily inside the handler.
- Task 15's secret grep: raw `grep "sk-"` false-positives on Tailwind `mask-*` classes — grep for canary secret *values* (build with distinctive dummies) instead of the `sk-` pattern.
- Netlify's secret scanner now inspects `.next` (A0 narrowed `SECRETS_SCAN_OMIT_PATHS` to `public`). If a build fails on secret scanning, it's flagging a real inlined secret — investigate, don't just re-omit.
- Dev-only `vitest`/`vite` carry a known critical/high advisory (test-runner only, never shipped). A deliberate Vitest 2→3 migration clears `npm run audit:ci`; optional.

---

## ⚠️ OPS PREFACE (Hamzeh)

- [ ] **P1. Add env vars** (server-only; **not** `NEXT_PUBLIC_`) locally and in Netlify:
  - `ANTHROPIC_API_KEY` — from console.anthropic.com.
  - `TOKEN_ENC_KEY` — a 32-byte key, base64. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
  - `GOOGLE_OAUTH_REDIRECT` — `https://my.hamzehhamdan.com/api/google/callback` (and a localhost variant for dev). *(This is the **connector** redirect — distinct from the Supabase-Auth login callback; see the reconciliation section.)*
  - `GCAL_CLIENT_ID` — the connector OAuth client id (Task 9 uses it alongside the already-set `GCAL_CLIENT_SECRET`). Not secret, but keep it out of `NEXT_PUBLIC_`.
- [ ] **P2. Google Cloud console (connector OAuth client):** on the existing OAuth client, add the connector redirect URI above and add scopes `https://www.googleapis.com/auth/calendar.readonly`, `https://www.googleapis.com/auth/gmail.metadata`, `https://www.googleapis.com/auth/gmail.compose`. Keep the app in "testing" with your account as the sole test user. (Gmail scopes are used by People/B; requesting them now avoids a second consent.)
- [ ] **P3. Google LOGIN provider (already configured in the deploy chat — verify):** Supabase → Authentication → Providers → **Google** is enabled with a Google OAuth client, and that client has `https://<ref>.supabase.co/auth/v1/callback` as an Authorized redirect URI in Google Cloud. This is a **separate** concern from P2's connector client. Used by Task 16.

---

## Files created by this plan

- `components/dashboard/ui/` — `Rail.tsx`, `ViewHeader.tsx`, `SectionHeader.tsx`, `Card.tsx`, `Segmented.tsx`, `Badge.tsx`, `Avatar.tsx`, `Ring.tsx`, `Modal.tsx`, `MonoLabel.tsx`, `index.ts`.
- `lib/dashboard/ring.ts` (+ test) — progress-ring geometry.
- `lib/crypto.ts` (+ test) — AES-GCM token encryption.
- `lib/dashboard/state-schema.ts` (+ test) — `/api/state` payload validation.
- `lib/dashboard/useAppState.ts` — client sync hook.
- `lib/google.ts` — OAuth + access-token minting.
- `app/api/state/route.ts`, `app/api/ai/route.ts`, `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts`, `app/api/calendar/events/route.ts`.
- `app/auth/callback/route.ts` (Supabase-Auth OAuth code exchange for Google **login**, Task 16).
- **`app_state` + `google_tokens` tables appended to `supabase/schema.sql`** (NOT `supabase/migrations/…` — that dir was removed in A0; see reconciliation).
- Rewrites `components/dashboard/Shell.tsx`; adds `components/dashboard/HomeView.tsx`; restyles `components/dashboard/CommandPalette.tsx`; adds a `signout` server action + updates `app/login/page.tsx` (Google-login button, Task 16).
- Adds `--crimson` tokens to `app/globals.css`; adds a **CSP** to `next.config.ts` (Task 18).

---

## Task 1: Dashboard color token + Tailwind confirm

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add crimson tokens** inside the existing `@layer base { :root { … } }` block in `app/globals.css`:

```css
--crimson: 350 71% 38%;            /* #A51C30 */
--crimson-tint: 351 60% 96%;       /* #faf0f1 */
--rail: 40 33% 97%;                /* #f9f8f6 warm off-white */
--hairline: 20 12% 92%;            /* #f0eeea inner rows */
```

- [ ] **Step 2: Expose them to Tailwind** in the `@theme` block (top of the file):

```css
--color-crimson: hsl(var(--crimson));
--color-crimson-tint: hsl(var(--crimson-tint));
--color-rail: hsl(var(--rail));
--color-hairline: hsl(var(--hairline));
```

- [ ] **Step 3: Verify** the fonts are already global (they are — `app/layout.tsx` sets `--font-playfair`, `--font-geist-sans`, `--font-geist-mono` on `<body>`). No change needed.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): dashboard crimson/stone design tokens"
```

---

## Task 2: Ring geometry (pure, TDD)

The progress ring is used across Coach; its dash math is pure and testable.

**Files:**
- Create: `lib/dashboard/ring.ts`, `test/ring.test.ts`

- [ ] **Step 1: Failing test — `test/ring.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { ringGeometry } from "../lib/dashboard/ring";

describe("ringGeometry", () => {
  it("clamps pct to 0..100", () => {
    expect(ringGeometry(-5, 40).offset).toBeCloseTo(ringGeometry(0, 40).offset);
    expect(ringGeometry(150, 40).offset).toBeCloseTo(ringGeometry(100, 40).offset);
  });
  it("full circle at 0%, no offset at 100%", () => {
    const zero = ringGeometry(0, 40);
    expect(zero.offset).toBeCloseTo(zero.circumference, 3);
    expect(ringGeometry(100, 40).offset).toBeCloseTo(0, 3);
  });
});
```

- [ ] **Step 2: Run → fail.** `npm test -- test/ring.test.ts` → FAIL.

- [ ] **Step 3: Implement `lib/dashboard/ring.ts`**

```ts
export function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n || 0)));
}

export function ringGeometry(pct: number, size = 40) {
  const p = clampPct(pct);
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - p / 100);
  return { p, r, circumference, offset, center: size / 2 };
}
```

- [ ] **Step 4: Run → pass.** `npm test -- test/ring.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard/ring.ts test/ring.test.ts
git commit -m "feat(ui): progress-ring geometry"
```

---

## Task 3: Presentational primitives

Small, focused components. Verified in the browser preview (Task 15), not unit-tested (pure presentation).

**Files:**
- Create: `components/dashboard/ui/{MonoLabel,Card,SectionHeader,ViewHeader,Segmented,Badge,Avatar,Ring,Modal,Rail}.tsx`, `components/dashboard/ui/index.ts`

- [ ] **Step 1: `MonoLabel.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function MonoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400", className)}
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2: `Card.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[10px] border border-stone-200 bg-white", className)}>{children}</div>;
}
```

- [ ] **Step 3: `SectionHeader.tsx`** (the `01 — Focus` + hairline pattern)

```tsx
export function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5 mb-3.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-400 whitespace-nowrap"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
        {index} — {label}
      </span>
      <span className="flex-1 h-px bg-[#f0eeea]" />
    </div>
  );
}
```

- [ ] **Step 4: `ViewHeader.tsx`** (mono meta → Playfair title → divider)

```tsx
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function ViewHeader({ meta, title, actions }: { meta?: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          {meta && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1.5"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{meta}</p>}
          <h1 className="text-[26px] font-medium text-stone-900" style={serif}>{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
      <div className="h-px bg-stone-200 mt-5" />
    </div>
  );
}
```

- [ ] **Step 5: `Segmented.tsx`** (bordered control; crimson active label)

```tsx
"use client";
export function Segmented<T extends string>({ options, value, onChange }:
  { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-[#f0eeea] p-[3px]" role="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-md transition-colors ${
              on ? "bg-white text-[#A51C30] shadow-[0_1px_1px_rgba(0,0,0,0.04)]" : "text-stone-400"}`}
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: `Badge.tsx`** (tone-driven, no rainbow)

```tsx
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "attention" | "neutral" }) {
  const cls = tone === "attention" ? "text-[#A51C30] bg-[#faf0f1]" : "text-stone-500 bg-[#f0eeea]";
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.1em] rounded px-2 py-[3px] ${cls}`}
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
      {children}
    </span>
  );
}
```

- [ ] **Step 7: `Avatar.tsx`**

```tsx
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function Avatar({ initials, tone = "neutral", src, size = 34 }:
  { initials: string; tone?: "attention" | "neutral"; src?: string | null; size?: number }) {
  const bg = tone === "attention" ? "#faf0f1" : "#f0eeea";
  const fg = tone === "attention" ? "#A51C30" : "#78716c";
  if (src) return <div style={{ width: size, height: size, backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }} className="rounded-full shrink-0" />;
  return (
    <div style={{ width: size, height: size, background: bg, color: fg, ...serif }}
      className="rounded-full shrink-0 flex items-center justify-center text-[13px] font-medium">
      {initials}
    </div>
  );
}
```

- [ ] **Step 8: `Ring.tsx`** (uses Task 2 geometry)

```tsx
import { ringGeometry } from "@/lib/dashboard/ring";
export function Ring({ pct, size = 40 }: { pct: number; size?: number }) {
  const g = ringGeometry(pct, size);
  const stroke = g.p >= 100 ? "#1c1917" : "#A51C30";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${g.p}%`}>
      <circle cx={g.center} cy={g.center} r={g.r} fill="none" stroke="#e7e5e4" strokeWidth="5" />
      <circle cx={g.center} cy={g.center} r={g.r} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={g.circumference} strokeDashoffset={g.offset} transform={`rotate(-90 ${g.center} ${g.center})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.3} fontWeight="500"
        fontFamily="var(--font-playfair), serif" fill="#1c1917">{g.p}</text>
    </svg>
  );
}
```

- [ ] **Step 9: `Modal.tsx`** (normal-flow scrim; Playfair title; ESC/backdrop close)

```tsx
"use client";
import { useEffect } from "react";
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-[rgba(40,35,22,0.45)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[620px] max-h-[88vh] flex flex-col rounded-[14px] border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-[18px] py-[15px] border-b border-stone-200">
          <span className="text-[17px] font-medium text-stone-900" style={serif}>{title}</span>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-[#A51C30] text-2xl leading-none">×</button>
        </div>
        <div className="overflow-auto p-[18px]">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: `Rail.tsx`** (left nav; numbered; crimson active)

```tsx
"use client";
import { cn } from "@/lib/utils";
export type ViewKey = "home" | "people" | "coach" | "brain";
const ITEMS: { key: ViewKey; n: string; label: string }[] = [
  { key: "home", n: "01", label: "Home" }, { key: "people", n: "02", label: "People" },
  { key: "coach", n: "03", label: "Coach" }, { key: "brain", n: "04", label: "Brain" },
];
export function Rail({ active, onSelect, onCommand, onSignOut }:
  { active: ViewKey; onSelect: (v: ViewKey) => void; onCommand: () => void; onSignOut: () => void }) {
  const mono = { fontFamily: "var(--font-geist-mono), monospace" };
  return (
    <nav className="w-[158px] shrink-0 border-r border-stone-200 bg-rail py-[22px] flex flex-col">
      <div className="px-[18px] pb-[22px]">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-stone-900" style={mono}>HH<span className="text-[#A51C30]">.</span></span>
      </div>
      {ITEMS.map((it) => {
        const on = it.key === active;
        return (
          <button key={it.key} onClick={() => onSelect(it.key)}
            className={cn("flex gap-2 px-[18px] py-[9px] border-l-2 text-left", on ? "border-[#A51C30] bg-white" : "border-transparent")}>
            <span className="font-mono text-[11px]" style={mono} >{/* number */}<span className={on ? "text-[#A51C30]" : "text-stone-300"}>{it.n}</span></span>
            <span className={cn("font-mono text-[11px] uppercase tracking-[0.16em]", on ? "text-stone-900 font-medium" : "text-stone-400")} style={mono}>{it.label}</span>
          </button>
        );
      })}
      <div className="mt-auto mx-[18px] pt-4 border-t border-[#f0eeea] flex flex-col gap-3">
        <button onClick={onCommand} className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={mono}>⌘K Command</button>
        <button onClick={onSignOut} className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>Sign out</button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 11: barrel `components/dashboard/ui/index.ts`**

```ts
export * from "./MonoLabel"; export * from "./Card"; export * from "./SectionHeader";
export * from "./ViewHeader"; export * from "./Segmented"; export * from "./Badge";
export * from "./Avatar"; export * from "./Ring"; export * from "./Modal"; export * from "./Rail";
```

- [ ] **Step 12: Typecheck + commit**

Run: `npx tsc --noEmit` → no errors.

```bash
git add components/dashboard/ui/
git commit -m "feat(ui): editorial dashboard primitives (rail, cards, segmented, ring, modal, …)"
```

---

## Task 4: `app_state` table (OPS-run SQL)

> **A0 note:** there is no `supabase/migrations/` dir (removed in A0). **Append this block to `supabase/schema.sql`** instead, and make it idempotent to match that file's style — `create table if not exists` (already), and `drop policy if exists "…" ; create policy "…"` for each of the four policies below. Hamzeh runs the appended block in the Supabase SQL editor.

**Files:**
- Modify: `supabase/schema.sql` (append the `app_state` table + policies)

- [ ] **Step 1: Write it** (idempotent — add `drop policy if exists` before each `create policy`)

```sql
create table if not exists public.app_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  app        text not null check (app in ('lifeCRM','execCoach')),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table public.app_state enable row level security;
create policy "state_select" on public.app_state for select using (auth.uid() = user_id);
create policy "state_insert" on public.app_state for insert with check (auth.uid() = user_id);
create policy "state_update" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "state_delete" on public.app_state for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: OPS — run in Supabase SQL editor.** Verify: `select relrowsecurity from pg_class where relname='app_state';` → `true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): app_state jsonb table with strict RLS"
```

---

## Task 5: `/api/state` with payload validation (TDD the validator)

**Files:**
- Create: `lib/dashboard/state-schema.ts`, `test/state-schema.test.ts`, `app/api/state/route.ts`

- [ ] **Step 1: (skip) zod is already a dependency** (`zod@^4.3.6` in package.json). No install needed — and note the validators below are hand-rolled and don't import zod, so no package changes are committed in this task.

- [ ] **Step 2: Failing test — `test/state-schema.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { validateStateWrite, MAX_STATE_BYTES } from "../lib/dashboard/state-schema";

describe("validateStateWrite", () => {
  it("accepts a small object for a known app", () => {
    expect(validateStateWrite("lifeCRM", { contacts: [] }).ok).toBe(true);
  });
  it("rejects an unknown app", () => {
    expect(validateStateWrite("evil", {}).ok).toBe(false);
  });
  it("rejects a non-object payload", () => {
    expect(validateStateWrite("lifeCRM", [1, 2, 3]).ok).toBe(false);
  });
  it("rejects an oversized payload", () => {
    const big = { blob: "x".repeat(MAX_STATE_BYTES + 10) };
    expect(validateStateWrite("lifeCRM", big).ok).toBe(false);
  });
});
```

- [ ] **Step 3: Run → fail.**

- [ ] **Step 4: Implement `lib/dashboard/state-schema.ts`**

```ts
export const MAX_STATE_BYTES = 2 * 1024 * 1024; // 2 MB per app document
const APPS = new Set(["lifeCRM", "execCoach"]);

export type StateWriteResult = { ok: true } | { ok: false; status: 400; reason: string };

export function validateStateWrite(app: string, data: unknown): StateWriteResult {
  if (!APPS.has(app)) return { ok: false, status: 400, reason: "unknown app" };
  if (data === null || typeof data !== "object" || Array.isArray(data))
    return { ok: false, status: 400, reason: "data must be a JSON object" };
  const size = Buffer.byteLength(JSON.stringify(data), "utf8");
  if (size > MAX_STATE_BYTES) return { ok: false, status: 400, reason: "payload too large" };
  return { ok: true };
}
```

- [ ] **Step 5: Run → pass.**

- [ ] **Step 6: Implement `app/api/state/route.ts`**

```ts
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { validateStateWrite } from "@/lib/dashboard/state-schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const app = new URL(req.url).searchParams.get("app") ?? "";
  if (validateStateWrite(app, {}).ok === false && app !== "lifeCRM" && app !== "execCoach")
    return Response.json({ error: "unknown app" }, { status: 400 });
  const { data } = await gate.supabase.from("app_state").select("data").eq("user_id", gate.userId).eq("app", app).maybeSingle();
  return Response.json({ data: data?.data ?? {} });
}

export async function PUT(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:state`, 120, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const app = new URL(req.url).searchParams.get("app") ?? "";
  const body = await req.json().catch(() => null);
  const v = validateStateWrite(app, body?.data);
  if (!v.ok) return Response.json({ error: v.reason }, { status: v.status });
  const { error } = await gate.supabase.from("app_state")
    .upsert({ user_id: gate.userId, app, data: body.data, updated_at: new Date().toISOString() });
  if (error) { console.warn("state: upsert failed"); return Response.json({ error: "save failed" }, { status: 500 }); }
  return Response.json({ ok: true });
}
```

- [ ] **Step 7: Run all tests + typecheck + commit**

```bash
npm test && npx tsc --noEmit
git add lib/dashboard/state-schema.ts test/state-schema.test.ts app/api/state/route.ts
git commit -m "feat(api): /api/state with validated per-user jsonb documents"
```

---

## Task 6: `useAppState` client hook

In-memory source of truth in the client, hydrated from `/api/state`, debounced save. No sensitive localStorage.

**Files:**
- Create: `lib/dashboard/useAppState.ts`

- [ ] **Step 1: Implement**

```ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAppState<T extends object>(app: "lifeCRM" | "execCoach", seed: T) {
  const [state, setState] = useState<T>(seed);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/state?app=${app}`)
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((j) => { if (alive) { if (j.data && Object.keys(j.data).length) setState(j.data as T); setLoaded(true); } })
      .catch(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, [app]);

  const persist = useCallback((next: T) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/state?app=${app}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: next }),
      }).catch(() => {});
    }, 500);
  }, [app]);

  const update = useCallback((updater: (prev: T) => T) => {
    setState((prev) => { const next = updater(prev); persist(next); return next; });
  }, [persist]);

  return { state, setState: update, loaded };
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add lib/dashboard/useAppState.ts
git commit -m "feat(state): useAppState hook (server-synced, in-memory, debounced)"
```

---

## Task 7: AES-GCM token crypto (TDD)

**Files:**
- Create: `lib/crypto.ts`, `test/crypto.test.ts`

- [ ] **Step 1: Failing test — `test/crypto.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encryptToken, decryptToken } from "../lib/crypto";

beforeAll(() => { process.env.TOKEN_ENC_KEY = randomBytes(32).toString("base64"); });

describe("token crypto", () => {
  it("round-trips", () => {
    const s = "1//refresh-token-value";
    expect(decryptToken(encryptToken(s))).toBe(s);
  });
  it("produces a versioned, unique ciphertext per call (random IV)", () => {
    expect(encryptToken("x")).not.toBe(encryptToken("x"));
    expect(encryptToken("x").startsWith("v1:")).toBe(true);
  });
  it("rejects tampered ciphertext", () => {
    const c = encryptToken("secret").replace(/.$/, (ch) => (ch === "A" ? "B" : "A"));
    expect(() => decryptToken(c)).toThrow();
  });
});
```

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement `lib/crypto.ts`**

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key(): Buffer {
  const b = Buffer.from(process.env.TOKEN_ENC_KEY ?? "", "base64");
  if (b.length !== 32) throw new Error("TOKEN_ENC_KEY must be 32 bytes (base64)");
  return b;
}

/** Returns "v1:<iv>:<tag>:<ciphertext>" (all base64). Unique random IV per call. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptToken(payload: string): string {
  const [v, ivB, tagB, ctB] = payload.split(":");
  if (v !== "v1") throw new Error("unsupported token version");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
  d.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([d.update(Buffer.from(ctB, "base64")), d.final()]).toString("utf8");
}
```

- [ ] **Step 4: Run → pass. Commit.**

```bash
npm test -- test/crypto.test.ts
git add lib/crypto.ts test/crypto.test.ts
git commit -m "feat(sec): AES-256-GCM token encryption (versioned, random IV, AEAD)"
```

---

## Task 8: `google_tokens` table (OPS-run SQL)

> **A0 note:** as with Task 4 — **append to `supabase/schema.sql`** (no `migrations/` dir), idempotent (`drop policy if exists` before `create policy`).

**Files:**
- Modify: `supabase/schema.sql` (append the `google_tokens` table + policy)

- [ ] **Step 1: Write it** (idempotent)

```sql
create table if not exists public.google_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  enc_refresh   text not null,   -- AES-GCM ciphertext (never plaintext, never to client)
  scope         text,
  updated_at    timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
create policy "gt_owner" on public.google_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: OPS — run in Supabase.** Verify RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): encrypted google_tokens table with RLS"
```

---

## Task 9: Google OAuth (server code flow) + access-token minting

**Files:**
- Create: `lib/google.ts`, `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts`

- [ ] **Step 1: `lib/google.ts`**

```ts
import { encryptToken, decryptToken } from "@/lib/crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.compose",
];

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GCAL_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string): Promise<{ refresh_token?: string; scope?: string }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GCAL_CLIENT_ID!, client_secret: process.env.GCAL_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT!, grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new Error("token exchange failed");
  return r.json();
}

export async function storeRefreshToken(supabase: SupabaseClient, userId: string, refresh: string, scope?: string) {
  await supabase.from("google_tokens").upsert({
    user_id: userId, enc_refresh: encryptToken(refresh), scope: scope ?? null, updated_at: new Date().toISOString(),
  });
}

/** Mint a short-lived access token from the stored (encrypted) refresh token. Returns null if not connected. */
export async function getGoogleAccessToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("google_tokens").select("enc_refresh").eq("user_id", userId).maybeSingle();
  if (!data?.enc_refresh) return null;
  const refresh = decryptToken(data.enc_refresh);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GCAL_CLIENT_ID!, client_secret: process.env.GCAL_CLIENT_SECRET!,
      refresh_token: refresh, grant_type: "refresh_token",
    }),
  });
  if (!r.ok) { console.warn("google: refresh failed"); return null; } // refresh-failure path
  const j = await r.json();
  return j.access_token ?? null;
}
```

- [ ] **Step 2: `app/api/google/connect/route.ts`** (start consent; `state` = user id, signed by session)

```ts
import { requireUser } from "@/lib/supabase-server";
import { authUrl } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  return NextResponse.redirect(authUrl(gate.userId));
}
```

- [ ] **Step 3: `app/api/google/callback/route.ts`**

```ts
import { requireUser } from "@/lib/supabase-server";
import { exchangeCode, storeRefreshToken } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== gate.userId) return NextResponse.redirect(new URL("/dashboard?google=error", req.url));
  try {
    const tok = await exchangeCode(code);
    if (tok.refresh_token) await storeRefreshToken(gate.supabase, gate.userId, tok.refresh_token, tok.scope);
    return NextResponse.redirect(new URL("/dashboard?google=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard?google=error", req.url));
  }
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add lib/google.ts app/api/google/
git commit -m "feat(connectors): server-side google oauth with encrypted refresh tokens"
```

---

## Task 10: `/api/calendar/events` (thin-slice connector)

**Files:**
- Create: `app/api/calendar/events/route.ts`

- [ ] **Step 1: Implement**

```ts
import { requireUser } from "@/lib/supabase-server";
import { getGoogleAccessToken } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, events: [] });
  const u = new URL(req.url);
  const timeMin = u.searchParams.get("timeMin") ?? new Date(Date.now() - 365 * 864e5).toISOString();
  const timeMax = u.searchParams.get("timeMax") ?? new Date(Date.now() + 90 * 864e5).toISOString();
  const api = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  api.search = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250" }).toString();
  const r = await fetch(api, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) { console.warn("calendar: fetch failed"); return Response.json({ connected: true, events: [] }); }
  const j = await r.json();
  const events = (j.items ?? []).map((e: any) => ({
    summary: e.summary ?? "(busy)", start: e.start?.dateTime ?? e.start?.date, end: e.end?.dateTime ?? e.end?.date,
    attendees: (e.attendees ?? []).map((a: any) => ({ email: a.email, self: !!a.self })),
  }));
  return Response.json({ connected: true, events });
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/api/calendar/events/route.ts
git commit -m "feat(connectors): /api/calendar/events via minted access token"
```

---

## Task 11: `/api/ai` — Claude (TDD the request validator)

**Files:**
- Create: `lib/dashboard/ai-schema.ts`, `test/ai-schema.test.ts`, `app/api/ai/route.ts`

- [ ] **Step 1: Install SDK.** `npm install @anthropic-ai/sdk`

- [ ] **Step 2: Failing test — `test/ai-schema.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseAiRequest } from "../lib/dashboard/ai-schema";

describe("parseAiRequest", () => {
  it("accepts a task + short prompt", () => {
    const r = parseAiRequest({ task: "draft_checkin", prompt: "hi" });
    expect(r.ok).toBe(true);
  });
  it("rejects unknown task", () => { expect(parseAiRequest({ task: "nuke", prompt: "x" }).ok).toBe(false); });
  it("rejects oversized prompt", () => { expect(parseAiRequest({ task: "coach_chat", prompt: "x".repeat(60_000) }).ok).toBe(false); });
});
```

- [ ] **Step 3: Run → fail.**

- [ ] **Step 4: Implement `lib/dashboard/ai-schema.ts`**

```ts
const TASKS = new Set(["draft_checkin", "group_update", "coach_chat", "suggest_tasks", "suggest_goals", "intake", "ask_people", "suggest_tags"]);
export const MAX_PROMPT = 40_000;
export type AiRequest = { task: string; prompt: string; system?: string };
export type ParseResult = { ok: true; value: AiRequest } | { ok: false; reason: string };

export function parseAiRequest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, reason: "bad body" };
  const b = body as Record<string, unknown>;
  if (typeof b.task !== "string" || !TASKS.has(b.task)) return { ok: false, reason: "unknown task" };
  if (typeof b.prompt !== "string" || b.prompt.length === 0) return { ok: false, reason: "missing prompt" };
  if (b.prompt.length > MAX_PROMPT) return { ok: false, reason: "prompt too large" };
  const system = typeof b.system === "string" ? b.system.slice(0, MAX_PROMPT) : undefined;
  return { ok: true, value: { task: b.task, prompt: b.prompt, system } };
}
```

- [ ] **Step 5: Run → pass.**

- [ ] **Step 6: Implement `app/api/ai/route.ts`**

> Safety contract (enforced by callers in B/C): this route only returns **text**. It performs no side effects. Any action that sends/writes (Gmail draft, etc.) is a separate route requiring explicit human confirmation. Retrieved/email content passed in `prompt` is treated as untrusted data, delimited by the caller.

```ts
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { parseAiRequest } from "@/lib/dashboard/ai-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:ai`, 30, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseAiRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: parsed.value.system ?? "You are a concise, warm assistant. Return only the requested text.",
      messages: [{ role: "user", content: parsed.value.prompt }],
    });
    const text = msg.content.filter((c) => c.type === "text").map((c: any) => c.text).join("").trim();
    return Response.json({ text });
  } catch {
    console.warn("ai: generation failed");
    return Response.json({ error: "AI unavailable" }, { status: 502 });
  }
}
```

- [ ] **Step 7: Run all tests + typecheck + commit**

```bash
npm test && npx tsc --noEmit
git add lib/dashboard/ai-schema.ts test/ai-schema.test.ts app/api/ai/route.ts package.json package-lock.json
git commit -m "feat(ai): /api/ai text route on Claude (validated, rate-limited, no side effects)"
```

---

## Task 12: DashboardShell (rail + view switching + command palette)

> **A0 note — sign-out must be server-side.** The Step-1 code below calls `createSupabaseBrowserClient().auth.signOut()`, which is a **no-op under A0's HttpOnly cookies** (JS can't clear an HttpOnly cookie → the user stays logged in). Replace it with a **`signout` server action** (a `"use server"` fn that builds `createServerSupabase()`, calls `supabase.auth.signOut()` to clear the cookie server-side, then `redirect("/login")`), and have the Rail's sign-out button submit that action. Do not use the browser client for sign-out.

**Files:**
- Rewrite: `components/dashboard/Shell.tsx`
- Create: `app/dashboard/actions.ts` (or `app/login/actions.ts`) — `signout` server action
- Modify: `components/dashboard/CommandPalette.tsx` (restyle to tokens — keep its logic)

- [ ] **Step 1: Rewrite `components/dashboard/Shell.tsx`**

```tsx
"use client";
import { useState, useCallback } from "react";
import { Toaster } from "sonner";
import { Rail, type ViewKey } from "./ui";
import { HomeView } from "./HomeView";
import { signout } from "@/app/dashboard/actions"; // A0: server action — HttpOnly cookies can't be cleared from JS

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{name} — coming in the next milestone</div>;
}

export function DashboardShell() {
  const [view, setView] = useState<ViewKey>("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  // Sign-out runs server-side (HttpOnly cookie can't be cleared from JS) — invoke the
  // `signout` server action (app/dashboard/actions.ts: createServerSupabase().auth.signOut() → redirect("/login")).
  const signOut = useCallback(() => { void signout(); }, []);

  return (
    <div className="flex h-screen w-full bg-[#f9f8f6]">
      <Rail active={view} onSelect={setView} onCommand={() => setCmdOpen(true)} onSignOut={signOut} />
      <main className="flex-1 overflow-auto">
        {view === "home" && <HomeView onNavigate={setView} />}
        {view === "people" && <Placeholder name="People" />}
        {view === "coach" && <Placeholder name="Coach" />}
        {view === "brain" && <Placeholder name="Brain" />}
      </main>
      <Toaster position="bottom-right" />
      {/* CommandPalette mounts here once restyled; opened via cmdOpen */}
    </div>
  );
}
```

- [ ] **Step 2: Restyle `CommandPalette.tsx`** — keep all existing logic; swap dark zinc/glass classes for the editorial tokens (white surface, `border-stone-200`, crimson active row, Geist Mono labels). Wire its open state to the Shell's `cmdOpen`/`setCmdOpen` (props or the existing `open-command-palette` window event it already listens for). Do not change its keyboard handling.

- [ ] **Step 3: Build.** `npm run build` → success.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/Shell.tsx components/dashboard/CommandPalette.tsx
git commit -m "feat(shell): editorial dashboard shell with rail + view switching"
```

---

## Task 13: HomeView (editorial overview)

Reads both app documents; shows the mono-date → Playfair greeting → numbered sections. Empty-safe until B/C populate data.

**Files:**
- Create: `components/dashboard/HomeView.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useEffect, useState } from "react";
import { ViewHeader, SectionHeader } from "./ui";
import type { ViewKey } from "./ui";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

export function HomeView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [crm, setCrm] = useState<any>({});
  const [coach, setCoach] = useState<any>({});
  useEffect(() => {
    fetch("/api/state?app=lifeCRM").then((r) => r.json()).then((j) => setCrm(j.data ?? {})).catch(() => {});
    fetch("/api/state?app=execCoach").then((r) => r.json()).then((j) => setCoach(j.data ?? {})).catch(() => {});
  }, []);

  const contacts = Array.isArray(crm.contacts) ? crm.contacts.length : 0;
  const goals = Array.isArray(coach.goals) ? coach.goals.length : 0;
  const now = new Date();
  const meta = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="p-7 md:p-8 max-w-3xl">
      <ViewHeader meta={meta} title={`Good ${now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, Hamzeh.`} />
      <SectionHeader index="01" label="Momentum" />
      <div className="flex gap-9 mb-8">
        <button onClick={() => onNavigate("people")} className="text-left">
          <div className="text-[28px] leading-none font-medium text-stone-900" style={serif}>{contacts}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 mt-1.5" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>Contacts</div>
        </button>
        <button onClick={() => onNavigate("coach")} className="text-left">
          <div className="text-[28px] leading-none font-medium text-stone-900" style={serif}>{goals}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 mt-1.5" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>Goals</div>
        </button>
      </div>
      <SectionHeader index="02" label="Today" />
      <p className="text-[13px] text-stone-500">People and Coach light up here once those apps land (B/C).</p>
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add components/dashboard/HomeView.tsx
git commit -m "feat(home): editorial overview reading app_state"
```

---

## Task 14: Mobile shell

**Files:**
- Modify: `components/dashboard/Shell.tsx`

- [ ] **Step 1: Add a responsive rail.** On `< md`, hide the fixed `Rail` and render a top bar with a menu button that opens the existing `Sheet` primitive (`@/components/ui/sheet`) containing the same nav items. Keep `Rail` for `md+`. Use `hidden md:flex` on `Rail` and a `md:hidden` top bar.

- [ ] **Step 2: Verify with preview resize (Task 15).**

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/Shell.tsx
git commit -m "feat(shell): mobile rail via sheet"
```

---

## Task 15: End-to-end verification (thin slice) + preview

- [ ] **Step 1: Full test + build.** `npm test && npm run build` → all green.

- [ ] **Step 2: Preview the shell.** Start the dev server (preview tooling), log in, and confirm: rail renders with crimson active state; Home shows the Playfair greeting + mono date + metrics; switching to People/Coach/Brain shows placeholders; `⌘K` opens the restyled palette. Capture a screenshot.

- [ ] **Step 3: Thin-slice spine check** (logged in, in the browser console or via authed curl):

```
GET /api/state?app=lifeCRM            → { "data": {} }         (200)
PUT /api/state?app=lifeCRM {data:{contacts:[]}}  → { ok: true } (200); GET again returns it
GET /api/calendar/events              → { connected:false, events:[] } before OAuth; connect via /api/google/connect, then events populate
POST /api/ai {task:"coach_chat",prompt:"say hi"} → { text: "…" }
```

Unauthenticated calls to each return 401.

- [ ] **Step 4: Confirm no secret in the client bundle.** `grep -rn "ANTHROPIC_API_KEY\|TOKEN_ENC_KEY\|GCAL_CLIENT_SECRET" .next/static 2>/dev/null` → no matches.

- [ ] **Step 5: `/security-review`** on the branch; triage findings.

- [ ] **Step 6: Final commit**

```bash
git commit --allow-empty -m "chore: A1 shell + spine verified (state, calendar, ai, encrypted tokens)"
```

---

## Task 16: Login page — email/password + "Continue with Google" (NEW, from the deploy chat)

Add Google login alongside the existing email/password form. This is Supabase-Auth OAuth (login), NOT the calendar/Gmail connector (Tasks 8–10). *Outline only — implementer writes the code following A0's server-side-auth pattern.*

**Files:**
- Modify: `app/login/page.tsx` (add a "Continue with Google" button; keep the `<form action={login}>` email/password form).
- Create: `app/auth/callback/route.ts` (GET) — the Supabase-Auth OAuth code-exchange handler.
- (Optional) a small `"use client"` handler for the Google button.

- [ ] **Step 1: Google button.** On click, call the browser client's `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: \`${location.origin}/auth/callback\` } })`. (This only *initiates* the redirect to Google — it doesn't need to read the HttpOnly session, and @supabase/ssr stores the PKCE verifier in a cookie the server reads at the callback, so it's compatible with the HttpOnly model.)
- [ ] **Step 2: `app/auth/callback/route.ts`.** Read `?code`, `const supabase = await createServerSupabase(); const { error } = await supabase.auth.exchangeCodeForSession(code)` (this sets the HttpOnly session cookie via A0's `setAll`). On success redirect to `/dashboard`; on error redirect to `/login?message=...` (the as-built `app/login/page.tsx` renders the `?message` param, not `?error` — use `message`, or update the page to render `error`).
- [ ] **Step 2b: Middleware carve-out for `/auth` (REQUIRED — or Google login breaks).** The callback runs while still UNAUTHENTICATED (the session is only set *by* the exchange). But as-built `middleware.ts` gates every path on the `my.` subdomain (`isDashboard = pathname.startsWith("/dashboard") || subdomain === "my"`) and its `config.matcher` does NOT exclude `/auth` — so `my.hamzehhamdan.com/auth/callback` gets redirected to `/login` before `exchangeCodeForSession` can run. Fix: let `/auth` through unauthenticated — either add `/auth` to the matcher exclusion, or short-circuit before the gate with `if (request.nextUrl.pathname.startsWith("/auth")) return response;`. Verify the callback resolves while logged out.
- [ ] **Step 3: Enforce `ALLOWED_EMAIL` cleanly.** After `exchangeCodeForSession`, check the signed-in user's email against `process.env.ALLOWED_EMAIL` (reuse `gateResult`); if it doesn't match, `supabase.auth.signOut()` and redirect to `/login?message=Unauthorized account`. (Middleware + `requireUser` already block non-matching users from data, but signing out here avoids a confusing half-logged-in state.)
- [ ] **Step 4: Verify** (preview + prod): email/password still works; "Continue with Google" logs you in and lands on `/dashboard` with an HttpOnly session; a non-`ALLOWED_EMAIL` Google account is bounced to `/login`. Prereq P3 (Supabase Google provider) must be configured.
- [ ] **Step 5: Commit** — `feat(auth): add Google login (Supabase Auth) alongside email/password`.

---

## Task 17: Restore the marketing site (GitHub Pages) without leaking the dashboard (NEW — task chip `task_3d7f3463`)

`hamzehhamdan.com` (GitHub Pages, separate from the Netlify-hosted `my.`) has been failing to build since ~Jan 31 and serves a stale snapshot. Fix it AND make sure the static export cannot publish the authenticated surface.

**Files:**
- Modify: `.github/workflows/deploy.yml` and/or `next.config.ts` (export config); the `/consulting` OG-image route as needed.

- [ ] **Step 1: Reproduce the failure.** `actions/configure-pages@…` injects `output: "export"`; the build fails on a dynamic route — `Error: export const dynamic="force-static"/revalidate not configured on route "/consulting/opengraph-image…"`. The four `app/api/*` route handlers (`force-dynamic`) are the same incompatibility class.
- [ ] **Step 2: Make the marketing surface exportable.** Configure the `/consulting` opengraph-image route to be static (or remove it from the export), and ensure the export doesn't try to emit the dynamic API routes.
- [ ] **Step 3: SECURITY — exclude the authenticated surface from the export.** The Pages host runs NO middleware, so an exported `/dashboard` would be a plain unauthenticated static page. Exclude `/dashboard`, `/login`, `/auth`, and `/api` from `./out` (e.g. route-group split, `generateStaticParams` gating, or a post-build prune), AND add a CI assertion that **fails the Pages job if `out/dashboard` exists**.
- [ ] **Step 4: Verify.** Pages build green; `hamzehhamdan.com` republishes current marketing content; `curl https://hamzehhamdan.com/dashboard` does NOT serve a dashboard; the CI guard fails if `/dashboard` ever leaks in.
- [ ] **Step 5: Commit** — `fix(deploy): restore Pages marketing build; exclude dashboard/auth/api from static export`.

---

## Task 18: Content-Security-Policy (deferred from A0 Task 10)

A0 shipped the other security headers but left CSP for A1, once the shell's real asset/script origins are known.

**Files:**
- Modify: `next.config.ts` (add `Content-Security-Policy` to the headers block).

- [ ] **Step 1: Inventory the origins the shell actually uses.** self; inline styles (the primitives in Task 3 use many `style={…}` attributes → `style-src` needs `'unsafe-inline'` unless refactored); the Supabase project URL (browser client / auth) in `connect-src`; `https://accounts.google.com` for the Google-login redirect (navigation/`form-action`); Plausible analytics domain if the spec's analytics land (`script-src`/`connect-src`); `data:`/`blob:` for avatars/images as needed; `frame-ancestors 'none'` (matches X-Frame-Options: DENY).
- [ ] **Step 2: Add it report-only first.** Ship `Content-Security-Policy-Report-Only` on `/:path*`, load the live dashboard + login + Google OAuth + Brain, and confirm zero violations in the console.
- [ ] **Step 3: Enforce.** Switch to `Content-Security-Policy`. Re-verify the full app (dashboard, `⌘K`, login both methods, calendar connect, AI) works with no CSP breakage.
- [ ] **Step 4: Commit** — `feat(sec): content-security-policy for the dashboard shell`.

---

## Self-review notes (author)

- **Spec coverage:** §3 design system → Tasks 1–3; §4 shell/home/command-palette/mobile → Tasks 12–14; §5.2 `/api/state` + JSONB → Tasks 4–6; §5.4 per-route auth + rate limit + origin → reused from A0's `requireUser` + `lib/rate-limit`; §5.5 encrypted Google tokens + server OAuth + one connector → Tasks 7–10; AI on Claude → Task 11; §5.8 no-sensitive-localStorage + minimal egress + no-side-effect AI → Tasks 6 & 11 (contract documented). Gmail `search`/`draft` routes and the draft-confirmation UX land in **B (People)** on this same token spine; Brain restyle lands with its view.
- **Type consistency:** `ViewKey` defined once in `Rail.tsx`, imported everywhere; `requireUser` result shape matches A0; `useAppState` app names match the `app_state` CHECK constraint and `/api/state` validator.
- **Testable seams:** ring geometry, state validator, token crypto, and AI request validator are pure + unit-tested; the spine is exercised end-to-end in Task 15; presentational components are preview-verified.
- **CSP** is now an explicit deliverable → **Task 18** (was "deferred" in A0 Task 10). Gmail `search`/`draft` routes + the draft-confirmation UX still land in **B (People)** on this token spine; relational normalization stays out (JSONB app_state is sufficient).
- **A0 reconciliation (2026-07-13):** this plan was updated after A0 shipped — see the "⚠️ Reconciliation with A0" section at the top. Key deltas: the security spine (`requireUser`/`gateResult`/`rate-limit`/`ownsStore`) + headers + vitest setup already exist; `supabase/migrations/` is gone so app_state/google_tokens append to `supabase/schema.sql`; HttpOnly cookies force server-side sign-out (Task 12); Google **login** added (Task 16, distinct from the connector); marketing-site/Pages fix added (Task 17); Next is 16.2.10.
```
