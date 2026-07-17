"use client";

import { useEffect, useRef, useState } from "react";
import { askAi, createGmailDraft, sendGmail } from "@/lib/dashboard/people/client-ai";
import { buildCheckinPrompt } from "@/lib/dashboard/people/ai-prompts";
import { contactEmails } from "@/lib/dashboard/people/interactions";
import type { Contact, VoiceProfile } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary = "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhost = "rounded-[8px] border border-stone-200 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-stone-300 disabled:opacity-50";
const inputCls = "w-full rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";
const labelCls = "font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400";
const UNDO_SECONDS = 15;
const parseList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

/**
 * Check-in composer: an editable To/Cc/Bcc/Subject/Body review of an AI draft (in the owner's voice),
 * with draft controls (regenerate / tone / length). "Send now" creates the draft then starts a 30s
 * UNDO window before it actually sends; Undo (or unmounting) cancels — nothing auto-sends. "Save as
 * draft" only creates a Gmail draft. Body/AI text render as plain values (no dangerouslySetInnerHTML).
 */
export function CheckinDraft({ contact, recent, days, voice, onSent }: { contact: Contact; recent: string[]; days: number | null; voice?: VoiceProfile; onSent?: (subject: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState(contactEmails(contact)[0] || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("Catching up");
  const [body, setBody] = useState("");
  const [length, setLength] = useState<"short" | "long">("short");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<{ secondsLeft: number } | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
    tickRef.current = null; sendTimeoutRef.current = null;
  };

  const generate = (opts?: { tone?: string; length?: "short" | "long" }) => {
    setLoading(true); setError(null);
    let prompt = buildCheckinPrompt(contact, recent, days, voice);
    if (opts?.tone) prompt += ` Adjust the tone to be more ${opts.tone}.`;
    if ((opts?.length ?? length) === "long") prompt += ` Make it a bit longer (4-6 sentences).`;
    askAi("draft_checkin", prompt)
      .then((r) => setBody(r.trim().replace(/^["']|["']$/g, "")))
      .catch((err) => setError(err instanceof Error && err.message ? err.message : "Drafting is unavailable right now."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { generate(); return clearTimers; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(body);
    setCopyMsg("Copied.");
  };

  const saveDraftOnly = async () => {
    setBusy(true); setStatusMsg(null);
    try { await createGmailDraft(parseList(to), parseList(bcc), subject, body, parseList(cc)); setStatusMsg("Saved to Gmail drafts ✓ (nothing sent)."); }
    catch { setStatusMsg("Could not save draft."); }
    finally { setBusy(false); }
  };

  const startSend = async () => {
    setBusy(true); setStatusMsg(null);
    const params = { to: parseList(to), cc: parseList(cc), bcc: parseList(bcc), subject, body };
    try {
      const draft = await createGmailDraft(params.to, params.bcc, params.subject, params.body, params.cc);
      setConfirming(false);
      setPending({ secondsLeft: UNDO_SECONDS });
      tickRef.current = setInterval(() => setPending((p) => (p ? { secondsLeft: Math.max(0, p.secondsLeft - 1) } : p)), 1000);
      sendTimeoutRef.current = setTimeout(() => {
        clearTimers();
        setPending(null);
        sendGmail(draft.draftId, params).then(() => { setStatusMsg("Sent ✓"); onSent?.(params.subject); }).catch(() => setStatusMsg("Send failed — the draft is in your Gmail Drafts."));
      }, UNDO_SECONDS * 1000);
    } catch { setStatusMsg("Could not create the draft."); }
    finally { setBusy(false); }
  };

  const undoSend = () => { clearTimers(); setPending(null); setStatusMsg("Cancelled — saved as a Gmail draft instead (nothing sent)."); };

  if (loading) return <div className="mt-3 text-[13px] text-stone-500">Drafting a warm check-in…</div>;
  if (error) return <div className="mt-3 text-[13px] text-[#A51C30]">{error}</div>;

  if (pending) {
    return (
      <div className="mt-3 rounded-[10px] border border-[#A51C30]/40 bg-[#f9f8f6] p-3">
        <div className="flex items-center justify-between gap-2 text-[13px] text-stone-700">
          <span>Sending to {to} in <b>{pending.secondsLeft}s</b>…</span>
          <button type="button" onClick={undoSend} className={btnPrimary} style={mono}>Undo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[10px] border border-stone-200 p-3">
      <div className="flex flex-col gap-1.5">
        <div><label className={labelCls}>To</label><input value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></div>
        <div className="flex gap-2">
          <div className="flex-1"><label className={labelCls}>Cc</label><input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" className={inputCls} /></div>
          <div className="flex-1"><label className={labelCls}>Bcc</label><input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="optional" className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Message</label><textarea value={body} onChange={(e) => { setBody(e.target.value); setCopyMsg(null); }} rows={6} className={inputCls} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => generate()} disabled={busy} className={btnGhost} style={mono}>Regenerate</button>
        <button type="button" onClick={() => generate({ tone: "warmer" })} disabled={busy} className={btnGhost} style={mono}>Warmer</button>
        <button type="button" onClick={() => generate({ tone: "more casual" })} disabled={busy} className={btnGhost} style={mono}>Casual</button>
        <button type="button" onClick={() => { const n = length === "short" ? "long" : "short"; setLength(n); generate({ length: n }); }} disabled={busy} className={btnGhost} style={mono}>{length === "short" ? "Longer" : "Shorter"}</button>
        <button type="button" onClick={handleCopy} className={btnGhost} style={mono}>Copy</button>
        {copyMsg && <span className="text-[12px] text-stone-500">{copyMsg}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2">
        <button type="button" onClick={saveDraftOnly} disabled={busy || !to.trim() || !body.trim()} className={btnGhost} style={mono}>Save as draft</button>
        {!confirming && <button type="button" onClick={() => { setConfirming(true); setStatusMsg(null); }} disabled={!to.trim() || !body.trim()} className={btnPrimary} style={mono}>Send…</button>}
      </div>

      {confirming && (
        <div className="flex flex-col gap-1.5 rounded-[8px] bg-[#f9f8f6] p-2.5 text-[12px] text-stone-600">
          <div>Send to <b>{to}</b>{cc.trim() ? <>, cc <b>{cc}</b></> : null}{bcc.trim() ? <>, bcc <b>{bcc}</b></> : null} — subject &quot;<b>{subject}</b>&quot;. You&apos;ll have {UNDO_SECONDS}s to undo.</div>
          <div className="flex gap-2">
            <button type="button" onClick={startSend} disabled={busy} className={btnPrimary} style={mono}>{busy ? "…" : "Send now"}</button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={btnGhost} style={mono}>Cancel</button>
          </div>
        </div>
      )}

      {statusMsg && <div className="text-[12px] text-stone-600">{statusMsg}</div>}
    </div>
  );
}
