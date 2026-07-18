// Authenticated global search over the owner's app_state docs (People/Coach/Brain).
// Replaces the old browser-anon-client search that queried dead legacy tables.
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { contactEmails } from "@/lib/dashboard/people/interactions";
import { migrate } from "@/lib/dashboard/coach/migrate";
import { getGoal } from "@/lib/dashboard/coach/rollup";
import { normalizeBrain } from "@/lib/dashboard/brain/seed";
import { noteTitle } from "@/lib/dashboard/brain/types";
import type { CoachDB } from "@/lib/dashboard/coach/types";

export const dynamic = "force-dynamic";

type SResult = {
  type: "contact" | "goal" | "task" | "note";
  id: string;
  title: string;
  subtitle?: string;
  view: "people" | "coach" | "brain";
  score: number;
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const takeTop = (arr: SResult[], n: number, out: SResult[]) =>
  arr.sort((a, b) => b.score - a.score).slice(0, n).forEach((r) => out.push(r));

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:search`, 60, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return Response.json({ results: [] });
  const rx = new RegExp(`\\b${esc(q)}`);
  const score = (s: string | undefined | null): number => {
    if (!s) return 0;
    const h = s.toLowerCase();
    if (h.startsWith(q)) return 3;
    if (rx.test(h)) return 2;
    if (h.includes(q)) return 1;
    return 0;
  };

  const { data } = await gate.supabase
    .from("app_state")
    .select("app, data")
    .eq("user_id", gate.userId)
    .in("app", ["lifeCRM", "execCoach", "brain"]);
  const byApp: Record<string, unknown> = {};
  (data ?? []).forEach((r: { app: string; data: unknown }) => {
    byApp[r.app] = r.data;
  });

  const out: SResult[] = [];

  // People — match name/emails/tags, but return name + tier ONLY (privacy).
  try {
    const db = normalizeDb(byApp.lifeCRM ?? {});
    const contacts: SResult[] = [];
    for (const c of db.contacts) {
      const nameScore = score(c.name);
      const otherHit = Math.max(...contactEmails(c).map(score), ...(c.tags ?? []).map(score), 0);
      const sc = Math.max(nameScore, otherHit ? 1 : 0);
      if (sc > 0) contacts.push({ type: "contact", id: c.id, title: c.name || "Unnamed", subtitle: c.tier, view: "people", score: sc });
    }
    takeTop(contacts, 5, out);
  } catch {
    /* skip on malformed doc */
  }

  // Coach — goals (title/notes) + tasks (label).
  try {
    const db = migrate(structuredClone(byApp.execCoach ?? {}) as Partial<CoachDB>, new Date());
    const goals: SResult[] = [];
    for (const g of db.goals) {
      const sc = Math.max(score(g.title), score(g.notes) ? 1 : 0);
      if (sc > 0) goals.push({ type: "goal", id: g.id, title: g.title, subtitle: `${g.horizon} goal`, view: "coach", score: sc });
    }
    takeTop(goals, 5, out);
    const tasks: SResult[] = [];
    for (const t of db.tasks) {
      const sc = score(t.label);
      if (sc > 0) {
        const g = t.goalId ? getGoal(db, t.goalId) : undefined;
        tasks.push({ type: "task", id: t.id, title: t.label, subtitle: g ? g.title : "Unfiled", view: "coach", score: sc });
      }
    }
    takeTop(tasks, 5, out);
  } catch {
    /* skip on malformed doc */
  }

  // Brain — notes (title/body/tags).
  try {
    const bd = normalizeBrain(byApp.brain ?? {});
    const notes: SResult[] = [];
    for (const n of bd.notes) {
      const tagHit = Math.max(...n.tags.map(score), 0);
      const sc = Math.max(score(noteTitle(n)), score(n.text) ? 1 : 0, tagHit ? 1 : 0);
      if (sc > 0) notes.push({ type: "note", id: n.id, title: noteTitle(n), subtitle: n.tags.slice(0, 3).join(" · ") || undefined, view: "brain", score: sc });
    }
    takeTop(notes, 5, out);
  } catch {
    /* skip on malformed doc */
  }

  const results = out
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score: _s, ...r }) => r);
  return Response.json({ results });
}
