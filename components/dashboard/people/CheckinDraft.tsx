"use client";

import { useEffect, useState } from "react";
import { askAi, createGmailDraft } from "@/lib/dashboard/people/client-ai";
import { buildCheckinPrompt } from "@/lib/dashboard/people/ai-prompts";
import { contactEmails } from "@/lib/dashboard/people/interactions";
import type { Contact } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";

/**
 * Self-contained check-in draft. On mount, asks the AI for a draft message, then lets the
 * human copy it or (only if the contact has an email) save it as a Gmail draft — but ONLY
 * after an explicit second "Confirm" click on a rendered "Create draft to {email}?" prompt.
 * Nothing is ever sent; createGmailDraft only creates a draft.
 */
export function CheckinDraft({ contact, recent, days }: { contact: Contact; recent: string[]; days: number | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    askAi("draft_checkin", buildCheckinPrompt(contact, recent, days))
      .then((r) => { if (alive) setText(r.trim().replace(/^["']|["']$/g, "")); })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error && err.message ? err.message : "Drafting is unavailable right now.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // Runs once per mount (component is toggled in/out by the parent) — mirrors useLiveInteractions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primary = contactEmails(contact)[0] || "";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(text);
    setCopyMsg("Copied.");
  };

  const handleConfirmSave = () => {
    setSaving(true);
    setSaveMsg(null);
    createGmailDraft([primary], [], "Hi from Hamzeh", text)
      .then((r) => setSaveMsg(`Saved to Gmail drafts ✓ (to ${r.to.join(", ")})`))
      .catch(() => setSaveMsg("Could not save draft."))
      .finally(() => { setSaving(false); setConfirming(false); });
  };

  if (loading) {
    return <div className="mt-3 text-[13px] text-stone-500">Drafting a warm check-in…</div>;
  }
  if (error) {
    return <div className="mt-3 text-[13px] text-[#A51C30]">{error}</div>;
  }

  return (
    <div className="mt-3 rounded-[10px] border border-stone-200 p-3">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setCopyMsg(null); }}
        rows={5}
        className="w-full rounded-[8px] border border-stone-200 p-2.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleCopy} className={btnGhost} style={mono}>
          Copy
        </button>
        {primary && !confirming && (
          <button type="button" onClick={() => { setConfirming(true); setSaveMsg(null); }} className={btnPrimary} style={mono}>
            Save to Gmail draft
          </button>
        )}
        {copyMsg && <span className="text-[12px] text-stone-500">{copyMsg}</span>}
      </div>

      {confirming && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[8px] bg-[#f9f8f6] p-2.5 text-[12px] text-stone-600">
          <span>Create draft to {primary}? Nothing is sent.</span>
          <button type="button" onClick={handleConfirmSave} disabled={saving} className={btnPrimary} style={mono}>
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={btnGhost} style={mono}>
            Cancel
          </button>
        </div>
      )}

      {saveMsg && <div className="mt-2 text-[12px] text-stone-600">{saveMsg}</div>}
    </div>
  );
}
