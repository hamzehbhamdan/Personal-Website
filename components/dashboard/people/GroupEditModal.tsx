"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { AvatarEditor } from "@/components/dashboard/people/AvatarEditor";
import { GroupUpdateDraft } from "@/components/dashboard/people/GroupUpdateDraft";
import { getGroup, allTags } from "@/lib/dashboard/people/select";
import { tierNames } from "@/lib/dashboard/people/tiers";
import { membersOf } from "@/lib/dashboard/people/groups";
import { state } from "@/lib/dashboard/people/state";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { initials } from "@/lib/dashboard/people/text";
import type { CrmDB, Contact, Group, GroupType, RuleKind } from "@/lib/dashboard/people/types";
import type { LiveState } from "@/components/dashboard/people/useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const labelCls = "mb-1 block text-[11px] text-stone-500";
const inputCls = "w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

// Port of toDateInput (crm.html:491): ISO -> "YYYY-MM-DD" for a date input, "" when null.
function toDateInput(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

interface FormState {
  name: string;
  avatarImg: string | null;
  cadenceDays: number;
  notes: string;
  type: GroupType;
  ruleKind: RuleKind;
  ruleValue: string; // only meaningful for ruleKind tier|tag
  lastTouchInput: string; // "YYYY-MM-DD" date-input value, "" if unset
}

/**
 * Add/edit group modal. Port of openGroup (crm.html:518-569).
 *
 * `db`/`live`/`now` are read-only snapshots for seeding the form and rendering (tier/tag lists,
 * the live smart-rule preview, and the manual-membership checklist). All writes go through
 * `setState` using the STATE-MUTATION CONVENTION: every updater re-derives `existing`/`groups`
 * from `normalizeDb(prev)`, never from the `db` prop captured at render, so a stale render can't
 * clobber a concurrent write.
 *
 * The "Last update sent" field mirrors the artifact's `gLast` date input (crm.html:491,529):
 * it's an editable date bound to `form.lastTouchInput`, seeded from the existing group's
 * `lastTouch` and, on Save/Log/Snooze, written back as `lastTouch` (via `buildGroupObject`) so a
 * group's last-touch date can be backfilled directly, not just advanced by Log/Snooze.
 */
export function GroupEditModal({ id, db, live, now, setState, onClose }: {
  id: string | null;
  db: CrmDB;
  live: LiveState;
  now: Date;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onClose: () => void;
}) {
  const existing = id ? getGroup(db, id) : undefined;
  const tiers = tierNames(db);
  const tags = allTags(db);
  // Stable for the life of this modal session (mirrors the artifact's editingGroup.id, assigned
  // once at open time so Draft/Log/Snooze/Save all target the same row).
  const [groupId] = useState<string>(() => id ?? `grp-${Date.now()}`);

  const [form, setForm] = useState<FormState>(() => {
    const rk: RuleKind = existing?.rule?.kind ?? "tier";
    const list = rk === "tier" ? tiers : rk === "tag" ? tags : [];
    const rv = existing?.rule?.value && list.includes(existing.rule.value) ? existing.rule.value : (list[0] ?? "");
    return {
      name: existing?.name ?? "",
      avatarImg: existing?.avatarImg ?? null,
      cadenceDays: existing?.cadenceDays ?? 90,
      notes: existing?.notes ?? "",
      type: existing?.type ?? "manual",
      ruleKind: rk,
      ruleValue: rv,
      lastTouchInput: toDateInput(existing?.lastTouch ?? null),
    };
  });

  const [checkedMembers, setCheckedMembers] = useState<Set<string>>(
    () => new Set(existing?.members || [])
  );

  // Dirty tracking for the close guard (mirrors ContactEditModal's pattern): snapshot the
  // initial form + membership on mount; FormState is flat JSON-safe data so stringify is a
  // stable value comparison. handleSave/handleDelete call onClose() directly (guard bypassed).
  // Uses useState (not useRef) for the immutable initial snapshot: it's never reassigned after
  // mount, but reading it every render satisfies the react-hooks/refs rule (refs must not be
  // read during render) while a plain lazy-initialized state value is exactly meant for this.
  const membersKey = (s: Set<string>) => [...s].sort().join(",");
  const snapshot = () => JSON.stringify({ form, members: membersKey(checkedMembers) });
  const [initialSnapshot] = useState(() => snapshot());
  const dirty = snapshot() !== initialSnapshot;
  // Single guard shared by the Modal (backdrop/Escape/×) AND the Cancel button.
  const confirmClose = () => !dirty || window.confirm("Discard unsaved changes to this group?");

  const [showDraft, setShowDraft] = useState(false);

  function handleRuleKindChange(kind: RuleKind) {
    setForm((f) => {
      const list = kind === "tier" ? tiers : kind === "tag" ? tags : [];
      const value = list.includes(f.ruleValue) ? f.ruleValue : (list[0] ?? "");
      return { ...f, ruleKind: kind, ruleValue: value };
    });
  }

  function handleCadenceChange(raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    setForm((f) => ({ ...f, cadenceDays: Number.isFinite(n) ? n : 0 }));
  }

  function toggleMember(contactId: string, checked: boolean) {
    setCheckedMembers((prev) => {
      const next = new Set(prev);
      if (checked) next.add(contactId); else next.delete(contactId);
      return next;
    });
  }

  // Port of readGroupForm (crm.html:492-497). `existingRow` must be resolved fresh (from
  // normalizeDb(prev) inside a setState updater, or from the read-only `existing` prop snapshot
  // for display-only previews) — never a captured stale reference.
  function buildGroupObject(existingRow: Group | undefined): Group {
    const checkedIds = [...checkedMembers];
    return {
      id: groupId,
      name: form.name.trim() || "Untitled group",
      type: form.type,
      rule: form.type === "smart"
        ? { kind: form.ruleKind, value: (form.ruleKind === "tier" || form.ruleKind === "tag") ? form.ruleValue : null }
        : null,
      members: form.type === "manual" ? checkedIds : (existingRow?.members || []),
      notes: form.notes,
      cadenceDays: form.cadenceDays || null,
      lastTouch: form.lastTouchInput ? new Date(form.lastTouchInput).toISOString() : (existingRow?.lastTouch ?? null),
      snoozeUntil: existingRow?.snoozeUntil ?? null,
      avatarImg: form.avatarImg,
    };
  }

  function upsert(nextDb: CrmDB, built: Group): Group[] {
    const has = nextDb.groups.some((g) => g.id === groupId);
    return has ? nextDb.groups.map((g) => (g.id === groupId ? built : g)) : [...nextDb.groups, built];
  }

  function handleSave() {
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      const existingRow = nextDb.groups.find((g) => g.id === groupId);
      const built = buildGroupObject(existingRow);
      return { ...nextDb, groups: upsert(nextDb, built) };
    });
    onClose();
  }

  // Log update (today): port crm.html:565 — persist current form, then set lastTouch=now and
  // clear snoozeUntil. Keeps the modal open (re-read via `existing`/`db` on next parent render
  // is fine) rather than closing — controller design choice, so pending form edits aren't lost.
  function handleLog() {
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      const existingRow = nextDb.groups.find((g) => g.id === groupId);
      const built: Group = { ...buildGroupObject(existingRow), lastTouch: now.toISOString(), snoozeUntil: null };
      return { ...nextDb, groups: upsert(nextDb, built) };
    });
  }

  // Snooze 30d: port crm.html:566 — persist current form, then push snoozeUntil out 30 days.
  function handleSnooze() {
    const snoozeUntil = new Date(now.getTime() + 30 * 86400000).toISOString();
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      const existingRow = nextDb.groups.find((g) => g.id === groupId);
      const built: Group = { ...buildGroupObject(existingRow), snoozeUntil };
      return { ...nextDb, groups: upsert(nextDb, built) };
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete group "${existing?.name ?? (form.name.trim() || "this group")}"? Members stay as contacts; the group's notes and cadence are lost.`)) return;
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      return { ...nextDb, groups: nextDb.groups.filter((g) => g.id !== groupId) };
    });
    onClose();
  }

  const title = existing ? `Edit ${existing.name}` : "New group";

  // Live smart-rule preview (crm.html:514-515): membersOf against a throwaway preview group
  // (never persisted) built from the in-progress rule, so it updates as kind/value change.
  const overdueOf = (c: Contact) => state(c, live.gmail, live.cal, db, now).overdue;
  const previewGroup: Group = {
    id: "__preview__",
    name: "",
    type: "smart",
    rule: {
      kind: form.ruleKind,
      value: (form.ruleKind === "tier" || form.ruleKind === "tag") ? form.ruleValue : null,
    },
    members: [],
    cadenceDays: null,
    lastTouch: null,
    snoozeUntil: null,
  };
  const previewCount = membersOf(db, previewGroup, overdueOf).length;

  const sortedContacts = [...db.contacts].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal title={title} onClose={onClose} confirmClose={confirmClose}>
      <div className="mb-3">
        <label className={labelCls}>Group name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Quarterly life update"
          className={inputCls}
        />
      </div>

      <div className="mb-3">
        <AvatarEditor
          avatarImg={form.avatarImg ?? null}
          initials={initials(form.name)}
          onChange={(img) => setForm((f) => ({ ...f, avatarImg: img }))}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Reach out every (days)</label>
          <input
            type="number"
            value={form.cadenceDays}
            onChange={(e) => handleCadenceChange(e.target.value)}
            placeholder="90"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Last update sent</label>
          <input
            type="date"
            value={form.lastTouchInput}
            onChange={(e) => setForm((f) => ({ ...f, lastTouchInput: e.target.value }))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Purpose / notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          placeholder="What this group is for…"
          className={inputCls}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>Membership</label>
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GroupType }))}
          className={inputCls}
        >
          <option value="manual">Manual list</option>
          <option value="smart">Smart (auto by rule)</option>
        </select>
      </div>

      {form.type === "smart" && (
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Rule</label>
              <select
                value={form.ruleKind}
                onChange={(e) => handleRuleKindChange(e.target.value as RuleKind)}
                className={inputCls}
              >
                <option value="tier">By tier</option>
                <option value="tag">By tag</option>
                <option value="overdue">Anyone overdue</option>
                <option value="all">All contacts</option>
              </select>
            </div>
            {(form.ruleKind === "tier" || form.ruleKind === "tag") && (
              <div>
                <label className={labelCls}>Value</label>
                {form.ruleKind === "tier" ? (
                  <select
                    value={form.ruleValue}
                    onChange={(e) => setForm((f) => ({ ...f, ruleValue: e.target.value }))}
                    className={inputCls}
                  >
                    {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : tags.length ? (
                  <select
                    value={form.ruleValue}
                    onChange={(e) => setForm((f) => ({ ...f, ruleValue: e.target.value }))}
                    className={inputCls}
                  >
                    {tags.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <select disabled className={inputCls}>
                    <option value="">(no tags yet)</option>
                  </select>
                )}
              </div>
            )}
          </div>
          <div className="mt-1.5 text-[11.5px] text-stone-500">
            {previewCount} contact{previewCount === 1 ? "" : "s"} match this rule right now.
          </div>
        </div>
      )}

      {form.type === "manual" && (
        <div className="mb-3">
          <label className={labelCls}>Members ({checkedMembers.size} selected)</label>
          {sortedContacts.length === 0 ? (
            <div className="text-[13px] text-stone-500">Add contacts first.</div>
          ) : (
            <div className="flex max-h-[220px] flex-col gap-1.5 overflow-auto rounded-[6px] border border-stone-200 p-2">
              {sortedContacts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] text-stone-700">
                  <input
                    type="checkbox"
                    checked={checkedMembers.has(c.id)}
                    onChange={(e) => toggleMember(c.id, e.target.checked)}
                  />
                  {c.name}
                  <span className="text-[11px] text-stone-400">{c.tier}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowDraft((v) => !v)} className={btnGhost} style={mono}>
          Draft group update
        </button>
        <button type="button" onClick={handleLog} className={btnGhost} style={mono}>
          Log update (today)
        </button>
        <button type="button" onClick={handleSnooze} className={btnGhost} style={mono}>
          Snooze 30d
        </button>
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        {existing && (
          <button type="button" onClick={handleDelete} className={btnGhost} style={mono}>
            Delete
          </button>
        )}
        <button type="button" onClick={() => { if (confirmClose()) onClose(); }} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>

      {showDraft && (
        <GroupUpdateDraft group={buildGroupObject(existing)} db={db} live={live} now={now} />
      )}
    </Modal>
  );
}
