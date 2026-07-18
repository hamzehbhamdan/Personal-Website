"use client";
import { useMemo, useState } from "react";
import { Modal, Segmented } from "@/components/dashboard/ui";
import type { Contact, CrmDB } from "@/lib/dashboard/people/types";
import { membersOf } from "@/lib/dashboard/people/groups";
import { cliqueEdges, edgeKey, mergeClique } from "@/lib/dashboard/people/connections";
import { normalizeDb } from "@/lib/dashboard/people/backup";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-40";
const btnGhost =
  "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300";

/** "Everyone here knows each other" — clique-connect a group's members OR an
 *  ad-hoc list of picked contacts. Idempotent (skips existing pairs). */
export function LinkModal({ db, setState, isOverdue, onClose }: {
  db: CrmDB;
  setState: (fn: (prev: CrmDB) => CrmDB) => void;
  isOverdue: (c: Contact) => boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"group" | "list">(db.groups.length ? "group" : "list");
  const [groupId, setGroupId] = useState<string>(db.groups[0]?.id ?? "");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const memberIds = useMemo(() => {
    if (mode === "group") {
      const g = db.groups.find((x) => x.id === groupId);
      return g ? membersOf(db, g, isOverdue) : [];
    }
    return [...picked];
  }, [mode, groupId, picked, db, isOverdue]);

  const { newCount, already } = useMemo(() => {
    const existing = new Set(db.connections.map(edgeKey));
    const clique = cliqueEdges(memberIds);
    const nw = clique.filter((e) => !existing.has(edgeKey(e))).length;
    return { newCount: nw, already: clique.length - nw };
  }, [memberIds, db.connections]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? db.contacts.filter((c) => c.name.toLowerCase().includes(s) || c.emails.some((e) => e.toLowerCase().includes(s)))
      : db.contacts;
    return list.slice(0, 200);
  }, [q, db.contacts]);

  function toggle(id: string) {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function apply() {
    if (memberIds.length < 2 || newCount === 0) return;
    setState((prev) => {
      const d = normalizeDb(prev);
      return { ...d, connections: mergeClique(d.connections, memberIds) };
    });
    onClose();
  }

  return (
    <Modal title="Connect people" onClose={onClose}>
      <p className="mb-4 text-[12px] leading-relaxed text-stone-500">
        Mark a set of people as all knowing each other — this adds a connection between every pair, skipping any that already exist.
      </p>

      <Segmented<"group" | "list">
        value={mode}
        onChange={setMode}
        options={[
          { value: "group", label: "From a group" },
          { value: "list", label: "Pick people" },
        ]}
      />

      <div className="mt-4">
        {mode === "group" ? (
          db.groups.length === 0 ? (
            <p className="text-[12px] text-stone-400">No groups yet — switch to “Pick people”.</p>
          ) : (
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-[8px] border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-800"
            >
              {db.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({membersOf(db, g, isOverdue).length})
                </option>
              ))}
            </select>
          )
        ) : (
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people…"
              className="mb-2 w-full rounded-[8px] border border-stone-200 px-3 py-2 text-[13px]"
            />
            <div className="max-h-[280px] overflow-auto rounded-[8px] border border-stone-200">
              {filtered.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 border-b border-stone-100 px-3 py-2 last:border-0 hover:bg-stone-50">
                  <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
                  <span className="text-[13px] text-stone-800">{c.name}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400" style={mono}>{c.tier}</span>
                </label>
              ))}
              {filtered.length === 0 && <p className="px-3 py-4 text-[12px] text-stone-400">No matches.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[12px] text-stone-500">
          {memberIds.length < 2 ? (
            "Select at least 2 people."
          ) : (
            <>
              {memberIds.length} people · <span className="text-[#A51C30]">{newCount} new</span>
              {already ? ` · ${already} already connected` : ""}
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className={btnGhost} style={mono}>Cancel</button>
          <button onClick={apply} disabled={memberIds.length < 2 || newCount === 0} className={btnPrimary} style={mono}>
            {newCount > 0 ? `Add ${newCount} connection${newCount === 1 ? "" : "s"}` : "Connect"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
