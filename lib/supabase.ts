/**
 * LEGACY GUARD — do not restore a real browser-side data client here.
 *
 * The old module-level supabase-js client used localStorage auth and never
 * shared the httpOnly cookie session, so it was permanently session-blind:
 * strict RLS returned 0 rows on reads and rejected all writes, silently
 * (docs/code-review-2026-07-19.md finding #41). Its only importers are the
 * kept-for-reintegration contacts-graph modals (ImportContactsModal,
 * ConnectionManagerModal — see docs/legacy-reintegration.md). Before those
 * are mounted again, port their data access to requireUser()-gated /api
 * routes using createServerSupabase(). Until then, any use of this export
 * throws with an explanation instead of rendering empty.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sessionBlindDeadClient } from "./supabase-guard";

export const supabase = sessionBlindDeadClient<SupabaseClient>();
