"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { AvatarEditor } from "@/components/dashboard/people/AvatarEditor";
import { getContact } from "@/lib/dashboard/people/select";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { interactionsFor } from "@/lib/dashboard/people/interactions";
import { lc, nameFromEmail, initials } from "@/lib/dashboard/people/text";
import { tierNames, tierCad } from "@/lib/dashboard/people/tiers";
import { buildTagsPrompt, parseTagsResponse } from "@/lib/dashboard/people/ai-prompts";
import { askAi } from "@/lib/dashboard/people/client-ai";
import type { CrmDB, Contact } from "@/lib/dashboard/people/types";
import type { LiveState } from "@/components/dashboard/people/useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const btnGhostSmall = "rounded-[6px] border border-stone-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const labelCls = "mb-1 block text-[11px] text-stone-500";
const inputCls = "w-full rounded-[6px] border border-stone-200 px-2 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

interface FormState {
  name: string;
  avatarImg: string | null;
  emails: string; // raw comma-separated text; parsed into an array at save/suggest time
  tier: string;
  cadenceDays: number;
  cadenceTouched: boolean; // once true, tier changes no longer overwrite cadenceDays
  phone: string;
  birthday: string;
  tags: string; // raw comma-separated text
  howWeMet: string;
  notes: string;
}

/**
 * Add/edit contact modal. Port of openEdit (crm.html:443-486).
 *
 * `db`/`live` are read-only snapshots for seeding the form and rendering (tier list, manual
 * groups, gmail/cal maps for the tag-suggest probe). All writes go through `setState` using the
 * STATE-MUTATION CONVENTION: every updater re-derives from `normalizeDb(prev)`, never from the
 * `db` prop captured at render, so a stale render can't clobber a concurrent write.
 */
export function ContactEditModal({ init, db, live, setState, onClose }: {
  init: { id: string | null; prefill?: string };
  db: CrmDB;
  live: LiveState;
  setState: (u: (prev: CrmDB) => CrmDB) => void;
  onClose: () => void;
}) {
  const contact = init.id ? getContact(db, init.id) : undefined;
  const tiers = tierNames(db);
  const manualGroups = db.groups.filter((g) => g.type !== "smart");

  const [form, setForm] = useState<FormState>(() => {
    const defaultTier = contact?.tier ?? (tiers[2] ?? tiers[0] ?? "Friends");
    return {
      name: contact?.name ?? (init.prefill ? nameFromEmail(init.prefill) : ""),
      avatarImg: contact?.avatarImg ?? null,
      emails: contact ? contact.emails.map(lc).join(", ") : (init.prefill ?? ""),
      tier: defaultTier,
      cadenceDays: contact?.cadenceDays ?? tierCad(db, defaultTier),
      cadenceTouched: false,
      phone: contact?.phone ?? "",
      birthday: contact?.birthday ?? "",
      tags: contact ? (contact.tags || []).join(", ") : "",
      howWeMet: contact?.howWeMet ?? "",
      notes: contact?.notes ?? "",
    };
  });

  const [checkedGroups, setCheckedGroups] = useState<Set<string>>(
    () => new Set(manualGroups.filter((g) => contact && (g.members || []).includes(contact.id)).map((g) => g.id))
  );

  const [suggesting, setSuggesting] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  // Include group-membership edits (checkedGroups) in the dirty check, not just
  // the text form — otherwise a group-only change is silently discarded on close.
  const snapshot = () => JSON.stringify({ form, groups: [...checkedGroups].sort() });
  const initialRef = useRef(snapshot());
  const dirty = snapshot() !== initialRef.current;
  // Single guard shared by the Modal (backdrop/Escape/×) AND the Cancel button.
  const confirmClose = () => !dirty || window.confirm("Discard unsaved changes to this contact?");

  function handleTierChange(newTier: string) {
    setForm((f) => ({
      ...f,
      tier: newTier,
      cadenceDays: f.cadenceTouched ? f.cadenceDays : tierCad(db, newTier),
    }));
  }

  function handleCadenceChange(raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    setForm((f) => ({ ...f, cadenceDays: Number.isFinite(n) ? n : 0, cadenceTouched: true }));
  }

  function toggleGroup(id: string, checked: boolean) {
    setCheckedGroups((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  // Suggest tags: build a throwaway probe Contact (never persisted) so interactionsFor can read
  // synced-email subjects for the emails currently typed in the form. Graceful on AI failure —
  // errors are caught and surfaced inline; they never bubble out of the handler. `system` is
  // intentionally omitted from askAi (never pass "").
  async function handleSuggestTags() {
    setSuggesting(true);
    setSuggestMsg(null);
    try {
      const emails = form.emails.split(",").map(lc).filter(Boolean);
      const probe = { ...form, emails, id: "", tags: [], log: [], lastTouch: null, snoozeUntil: null } as Contact;
      const subjects = interactionsFor(probe, live.gmail, live.cal)
        .filter((i) => i.type === "email")
        .map((i) => i.text);
      const result = await askAi("suggest_tags", buildTagsPrompt({ name: form.name, tier: form.tier, notes: form.notes, subjects }));
      const parsed = parseTagsResponse(result);
      if (parsed.length) {
        setForm((f) => {
          const current = f.tags.split(",").map((t) => t.trim()).filter(Boolean);
          const merged = [...new Set([...current, ...parsed])];
          return { ...f, tags: merged.join(", ") };
        });
      } else {
        setSuggestMsg("No suggestions.");
      }
    } catch {
      setSuggestMsg("Suggest is unavailable right now.");
    } finally {
      setSuggesting(false);
    }
  }

  // Save derives the contact + group-membership deltas ONLY from normalizeDb(prev) inside the
  // updater (never from the `db`/`contact` props captured at render) per the state-mutation
  // convention, so a stale render never clobbers a concurrent write.
  function handleSave() {
    const emails = form.emails.split(",").map(lc).filter(Boolean);
    const name = form.name.trim() || (emails[0] ? nameFromEmail(emails[0]) : "Unnamed");
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const id = contact ? contact.id : (emails[0] || `${name.toLowerCase()}-${Date.now()}`);
    const checked = checkedGroups;

    setState((prev) => {
      const nextDb = normalizeDb(prev);
      const cadenceDays = form.cadenceDays || tierCad(nextDb, form.tier);
      const existing = nextDb.contacts.find((x) => x.id === id);
      const built: Contact = {
        id,
        name,
        emails,
        phone: form.phone.trim(),
        tier: form.tier,
        cadenceDays,
        birthday: form.birthday.trim(),
        howWeMet: form.howWeMet.trim(),
        tags,
        notes: form.notes,
        avatarImg: form.avatarImg,
        log: existing ? existing.log : [],
        lastTouch: existing ? existing.lastTouch : null,
        snoozeUntil: existing ? existing.snoozeUntil : null,
      };
      const contacts = existing
        ? nextDb.contacts.map((x) => (x.id === id ? built : x))
        : [...nextDb.contacts, built];
      const groups = nextDb.groups.map((g) => {
        if (g.type === "smart") return g;
        const members = g.members || [];
        const shouldBeIn = checked.has(g.id);
        const isIn = members.includes(id);
        if (shouldBeIn === isIn) return g;
        return { ...g, members: shouldBeIn ? [...members, id] : members.filter((m) => m !== id) };
      });
      // New contacts (no `existing` row in the fresh db) drop their emails from `dismissed`,
      // matching crm.html:480 — covers both the manual-add and accept-a-suggestion (init.prefill) paths.
      const dismissed = existing ? nextDb.dismissed : nextDb.dismissed.filter((e) => !emails.includes(e));
      return { ...nextDb, contacts, groups, dismissed };
    });
    onClose();
  }

  // Delete derives ONLY from normalizeDb(prev) inside the updater; strips the contact from every
  // group's members list (port crm.html:474).
  function handleDelete() {
    if (!contact) return;
    const id = contact.id;
    setState((prev) => {
      const nextDb = normalizeDb(prev);
      return {
        ...nextDb,
        contacts: nextDb.contacts.filter((c) => c.id !== id),
        groups: nextDb.groups.map((g) => ({ ...g, members: (g.members || []).filter((m) => m !== id) })),
      };
    });
    onClose();
  }

  const title = contact ? `Edit ${contact.name}` : "Add contact";

  return (
    <Modal
      title={title}
      onClose={onClose}
      confirmClose={confirmClose}
    >
      <div className="mb-3">
        <label className={labelCls}>Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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

      <div className="mb-3">
        <label className={labelCls}>Email(s), comma separated</label>
        <input
          value={form.emails}
          onChange={(e) => setForm((f) => ({ ...f, emails: e.target.value }))}
          className={inputCls}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Tier</label>
          <select value={form.tier} onChange={(e) => handleTierChange(e.target.value)} className={inputCls}>
            {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Reach out every (days)</label>
          <input
            type="number"
            value={form.cadenceDays}
            onChange={(e) => handleCadenceChange(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 555 123 4567"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Birthday (MM-DD)</label>
          <input
            value={form.birthday}
            onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
            placeholder="04-17"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center gap-2">
          <label className={labelCls}>Tags (comma separated)</label>
          {db.settings.autoTags && (
            <button type="button" onClick={handleSuggestTags} disabled={suggesting} className={btnGhostSmall} style={mono}>
              {suggesting ? "…" : "Suggest"}
            </button>
          )}
          {suggestMsg && <span className="text-[11px] text-stone-400">{suggestMsg}</span>}
        </div>
        <input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="college, investors, gym"
          className={inputCls}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>How you met</label>
        <input
          value={form.howWeMet}
          onChange={(e) => setForm((f) => ({ ...f, howWeMet: e.target.value }))}
          className={inputCls}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={4}
          className={cn(inputCls, "min-h-[80px]")}
        />
      </div>

      {manualGroups.length > 0 && (
        <div className="mb-3">
          <label className={labelCls}>Groups</label>
          <div className="flex flex-col gap-1.5">
            {manualGroups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-[13px] text-stone-700">
                <input
                  type="checkbox"
                  checked={checkedGroups.has(g.id)}
                  onChange={(e) => toggleGroup(g.id, e.target.checked)}
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        {contact && (
          <button type="button" onClick={handleDelete} className={btnGhost} style={mono}>
            Delete
          </button>
        )}
        <button type="button" onClick={() => { if (confirmClose()) onClose(); }} className={btnGhost} style={mono}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
