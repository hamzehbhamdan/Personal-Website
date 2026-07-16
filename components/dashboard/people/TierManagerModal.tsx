"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { migrateTiers, type TierRow } from "@/lib/dashboard/people/tiers";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import type { CrmDB } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const btnGhostSmall = "rounded-[6px] border border-stone-200 px-2.5 py-1.5 font-mono text-[11px] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-500";
const noteCls = "text-[11.5px] text-stone-500";
const inputCls = "w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

// A row carries a stable synthetic React key (`_k`) alongside the TierRow fields
// (`orig`/`name`/`cad`) so add/delete doesn't reshuffle input focus/identity; `_k` is
// stripped back out before the rows are handed to migrateTiers.
interface EditRow extends TierRow { _k: number; }

/**
 * Manage relationship tiers modal. Port of openTiers/saveTiers (crm.html:599-624).
 *
 * All of the tier-rewrite/migration logic (renaming a tier cascades to every contact +
 * every smart-group rule referencing it; deleting/renaming-away a tier falls contacts back
 * to the first remaining tier) lives in the tested `migrateTiers` — this component only
 * collects the edited rows and hands them off. Save derives ONLY from `normalizeDb(prev)`
 * inside the updater (never from the `db` prop captured at render) per the state-mutation
 * convention, so a stale render can't clobber a concurrent write.
 */
export function TierManagerModal({ db, setState, onClose }: {
  db: CrmDB;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onClose: () => void;
}) {
  const nextKey = useRef(0);
  const [rows, setRows] = useState<EditRow[]>(() =>
    db.tiers.map((t) => ({ _k: nextKey.current++, orig: t.name, name: t.name, cad: t.cadenceDays }))
  );

  function updateRow(k: number, patch: Partial<Pick<EditRow, "name" | "cad">>) {
    setRows((rs) => rs.map((r) => (r._k === k ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, { _k: nextKey.current++, orig: "", name: "", cad: 90 }]);
  }

  // Port of bindTierDel (crm.html:612): never remove the last row.
  function deleteRow(k: number) {
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r._k !== k)));
  }

  function handleSave() {
    const payload: TierRow[] = rows.map(({ orig, name, cad }) => ({ orig, name, cad }));
    setState((prev) => migrateTiers(normalizeDb(prev), payload));
    onClose();
  }

  return (
    <Modal title="Manage relationship tiers" onClose={onClose}>
      <div className={noteCls}>
        Rename, re-time, add, or remove tiers. Renaming updates everyone in that tier; deleting moves them to the first tier.
      </div>

      <div className="mt-2.5 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r._k} className="flex items-center gap-2">
            <input
              value={r.name}
              onChange={(e) => updateRow(r._k, { name: e.target.value })}
              placeholder="Tier name"
              className={inputCls}
            />
            <input
              type="number"
              value={r.cad}
              onChange={(e) => updateRow(r._k, { cad: Number(e.target.value) || 0 })}
              title="cadence days"
              className={cn(inputCls, "w-[92px] shrink-0")}
            />
            <button
              type="button"
              onClick={() => deleteRow(r._k)}
              disabled={rows.length <= 1}
              aria-label={`Remove ${r.name || "tier"}`}
              className={cn(btnGhostSmall, "shrink-0")}
              style={mono}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className={cn(btnGhost, "mt-2.5")} style={mono}>
        + Add tier
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        <button type="button" onClick={onClose} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
