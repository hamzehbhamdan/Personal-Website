# Milestone A0 — Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the live data-exposure findings on `my.hamzehhamdan.com` (world-readable Supabase data via the public anon key, unauthenticated API routes, an unprotected vector corpus, a parent-domain cookie, burned secrets) before the dashboard rebuild starts on top of it.

**Architecture:** Make Supabase RLS the real access boundary (strict `auth.uid()`, no nil-UUID backdoor) and make every API route self-authenticate through one shared helper. Delete routes that belong to the soon-to-be-removed dashboard rather than harden throwaway code. Harden cookies, logging, headers, deploy, and secrets around that core.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres + RLS + `@supabase/ssr`) · OpenAI · Vitest (added here) · deployed on Netlify (+ a GitHub Pages workflow to resolve).

This is the first plan of Sub-project A; the design-system + shell + secure-spine build (A1) follows once this lands. Source spec: `docs/superpowers/specs/2026-07-11-my-dashboard-redesign-design.md` (§5.9/§5.10).

---

## ⚠️ OPS PREFACE — do this before/alongside the code tasks (only Hamzeh can)

These require Supabase/hosting access the engineer/subagent does not have. Treat all secrets as compromised (the anon key + nil-UUID RLS made data world-readable).

- [ ] **O1. Rotate every secret.** In Supabase: Settings → API → roll the `anon` and `service_role` keys; Settings → Database → reset the DB password (`SUPABASE_DB_PASSWORD`). In Google Cloud: rotate `GCAL_CLIENT_SECRET`. In OpenAI: roll `OPENAI_API_KEY`. Update `.env` locally and the Netlify env vars. Expected: the app still builds with the new `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **O2. Scan git history for leaked secret *values*** (the `.env` file was never committed, but a value may have leaked elsewhere):

```bash
git log -p -S 'service_role' -- . | head -50
git log -p -S 'sk-' -- . | head -50   # OpenAI key prefix
# Repeat for the actual DB password and GCAL secret strings.
```

Expected: no matches. If any secret value appears in history, it is already burned — rotation in O1 covers it; do not attempt history rewrite unless a value is found.
- [ ] **O3. Confirm no code path uses `SUPABASE_DB_PASSWORD`** (the app must talk PostgREST only, never a raw Postgres connection):

```bash
grep -rn "SUPABASE_DB_PASSWORD\|postgres://\|pg\.\|node-postgres\|Pool(" --include=*.ts --include=*.tsx --include=*.js . | grep -v node_modules
```

Expected: no application code references it. If something does, flag it before proceeding.

---

## Files touched by this plan

- Create: `lib/auth.ts` — pure allow-list gate (testable).
- Create: `lib/supabase-server.ts` — server Supabase client + `requireUser()` gate.
- Create: `supabase/migrations/0001_harden_rls.sql` — strict RLS + `documents` owner + `match_documents` hardening + backfill.
- Create: `vitest.config.ts`, `test/auth.test.ts`, `test/api-auth.test.ts`.
- Modify: `app/api/chat/route.ts` — add auth gate, remove file logger, fix `.or()` injection.
- Modify: `app/api/vector/stores/route.ts`, `app/api/vector/files/route.ts`, `app/api/vector/ingest/route.ts` — add auth gate, drop nil-UUID fallback, verify store ownership, validate uploads.
- Delete: `app/api/briefing/route.ts`, `app/api/neural-sort/route.ts` — belong to the removed dashboard.
- Modify: `middleware.ts` — remove dead `isProtectedApi` block; keep page protection.
- Modify: `app/login/actions.ts` — host-only + HttpOnly cookie; drop URL-prefix log.
- Modify: `next.config.ts` — security headers.
- Modify: `netlify.toml`, `.github/workflows/deploy.yml` — deploy/CI hardening.
- Modify: `package.json` — Vitest, `npm audit` gate, Next upgrade.

---

## Task 1: Add the Vitest test runner

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.ts`
- Create: `test/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest@^2`
Expected: `vitest` appears under devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script to `package.json`**

In the `"scripts"` object add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test — `test/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts test/smoke.test.ts
git commit -m "test: add vitest runner"
```

---

## Task 2: Pure allow-list gate (`lib/auth.ts`)

Isolates the "is this the allowed user?" decision so it is unit-testable without Supabase.

**Files:**
- Create: `lib/auth.ts`
- Create: `test/auth.test.ts`

- [ ] **Step 1: Write the failing test — `test/auth.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { gateResult } from "../lib/auth";

const ALLOWED = "owner@example.com";

describe("gateResult", () => {
  it("401 when no user", () => {
    expect(gateResult(null, ALLOWED)).toEqual({ ok: false, status: 401 });
  });
  it("403 when wrong email", () => {
    expect(gateResult({ id: "x", email: "someone@else.com" }, ALLOWED)).toEqual({ ok: false, status: 403 });
  });
  it("ok for the allowed email (case-insensitive)", () => {
    expect(gateResult({ id: "u1", email: "OWNER@example.com" }, ALLOWED)).toEqual({ ok: true, userId: "u1" });
  });
  it("403 when ALLOWED_EMAIL unset (fail closed)", () => {
    expect(gateResult({ id: "u1", email: "owner@example.com" }, undefined)).toEqual({ ok: false, status: 403 });
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npm test -- test/auth.test.ts`
Expected: FAIL — `gateResult` not exported.

- [ ] **Step 3: Implement `lib/auth.ts`**

```ts
export type GateUser = { id: string; email?: string | null } | null;
export type GateResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 };

/** Pure allow-list decision. Fails closed when allowedEmail is missing. */
export function gateResult(user: GateUser, allowedEmail: string | undefined): GateResult {
  if (!user) return { ok: false, status: 401 };
  if (!allowedEmail) return { ok: false, status: 403 };
  const email = (user.email ?? "").trim().toLowerCase();
  if (email !== allowedEmail.trim().toLowerCase()) return { ok: false, status: 403 };
  return { ok: true, userId: user.id };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- test/auth.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts test/auth.test.ts
git commit -m "feat: pure allow-list auth gate"
```

---

## Task 3: Server Supabase client + `requireUser()` (`lib/supabase-server.ts`)

One cookie-bound server client + one gate used by every route. Uses `getUser()` (validates the JWT), never `getSession()`.

**Files:**
- Create: `lib/supabase-server.ts`

- [ ] **Step 1: Implement `lib/supabase-server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { gateResult } from "./auth";

/** Cookie-bound server client (RLS applies as the signed-in user). */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: true })
            );
          } catch {
            /* called from a context where cookies are read-only; middleware refreshes sessions */
          }
        },
      },
    }
  );
}

type Awaited1<T> = T extends Promise<infer U> ? U : T;
export type RequireUserResult =
  | { ok: true; supabase: Awaited1<ReturnType<typeof createServerSupabase>>; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Gate a route: returns the authed client + userId, or a NextResponse to return immediately.
 * Also enforces the single-user ALLOWED_EMAIL and (for mutations) a same-origin check.
 */
export async function requireUser(req?: Request): Promise<RequireUserResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const gate = gateResult(user, process.env.ALLOWED_EMAIL);
  if (!gate.ok) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: gate.status }) };
  }
  // CSRF defense-in-depth for state-changing requests: require same-origin.
  if (req && req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return { ok: false, response: NextResponse.json({ error: "Bad origin" }, { status: 403 }) };
    }
  }
  return { ok: true, supabase, userId: gate.userId };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase-server.ts
git commit -m "feat: server supabase client + requireUser gate"
```

---

## Task 4: RLS + schema hardening migration (OPS-run SQL)

**Files:**
- Create: `supabase/migrations/0001_harden_rls.sql`

This migration is authored in the repo and **run by Hamzeh in the Supabase SQL editor** (it needs table-owner privileges). It (a) counts nil-UUID rows, (b) backfills them to the real owner, (c) replaces every permissive policy with strict ones, (d) gives `documents` an owner + RLS, (e) hardens `match_documents`, (f) deletes the demo user.

- [ ] **Step 1: Write `supabase/migrations/0001_harden_rls.sql`**

> Replace `OWNER_EMAIL_HERE` with the value of `ALLOWED_EMAIL` (the login email) before running.

```sql
-- =============================================================
-- 0001_harden_rls.sql — strip the nil-UUID backdoor, scope to owner
-- Run in Supabase SQL editor. Review STEP 1 output before continuing.
-- =============================================================
begin;

-- Resolve the real owner id once.
do $$
declare owner uuid;
begin
  select id into owner from auth.users where email = 'OWNER_EMAIL_HERE';
  if owner is null then raise exception 'Owner email not found in auth.users'; end if;
  perform set_config('app.owner_id', owner::text, true);
end $$;

-- STEP 1 (audit): how many rows currently sit under the nil UUID?
-- (Wrap the whole file in a transaction; inspect these counts, then commit.)
create temp table _nil_counts as
  select 'contacts' t, count(*) n from public.contacts where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'contact_connections', count(*) from public.contact_connections where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'tasks', count(*) from public.tasks where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'projects', count(*) from public.projects where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'notes', count(*) from public.notes where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'focus_sessions', count(*) from public.focus_sessions where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'neural_chats', count(*) from public.neural_chats where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'user_vector_stores', count(*) from public.user_vector_stores where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'sprints', count(*) from public.sprints where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'calendar_events', count(*) from public.calendar_events where user_id = '00000000-0000-0000-0000-000000000000';
select * from _nil_counts;

-- STEP 2 (backfill): reassign all nil-UUID rows to the real owner.
update public.contacts            set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.contact_connections set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.tasks               set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.projects            set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.notes               set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.focus_sessions      set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.neural_chats        set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.user_vector_stores  set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.sprints             set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.calendar_events     set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';

-- STEP 3 (strict policies): drop the backdoor, add auth.uid()-only with WITH CHECK.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'contacts','contact_connections','tasks','projects','notes',
    'focus_sessions','neural_chats','user_vector_stores','sprints','calendar_events'
  ] loop
    execute format('drop policy if exists "Enable all for %s" on public.%I;', tbl, tbl);
    execute format('drop policy if exists "Users can manage own %s" on public.%I;', tbl, tbl);
    execute format($f$create policy "owner_all_%1$s" on public.%1$I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);$f$, tbl);
  end loop;
end $$;

-- subtasks: scope through parent task ownership (no user_id column).
drop policy if exists "Enable all for subtasks" on public.subtasks;
drop policy if exists "Users can manage subtasks of own tasks" on public.subtasks;
create policy "owner_all_subtasks" on public.subtasks for all
  using (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()));

-- profiles: add the missing WITH CHECK on update.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- STEP 4: documents (Second Brain corpus) — add owner + RLS.
alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete cascade;
update public.documents set user_id = current_setting('app.owner_id')::uuid where user_id is null;
alter table public.documents alter column user_id set not null;
alter table public.documents enable row level security;
drop policy if exists "owner_all_documents" on public.documents;
create policy "owner_all_documents" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- STEP 5: harden match_documents — filter by owner, run as invoker (RLS applies),
-- pin search_path, and revoke anon/public execute.
drop function if exists match_documents(vector, double precision, int);
create or replace function public.match_documents(
  query_embedding vector(1536), match_threshold float, match_count int
) returns table (id bigint, content text, metadata jsonb, similarity float)
language sql stable security invoker set search_path = ''
as $$
  select d.id, d.content, d.metadata, 1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.user_id = auth.uid()
    and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
revoke all on function public.match_documents(vector, double precision, int) from public, anon;
grant execute on function public.match_documents(vector, double precision, int) to authenticated;

-- STEP 6: remove the seeded demo principal (after backfill).
delete from auth.users where id = '00000000-0000-0000-0000-000000000000';

-- Review _nil_counts output above, then:
commit;
```

- [ ] **Step 2: OPS — run in Supabase SQL editor.** Paste the file, run it, inspect the STEP 1 counts (they should equal your real row totals). If a count looks wrong (unexpected junk), `rollback;` and investigate before re-running. Expected on success: `COMMIT` with no errors.

- [ ] **Step 3: OPS — verification queries** (run after commit):

```sql
-- (a) No rows left under the nil UUID (should all be 0):
select count(*) from public.contacts where user_id = '00000000-0000-0000-0000-000000000000';
-- (b) RLS enabled everywhere (rowsecurity should be true for all app tables incl. documents):
select relname, relrowsecurity from pg_class
where relname in ('contacts','tasks','documents','notes','neural_chats','calendar_events') order by relname;
-- (c) anon cannot execute the RPC:
select has_function_privilege('anon','public.match_documents(vector, double precision, int)','execute'); -- expect false
```

Expected: (a) 0, (b) all `true`, (c) `false`.

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/migrations/0001_harden_rls.sql
git commit -m "feat(db): strict RLS, documents owner, harden match_documents"
```

---

## Task 5: Authenticate `/api/chat` + fix its logging & injection

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Remove the file logger.** Delete these lines (near the top of the file):

```ts
const logFile = path.join(process.cwd(), 'debug-chat.log');
const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
```

Remove the now-unused `import * as fs from 'fs';` and `import * as path from 'path';`. Replace every remaining `log(...)` call with either nothing or `console.warn(...)` **without message content** (e.g. `console.warn("chat: tool error")`).

- [ ] **Step 2: Gate the handler.** Replace the hand-rolled `createServerClient(...)` block at the top of `POST` with the shared gate. The handler currently starts:

```ts
export async function POST(req: Request) {
    try {
        const supabase = createServerClient( /* ...cookie config... */ );
        // ...
```

Change it to:

```ts
import { requireUser } from "@/lib/supabase-server";
// ...
export async function POST(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    try {
        // ... rest unchanged ...
```

Delete the old `createServerClient` import if it is no longer used in the file.

- [ ] **Step 3: Fix PostgREST filter injection in `executeGetContacts`.** The current `.or(\`name.ilike.%${search}%,company.ilike.%${search}%\`)` interpolates raw input. Sanitize the term first:

```ts
if (search) {
    const safe = search.replace(/[,()%\\]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%`);
}
```

- [ ] **Step 4: Add a failing route-auth test — `test/api-auth.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gate so no real Supabase/network is needed.
vi.mock("../lib/supabase-server", () => ({
  requireUser: vi.fn(),
}));
import { requireUser } from "../lib/supabase-server";
import { NextResponse } from "next/server";

describe("/api/chat auth", () => {
  beforeEach(() => vi.resetAllMocks());
  it("returns 401 when unauthenticated", async () => {
    (requireUser as any).mockResolvedValue({ ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) });
    const { POST } = await import("../app/api/chat/route");
    const res = await POST(new Request("http://localhost/api/chat", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test -- test/api-auth.test.ts`
Expected: PASS (401 returned before any DB/OpenAI work).

- [ ] **Step 6: Commit**

```bash
git add app/api/chat/route.ts test/api-auth.test.ts
git commit -m "fix(api): authenticate /api/chat, drop file logger, sanitize contact search"
```

---

## Task 6: Authenticate + tighten the vector routes

**Files:**
- Modify: `app/api/vector/stores/route.ts`, `app/api/vector/files/route.ts`, `app/api/vector/ingest/route.ts`

- [ ] **Step 1: `stores/route.ts` — gate + drop nil-UUID fallback.** In each handler (`GET`, `POST`, `DELETE`) replace the pattern:

```ts
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id || '00000000-0000-0000-0000-000000000000';
```

with:

```ts
import { requireUser } from "@/lib/supabase-server";
// at handler top:
const gate = await requireUser(req);        // GET has no req param — use requireUser() there
if (!gate.ok) return gate.response;
const supabase = gate.supabase;
const userId = gate.userId;
```

(For the `GET()` handler with no `req`, call `await requireUser()`.)

- [ ] **Step 2: `ingest/route.ts` — gate + validate the upload.** Add the gate at the top of `POST`, then before reading the file bytes:

```ts
const gate = await requireUser(req);
if (!gate.ok) return gate.response;
const supabase = gate.supabase;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED = ["text/plain", "text/markdown", "application/pdf", "image/png", "image/jpeg"];
if (file.size > MAX_BYTES) return Response.json({ error: "File too large" }, { status: 413 });
// Validate by magic bytes, not the client-supplied MIME:
const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
const sniff = sniffMime(head); // implement below
if (!sniff || !ALLOWED.includes(sniff)) return Response.json({ error: "Unsupported file type" }, { status: 415 });
```

Add this helper at the bottom of the file:

```ts
function sniffMime(head: Buffer): string | null {
  if (head.slice(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  // Heuristic: printable ASCII/UTF-8 start → treat as text/markdown.
  if (head.every((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b < 0x7f) || b >= 0x80)) return "text/plain";
  return null;
}
```

Ensure the row insert sets `user_id: gate.userId` on `documents`.

- [ ] **Step 3: `files/route.ts` — gate + verify store ownership.** Add the gate to every handler. Before any OpenAI call that names a `vector_store_id`, confirm the caller owns it:

```ts
const { data: owned } = await supabase
  .from("user_vector_stores")
  .select("vector_store_id")
  .eq("user_id", gate.userId)
  .eq("vector_store_id", storeId)
  .maybeSingle();
if (!owned) return Response.json({ error: "Not found" }, { status: 404 });
```

- [ ] **Step 4: Strip verbose errors.** In all three files, replace any `return ... error: error.message` / `String(error)` with a generic message and a server-side `console.warn("vector: <op> failed")` (no error body to the client).

- [ ] **Step 5: Typecheck + test**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/vector/
git commit -m "fix(api): authenticate vector routes, drop nil-UUID fallback, validate uploads, verify store ownership"
```

---

## Task 7: Delete dead dashboard routes

`/api/briefing` and `/api/neural-sort` serve only the old dashboard (being removed), and both are currently exposed. `briefing` also proxies a caller-supplied Google token.

**Files:**
- Delete: `app/api/briefing/route.ts`, `app/api/neural-sort/route.ts`

- [ ] **Step 1: Confirm nothing kept imports them**

Run: `grep -rn "api/briefing\|api/neural-sort" --include=*.ts --include=*.tsx app components lib | grep -v node_modules`
Expected: matches only in soon-to-be-removed dashboard components (e.g. `StrategicBriefingPopUp.tsx`), not in the shell/pages we keep. If a kept file references them, stop and reconcile.

- [ ] **Step 2: Delete the routes**

```bash
git rm app/api/briefing/route.ts app/api/neural-sort/route.ts
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds (the orphaned popup components are not imported by the placeholder shell).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(api): remove unauthenticated briefing/neural-sort routes (dead dashboard)"
```

---

## Task 8: Middleware cleanup

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Remove the dead `isProtectedApi` block.** The matcher excludes `/api`, so this code never runs and creates false confidence. Delete:

```ts
const isProtectedApi = request.nextUrl.pathname.startsWith("/api/vector") || request.nextUrl.pathname.startsWith("/api/briefing");
```

and simplify the guard to page protection only:

```ts
const isDashboard = request.nextUrl.pathname.startsWith("/dashboard") || subdomain === "my";
if (isDashboard) {
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    const allowedEmail = process.env.ALLOWED_EMAIL;
    if (allowedEmail && user.email !== allowedEmail) {
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "Unauthorized account");
        return NextResponse.redirect(url);
    }
}
```

(Remove the now-unused `isProtectedApi` references and the API-branch inside the `if`.) API routes are now protected by `requireUser()` (Tasks 5–6), which is the correct boundary.

- [ ] **Step 2: Add a code comment** above the block: `// NOTE: middleware does NOT run on /api (see matcher). API routes authenticate via requireUser().`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "refactor(mw): remove dead API-protection block; document the /api boundary"
```

---

## Task 9: Host-only, HttpOnly session cookies

The cookie is currently scoped to `.hamzehhamdan.com` (every subdomain) and is not HttpOnly.

**Files:**
- Modify: `app/login/actions.ts`

- [ ] **Step 1: Fix the cookie options.** In the `setAll` handler, replace:

```ts
cookieStore.set(name, value, {
    ...options,
    domain: ".hamzehhamdan.com",
    sameSite: "lax",
    secure: true,
})
```

with (drop `domain` → host-only; add `httpOnly`):

```ts
cookieStore.set(name, value, {
    ...options,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
})
```

- [ ] **Step 2: Remove the URL-prefix log.** Delete:

```ts
console.log("Supabase URL Env:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...");
```

and change `console.error("Login Error:", error);` to `console.warn("Login failed");` (no error object).

- [ ] **Step 3: Verify middleware cookie writes match.** In `middleware.ts`, confirm the `setAll` there does not re-add a `domain` and passes `httpOnly: true` (it uses `options` from Supabase; add `{ ...options, httpOnly: true, sameSite: "lax", secure: true }` on the `response.cookies.set` calls for consistency).

- [ ] **Step 4: OPS note.** After deploy, the domain change invalidates the existing `.hamzehhamdan.com` cookie — Hamzeh must log in again on `my.hamzehhamdan.com`. Existing sessions on other subdomains stop being shared (intended).

- [ ] **Step 5: Build + commit**

Run: `npm run build`
Expected: success.

```bash
git add app/login/actions.ts middleware.ts
git commit -m "fix(auth): host-only HttpOnly session cookie; drop URL-prefix log"
```

---

## Task 10: Security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add a `headers()` block.** Replace the file with:

```ts
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Note on CSP.** A strict `Content-Security-Policy` is added in A1 once the shell's inline/script needs are known (Plausible domain, no other external origins). Adding it here risks breaking the existing site; defer to A1 and track it there.

- [ ] **Step 3: Build + verify**

Run: `npm run build && npm start` then in another shell: `curl -sI http://localhost:3000/ | grep -i "x-frame-options\|x-content-type"`
Expected: headers present.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat(sec): add baseline security headers"
```

---

## Task 11: Rate-limit the API routes

Single-instance in-memory limiter (sufficient for a single-user app; note the serverless caveat).

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `test/rate-limit.test.ts`
- Modify: `app/api/chat/route.ts`, `app/api/vector/ingest/route.ts`

- [ ] **Step 1: Failing test — `test/rate-limit.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { allow } from "../lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit then blocks", () => {
    const key = "u1:test";
    let ok = true;
    for (let i = 0; i < 5; i++) ok = allow(key, 5, 60_000);
    expect(ok).toBe(true);
    expect(allow(key, 5, 60_000)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `lib/rate-limit.ts`**

```ts
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window limiter. Returns true if the call is allowed. In-memory (per server instance). */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
```

- [ ] **Step 3: Apply in `chat` and `ingest`** after the auth gate:

```ts
import { allow } from "@/lib/rate-limit";
if (!allow(`${gate.userId}:chat`, 30, 60_000)) {
  return Response.json({ error: "Rate limited" }, { status: 429 });
}
```

(Use `:ingest` and a smaller limit like `10` for ingest.)

- [ ] **Step 4: Test + commit**

Run: `npm test -- test/rate-limit.test.ts`
Expected: PASS.

```bash
git add lib/rate-limit.ts test/rate-limit.test.ts app/api/chat/route.ts app/api/vector/ingest/route.ts
git commit -m "feat(sec): in-memory rate limiting on AI/ingest routes"
```

---

## Task 12: Isolate the prompt-injection lab from ingest

`public/playground/mcp-injection-lab/` is served on-origin and is a payload corpus; it must never reach the Second Brain ingest path.

**Files:**
- Modify: `app/api/vector/ingest/route.ts` (guard), and add a note to the ingest source contract.

- [ ] **Step 1: Confirm ingest only accepts user uploads, never server paths.** Read `ingest/route.ts`: it must only read from the multipart `file` field (user upload), never from a filesystem path derived from the request. If any code reads a path from `public/` based on input, remove it.

- [ ] **Step 2: Add a defensive guard** rejecting any ingest whose filename resembles the lab, as belt-and-suspenders:

```ts
if (/mcp-injection|injection[_-]?test/i.test(file.name)) {
  return Response.json({ error: "Rejected source" }, { status: 400 });
}
```

- [ ] **Step 3: Add `X-Robots-Tag: noindex` for the lab path** in `next.config.ts` headers (so it is not indexed as your content):

```ts
{ source: "/playground/mcp-injection-lab/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
```

- [ ] **Step 4: Build + commit**

Run: `npm run build`
Expected: success.

```bash
git add app/api/vector/ingest/route.ts next.config.ts
git commit -m "fix(sec): keep the injection lab out of ingest + deindex it"
```

---

## Task 13: Deploy & CI hardening

**Files:**
- Modify: `.github/workflows/deploy.yml`, `netlify.toml`
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Decide the GitHub Pages deploy.** The Pages workflow publishes a static export of the app that still ships the anon key and can hit Supabase. Since Netlify is the real server host, **disable the app's Pages deploy** unless it is intentionally serving only the public marketing site. If keeping it, confirm it exports no authenticated/dashboard surface. To disable: change the trigger so it no longer runs on push, or delete the workflow. Record the decision in the commit message.

- [ ] **Step 2: Pin actions by SHA.** Replace floating tags in `deploy.yml`:

```yaml
- uses: actions/checkout@<full-40-char-sha>   # was @v4
- uses: actions/configure-pages@<sha>          # was @v5
- uses: actions/upload-pages-artifact@<sha>    # was @v3
- uses: actions/deploy-pages@<sha>             # was @v4
- uses: actions/setup-node@<sha>               # was @v4
```

(Look up each SHA from the action's release tag.)

- [ ] **Step 3: Add `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

- [ ] **Step 4: Re-tune the Netlify secret scanner.** In `netlify.toml`, narrow `SECRETS_SCAN_OMIT_PATHS` — do not omit `.next` wholesale. Keep only `public` if needed; let the scanner watch build output for accidental secret inlining. Add a comment explaining why each omit exists.

- [ ] **Step 5: OPS.** In GitHub repo settings, enable Secret Scanning + Push Protection and Dependabot alerts. (No code; checklist item.)

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml .github/dependabot.yml netlify.toml
git commit -m "chore(ci): pin actions by sha, add dependabot, tighten secret scanning, resolve pages deploy"
```

---

## Task 14: Upgrade Next.js + audit dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check advisories + upgrade**

Run: `npm audit` and `npm view next version`
Then: `npm install next@latest` (upgrade within the supported major; review the changelog for App Router/middleware breaking changes).

- [ ] **Step 2: Build + full test**

Run: `npm run build && npm test`
Expected: build succeeds, all tests pass. If middleware/route APIs changed, reconcile.

- [ ] **Step 3: Add an audit gate script** to `package.json`:

```json
"audit:ci": "npm audit --audit-level=high"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): upgrade next, add high-severity audit gate"
```

---

## Task 15: Security review gate + end-to-end verification

- [ ] **Step 1: Run the security review** on the branch: `/security-review`. Triage every finding; fix or explicitly accept with a reason.

- [ ] **Step 2: Manual exposure re-test (OPS, against a preview deploy).** With the app deployed to a preview URL and **not** logged in:

```bash
# Direct PostgREST with the (rotated) anon key must now return nothing / RLS-empty:
curl -s "$SUPABASE_URL/rest/v1/contacts?select=*" -H "apikey: $ANON_KEY" | head
# Expect: [] (RLS blocks the anon role — no rows).

# API routes must reject unauthenticated calls:
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/chat" -d '{}'          # expect 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/vector/ingest" -d '{}' # expect 401
```

Expected: `[]` from PostgREST; `401` from each route.

- [ ] **Step 3: Confirm no secret in the client bundle**

Run: `npm run build && grep -rn "service_role\|sk-\|SUPABASE_DB_PASSWORD" .next/static out 2>/dev/null | head`
Expected: no matches (only `NEXT_PUBLIC_*` values should ever be in client output).

- [ ] **Step 4: Verify the checklist** (from spec §5.10): strict RLS on all tables incl. `documents`; every route self-auths; `match_documents` anon-execute revoked; no file logging; host-only HttpOnly cookie; headers present; secrets rotated. Mark each done.

- [ ] **Step 5: Final commit / open PR**

```bash
git commit --allow-empty -m "chore(sec): A0 hardening verified — see spec §5.9/§5.10"
```

---

## Self-review notes (author)

- **Spec coverage:** every §5.10 Milestone-A0 item maps to a task — secret rotation (Ops O1–O3), RLS/all-tables + backfill + demo delete (T4), `documents` RLS + `match_documents` (T4), per-route auth + origin + input validation + verbose errors (T2/T3/T5/T6), remove debug log (T5), cookie model (T9), Next upgrade + headers (T10/T14), dual-deploy + CI + secret-scan (T13), injection-lab isolation (T12), rate limiting (T11), security-review gate (T15). New-surface controls (`/api/state`, token crypto, AI tool-calling confirmation, Gmail egress, data lifecycle) are **A1/B/C**, not A0, and are tracked in the spec.
- **Testable seams:** `gateResult` and `allow` are pure and unit-tested; route auth is covered by a mocked-gate test; DB changes are verified by SQL queries and the unauth curl re-test.
- **Not hardened, deliberately:** the orphaned old dashboard components (`CrmView`, `TaskBoard`, popups) — they are removed in B/C; the strict RLS already neutralizes their nil-UUID writes.
