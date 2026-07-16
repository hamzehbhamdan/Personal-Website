"use client";

import { useEffect, useState } from "react";
import { askAi, createGmailDraft } from "@/lib/dashboard/people/client-ai";
import { buildGroupUpdatePrompt } from "@/lib/dashboard/people/ai-prompts";
import { contactEmails } from "@/lib/dashboard/people/interactions";
import { getContact } from "@/lib/dashboard/people/select";
import { membersOf } from "@/lib/dashboard/people/groups";
import { state } from "@/lib/dashboard/people/state";
import { MY_EMAILS } from "@/lib/dashboard/people/text";
import type { CrmDB, Contact, Group } from "@/lib/dashboard/people/types";
import type { LiveState } from "@/components/dashboard/people/useLiveInteractions";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const selectCls = "rounded-[6px] border border-stone-200 px-2 py-1 text-[12px] text-stone-800 outline-none focus:border-[#A51C30]";

type SendMode = "bcc" | "to";

/**
 * Self-contained group-update draft. Port of draftGroupUpdate (crm.html:570-596).
 *
 * `db`/`live`/`now` are read-only snapshots used only to resolve the LIVE member list (via
 * membersOf + the contact overdue predicate) and their emails — nothing here writes state.
 * On mount, asks the AI for a draft body (task "group_update", `system` intentionally omitted).
 * Before ever creating a Gmail draft, the full resolved recipient list and chosen send mode are
 * rendered and an explicit "Confirm" click is required. createGmailDraft only ever creates a
 * draft — nothing is ever sent.
 */
export function GroupUpdateDraft({ group, db, live, now }: {
  group: Group;
  db: CrmDB;
  live: LiveState;
  now: Date;
}) {
  const overdueOf = (c: Contact) => state(c, live.gmail, live.cal, db, now).overdue;
  const memberIds = membersOf(db, group, overdueOf);
  const members = memberIds.map((id) => getContact(db, id)).filter((c): c is Contact => !!c);
  const emails = [...new Set(members.map((m) => contactEmails(m)[0]).filter(Boolean))];
  const hasRecipients = members.length > 0 && emails.length > 0;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SendMode>("bcc");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRecipients) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    setError(null);
    askAi("group_update", buildGroupUpdatePrompt(group.name, group.notes ?? "", members.map((m) => m.name)))
      .then((r) => { if (alive) setText(r.trim().replace(/^["']|["']$/g, "")); })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error && err.message ? err.message : "Drafting is unavailable right now.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // Runs once per mount (component is toggled in/out by the parent) — mirrors CheckinDraft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasRecipients) {
    return <div className="mt-3 text-[13px] text-stone-500">No members match yet.</div>;
  }
  if (loading) {
    return <div className="mt-3 text-[13px] text-stone-500">Drafting a group update…</div>;
  }
  if (error) {
    return <div className="mt-3 text-[13px] text-[#A51C30]">{error}</div>;
  }

  const hint = mode === "to"
    ? `Draft will be addressed TO all ${emails.length} members (they'll see each other).`
    : `Draft will go TO you, BCC all ${emails.length} members (they won't see each other).`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text);
    setCopyMsg("Copied.");
  };

  // Confirm-before-draft: only reachable after the explicit "Confirm" click below, which is only
  // rendered once the full recipient list + mode are shown to the human. Never auto-sends —
  // createGmailDraft only ever creates a Gmail draft.
  const handleConfirmSave = () => {
    setSaving(true);
    setSaveMsg(null);
    const p = mode === "to"
      ? createGmailDraft(emails, [], group.name, text)
      : createGmailDraft([MY_EMAILS[0]], emails, group.name, text);
    p.then((r) => {
      setSaveMsg(mode === "to"
        ? `Saved to Gmail drafts ✓ (TO all: ${r.to.join(", ")})`
        : `Saved to Gmail drafts ✓ (BCC group: ${r.bcc.join(", ")})`);
    })
      .catch(() => setSaveMsg("Could not save draft."))
      .finally(() => { setSaving(false); setConfirming(false); });
  };

  return (
    <div className="mt-3 rounded-[10px] border border-stone-200 p-3">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setCopyMsg(null); }}
        rows={6}
        className="w-full rounded-[8px] border border-stone-200 p-2.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleCopy} className={btnGhost} style={mono}>
          Copy
        </button>
        <label className="flex items-center gap-1.5 text-[12px] text-stone-500">
          Send as
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value as SendMode); setConfirming(false); }}
            className={selectCls}
          >
            <option value="bcc">BCC — private (recommended)</option>
            <option value="to">TO — everyone sees the list</option>
          </select>
        </label>
        {!confirming && (
          <button type="button" onClick={() => { setConfirming(true); setSaveMsg(null); }} className={btnPrimary} style={mono}>
            Save to Gmail draft
          </button>
        )}
        {copyMsg && <span className="text-[12px] text-stone-500">{copyMsg}</span>}
      </div>
      <div className="mt-1.5 text-[11.5px] text-stone-500">{hint}</div>

      {confirming && (
        <div className="mt-2.5 rounded-[8px] bg-[#f9f8f6] p-2.5 text-[12px] text-stone-600">
          <div className="mb-1.5">
            Create draft {mode === "to" ? "TO" : "BCC"} {emails.length} recipient{emails.length === 1 ? "" : "s"}: {emails.join(", ")}.
            {" "}Nothing is sent.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleConfirmSave} disabled={saving} className={btnPrimary} style={mono}>
              {saving ? "Saving…" : "Confirm"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={btnGhost} style={mono}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {saveMsg && <div className="mt-2 text-[12px] text-stone-600">{saveMsg}</div>}
    </div>
  );
}
