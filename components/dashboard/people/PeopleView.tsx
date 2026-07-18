// components/dashboard/people/PeopleView.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/lib/dashboard/useAppState";
import { ViewHeader, Segmented } from "@/components/dashboard/ui";
import { useLiveInteractions } from "./useLiveInteractions";
import { emptyDb, normalizeDb } from "@/lib/dashboard/people/backup";
import { state as computeState } from "@/lib/dashboard/people/state";
import { summaryCounts } from "@/lib/dashboard/people/select";
import { AttentionList } from "./AttentionList";
import { PeopleList } from "./PeopleList";
import { GroupsList } from "./GroupsList";
import { NetworkPanel } from "./NetworkPanel";
import { LinkModal } from "./LinkModal";
import { ContactDetailModal } from "./ContactDetailModal";
import { ContactEditModal } from "./ContactEditModal";
import { GroupEditModal } from "./GroupEditModal";
import { CrmSettingsModal } from "./CrmSettingsModal";
import { AskPanel } from "./AskPanel";
import { EmptyOnboarding } from "./EmptyOnboarding";
import type { CrmDB, Contact } from "@/lib/dashboard/people/types";
import type { ViewIntent } from "@/lib/dashboard/nav";

type Seg = "attention" | "people" | "groups" | "network";
type GoogleStatus = "connected" | "error" | null;

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";

/**
 * PeopleView root — wires the whole People (Life CRM) view together (Task 24).
 *
 * `db` is a normalized READ-only snapshot (`useMemo(() => normalizeDb(raw), [raw])`), which is
 * pure and safe during render. Every write goes through `setState` using the STATE-MUTATION
 * CONVENTION — re-derive from `normalizeDb(prev)` inside the updater, never from this `db`
 * snapshot — the `onDismiss` inline updater below and every child modal follow this.
 */
export function PeopleView({
  initialSelect = null,
  onConsumed,
}: { initialSelect?: Extract<ViewIntent, { view: "people" }> | null; onConsumed?: () => void } = {}) {
  const { state: raw, setState, loaded, status } = useAppState<CrmDB>("lifeCRM", emptyDb());
  const db = useMemo(() => normalizeDb(raw), [raw]);
  const now = useMemo(() => new Date(), []);
  const live = useLiveInteractions(now);

  const [seg, setSeg] = useState<Seg>("attention");
  const [openContact, setOpenContact] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<{ id: string | null; prefill?: string } | null>(null);
  const [openGroup, setOpenGroup] = useState<string | "new" | null>(null);
  const [settings, setSettings] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Read the ?google=connected|error status set by app/api/google/callback's redirect. Read via
  // window.location.search in an effect (not useSearchParams) so this component never requires a
  // Suspense boundary / can't trip a build-time prerender error. Scrub the param from the URL
  // after reading so it doesn't reappear on a later client-side nav or refresh.
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (g === "connected" || g === "error") {
      setGoogleStatus(g);
      setSettings(true); // surface the connect result in Settings › Google (where the control lives)
      params.delete("google");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  // ⌘K / search deep-link: open a specific contact, the add-contact form, or Settings.
  // Gate on `loaded` so a fresh mount (state not yet fetched) re-runs once contacts arrive
  // instead of consuming the intent against an empty db and silently dropping it.
  useEffect(() => {
    if (!initialSelect || !loaded) return;
    if (initialSelect.kind === "contact") {
      if (db.contacts.some((c) => c.id === initialSelect.id)) {
        setSeg("people");
        setOpenContact(initialSelect.id);
      }
    } else if (initialSelect.kind === "newContact") {
      setEditContact({ id: null });
    } else if (initialSelect.kind === "settings") {
      setSettings(true);
    }
    onConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelect, loaded]);

  const stateOf = (c: Contact) => computeState(c, live.gmail, live.cal, db, now);
  const counts = summaryCounts(db, stateOf);
  const meta =
    `${counts.total} contacts · ${counts.overdue} need a nudge · ${counts.owe} owed · ${counts.bdays} birthdays soon`.toUpperCase();

  const saveStatus =
    status === "saving" ? (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>Saving…</span>
    ) : status === "saved" ? (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>Saved ✓</span>
    ) : status === "error" ? (
      <button
        type="button"
        onClick={() => setState((prev) => ({ ...prev }))}
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A51C30] hover:underline"
        style={mono}
      >
        Save failed — retry
      </button>
    ) : null;

  if (!loaded) {
    return (
      <div className="mx-auto w-full max-w-reading p-7 md:p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">Loading…</div>
    );
  }

  return (
    <div className="mx-auto w-full p-7 md:p-8 max-w-reading">
      <ViewHeader
        title="People"
        meta={meta}
        status={saveStatus}
        actions={
          <>
            <button type="button" onClick={() => setEditContact({ id: null })} className={btnPrimary} style={mono}>
              + Add contact
            </button>
            <button type="button" onClick={() => setSettings(true)} className={btnGhost} style={mono}>
              ⚙ Settings
            </button>
          </>
        }
      />


      {db.contacts.length === 0 ? (
        <EmptyOnboarding
          db={db}
          live={live}
          setState={setState}
          onAdd={(email) => setEditContact({ id: null, prefill: email })}
          onDismiss={(email) =>
            setState((prev) => {
              const d = normalizeDb(prev);
              return { ...d, dismissed: [...d.dismissed, email] };
            })
          }
        />
      ) : (
        <>
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: "attention", label: "Attention" },
              { value: "people", label: "People" },
              { value: "groups", label: `Groups${db.groups.length ? ` (${db.groups.length})` : ""}` },
              { value: "network", label: "Network" },
            ]}
          />

          <div className="mt-5">
            {seg === "attention" && (
              <AttentionList db={db} live={live} now={now} onOpenContact={setOpenContact} onOpenGroup={setOpenGroup} />
            )}
            {seg === "people" && (
              <PeopleList
                db={db}
                live={live}
                now={now}
                onOpenContact={setOpenContact}
                onAdd={(email) => setEditContact({ id: null, prefill: email })}
                onDismiss={(email) =>
                  setState((prev) => {
                    const d = normalizeDb(prev);
                    return { ...d, dismissed: [...d.dismissed, email] };
                  })
                }
              />
            )}
            {seg === "groups" && (
              <GroupsList db={db} now={now} live={live} onOpenGroup={setOpenGroup} onNewGroup={() => setOpenGroup("new")} />
            )}
            {seg === "network" && (
              <NetworkPanel db={db} setState={setState} onOpenContact={setOpenContact} onOpenLink={() => setLinkOpen(true)} />
            )}
          </div>
        </>
      )}

      {openContact && (
        <ContactDetailModal
          id={openContact}
          db={db}
          live={live}
          now={now}
          setState={setState}
          onClose={() => setOpenContact(null)}
          onEdit={(id) => {
            setOpenContact(null);
            setEditContact({ id });
          }}
          onOpenGroup={(g) => {
            setOpenContact(null);
            setOpenGroup(g);
          }}
        />
      )}
      {editContact && (
        <ContactEditModal init={editContact} db={db} live={live} setState={setState} onClose={() => setEditContact(null)} />
      )}
      {openGroup && (
        <GroupEditModal
          id={openGroup === "new" ? null : openGroup}
          db={db}
          live={live}
          now={now}
          setState={setState}
          onClose={() => setOpenGroup(null)}
        />
      )}
      {settings && <CrmSettingsModal db={db} live={live} setState={setState} onClose={() => setSettings(false)} googleStatus={googleStatus} />}
      {linkOpen && <LinkModal db={db} setState={setState} isOverdue={(c) => stateOf(c).overdue} onClose={() => setLinkOpen(false)} />}

      <AskPanel db={db} stateOf={stateOf} now={now} />
    </div>
  );
}
