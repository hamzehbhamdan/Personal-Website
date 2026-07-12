# Sub-project A1 — Design System, Shell & Secure Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the editorial dashboard foundation — the "blend" design-system primitives, the `Home / People / Coach / Brain` shell, and the secure server spine (`/api/state`, encrypted Google tokens + one live connector, `/api/ai` on Claude) — so the People (B) and Coach (C) ports drop straight onto it.

**Architecture:** Supabase-as-source-of-truth via a per-user JSONB `app_state` document behind `/api/state`; the artifacts' logic keeps an in-memory copy synced through a `useAppState` hook (no sensitive localStorage). All secrets/connectors are server-side: Google refresh tokens are AES-GCM-encrypted at rest, minted to short-lived access tokens per request; Claude powers AI via `/api/ai`. The UI is a left editorial rail switching between view components, styled with a small set of crimson/stone/Playfair/Geist-Mono primitives.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase (`@supabase/ssr`) · Tailwind v4 · Framer Motion · `@anthropic-ai/sdk` (Claude) · `zod` · Node `crypto` (AES-256-GCM) · Vitest.

**Depends on:** `2026-07-11-a0-security-hardening.md` must land first (this plan assumes `lib/supabase-server.ts` `requireUser()`, strict RLS, and `lib/rate-limit.ts` exist). Source spec: `docs/superpowers/specs/2026-07-11-my-dashboard-redesign-design.md` (§3, §4, §5.2–5.8). People (B) and Coach (C) plans follow this one.

---

## ⚠️ OPS PREFACE (Hamzeh)

- [ ] **P1. Add env vars** (server-only; **not** `NEXT_PUBLIC_`) locally and in Netlify:
  - `ANTHROPIC_API_KEY` — from console.anthropic.com.
  - `TOKEN_ENC_KEY` — a 32-byte key, base64. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
  - `GOOGLE_OAUTH_REDIRECT` — `https://my.hamzehhamdan.com/api/google/callback` (and a localhost variant for dev).
- [ ] **P2. Google Cloud console:** on the existing OAuth client, add the redirect URI above and add scopes `https://www.googleapis.com/auth/calendar.readonly`, `https://www.googleapis.com/auth/gmail.metadata`, `https://www.googleapis.com/auth/gmail.compose`. Keep the app in "testing" with your account as the sole test user. (Gmail scopes are used by People/B; requesting them now avoids a second consent.)

---

## Files created by this plan

- `components/dashboard/ui/` — `Rail.tsx`, `ViewHeader.tsx`, `SectionHeader.tsx`, `Card.tsx`, `Segmented.tsx`, `Badge.tsx`, `Avatar.tsx`, `Ring.tsx`, `Modal.tsx`, `MonoLabel.tsx`, `index.ts`.
- `lib/dashboard/ring.ts` (+ test) — progress-ring geometry.
- `lib/crypto.ts` (+ test) — AES-GCM token encryption.
- `lib/dashboard/state-schema.ts` (+ test) — `/api/state` payload validation.
- `lib/dashboard/useAppState.ts` — client sync hook.
- `lib/google.ts` — OAuth + access-token minting.
- `app/api/state/route.ts`, `app/api/ai/route.ts`, `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts`, `app/api/calendar/events/route.ts`.
- `supabase/migrations/0002_app_state.sql`, `supabase/migrations/0003_google_tokens.sql`.
- Rewrites `components/dashboard/Shell.tsx`; adds `components/dashboard/HomeView.tsx`; restyles `components/dashboard/CommandPalette.tsx`.
- Adds `--crimson` tokens to `app/globals.css`.

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

## Task 4: `app_state` table (OPS-run migration)

**Files:**
- Create: `supabase/migrations/0002_app_state.sql`

- [ ] **Step 1: Write it**

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
git add supabase/migrations/0002_app_state.sql
git commit -m "feat(db): app_state jsonb table with strict RLS"
```

---

## Task 5: `/api/state` with payload validation (TDD the validator)

**Files:**
- Create: `lib/dashboard/state-schema.ts`, `test/state-schema.test.ts`, `app/api/state/route.ts`

- [ ] **Step 1: Install zod.** `npm install zod`

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
git add lib/dashboard/state-schema.ts test/state-schema.test.ts app/api/state/route.ts package.json package-lock.json
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

## Task 8: `google_tokens` table (OPS-run migration)

**Files:**
- Create: `supabase/migrations/0003_google_tokens.sql`

- [ ] **Step 1: Write it**

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
git add supabase/migrations/0003_google_tokens.sql
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

**Files:**
- Rewrite: `components/dashboard/Shell.tsx`
- Modify: `components/dashboard/CommandPalette.tsx` (restyle to tokens — keep its logic)

- [ ] **Step 1: Rewrite `components/dashboard/Shell.tsx`**

```tsx
"use client";
import { useState, useCallback } from "react";
import { Toaster } from "sonner";
import { Rail, type ViewKey } from "./ui";
import { HomeView } from "./HomeView";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{name} — coming in the next milestone</div>;
}

export function DashboardShell() {
  const [view, setView] = useState<ViewKey>("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  const signOut = useCallback(async () => {
    await createSupabaseBrowserClient().auth.signOut();
    window.location.href = "/login";
  }, []);

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

## Self-review notes (author)

- **Spec coverage:** §3 design system → Tasks 1–3; §4 shell/home/command-palette/mobile → Tasks 12–14; §5.2 `/api/state` + JSONB → Tasks 4–6; §5.4 per-route auth + rate limit + origin → reused from A0's `requireUser` + `lib/rate-limit`; §5.5 encrypted Google tokens + server OAuth + one connector → Tasks 7–10; AI on Claude → Task 11; §5.8 no-sensitive-localStorage + minimal egress + no-side-effect AI → Tasks 6 & 11 (contract documented). Gmail `search`/`draft` routes and the draft-confirmation UX land in **B (People)** on this same token spine; Brain restyle lands with its view.
- **Type consistency:** `ViewKey` defined once in `Rail.tsx`, imported everywhere; `requireUser` result shape matches A0; `useAppState` app names match the `app_state` CHECK constraint and `/api/state` validator.
- **Testable seams:** ring geometry, state validator, token crypto, and AI request validator are pure + unit-tested; the spine is exercised end-to-end in Task 15; presentational components are preview-verified.
- **Deferred deliberately:** CSP header (needs the shell's final asset origins — added here once known, tracked in A0 Task 10 note); relational normalization (JSONB is sufficient); Gmail routes (B).
```
