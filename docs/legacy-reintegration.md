# Legacy reintegration constraint: TaskBoard + contacts-graph

**Standing decision (owner):** the TaskBoard and contacts-graph components
(`components/dashboard/TaskBoard.tsx`, `CrmView.tsx`, `ContactTable.tsx`,
`NetworkGraph.tsx`, `ImportContactsModal.tsx`, `ConnectionManagerModal.tsx`,
plus the Momentum/SecondBrain popups) and their DB tables (`tasks`,
`projects`, `sprints`, `subtasks`, `contacts`, `contact_connections` — see
`supabase/drop_unused_tables.sql:15-20`) are KEPT for planned reintegration.
They are currently unmounted: nothing reachable from
`components/dashboard/Shell.tsx` imports them.

**Hard constraint (code-review finding #41,
`docs/code-review-2026-07-19.md`):** all Supabase session cookies are forced
`httpOnly` (`middleware.ts:57`, `lib/supabase-server.ts:20`,
`app/login/actions.ts:26`). No browser-side Supabase client can see the
session, so browser-side table access is session-blind — reads return 0 rows
and writes fail RLS, silently. Both legacy client modules are therefore
guarded (`lib/supabase-guard.ts`):

- `lib/supabase.ts` exports a dead client that throws on any use.
- `lib/supabase-browser.ts` is auth-flow-only; its `.from/.rpc/.storage/
  .channel/.functions/...` throw. Only `GoogleButton`'s
  `auth.signInWithOAuth` is a supported caller (the PKCE verifier cookie is
  JS-set; the session is created server-side in `app/auth/callback/route.ts`).

**Reintegration recipe:** port each component's data access to
`requireUser()`-gated `/api` routes using `createServerSupabase()`
(`lib/supabase-server.ts`), exactly like the live people/coach/home/brain
views. Do not weaken the guards and do not make session cookies readable
from JS. Note also: QuickNotesPopUp / QuickCalendarPopUp / FocusTimerPopUp
target tables that were DROPPED (`notes`, `calendar_events`,
`focus_sessions` — `supabase/drop_unused_tables.sql:35-38`); reintegrating
those needs schema work first, not just an API port.
