"use client";

import { useState } from "react";
import { askAi } from "@/lib/dashboard/people/client-ai";
import { buildAskContext, buildAskPrompt } from "@/lib/dashboard/people/ai-prompts";
import { AiMarkdown } from "@/components/dashboard/people/AiMarkdown";
import { MonoLabel } from "@/components/dashboard/ui/MonoLabel";
import type { CrmDB, Contact, ContactState } from "@/lib/dashboard/people/types";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

// Port of CHIPS (crm.html:698).
const CHIPS = [
  "Who should I reconnect with this week?",
  "Who have I been neglecting?",
  "Any birthdays coming up?",
  "Who owes me a reply, or do I owe them?",
];

/**
 * Floating "Ask about your people" FAB + chat panel (port of crm.html:163-168, 688-705).
 * Sends ONLY buildAskContext(db, stateOf, now) through buildAskPrompt to askAi("ask_people", ...) —
 * the context omits structured email/phone and is delimited as untrusted context inside the prompt.
 * The answer is rendered exclusively via <AiMarkdown/> (never raw HTML).
 */
export function AskPanel({ db, stateOf, now }: { db: CrmDB; stateOf: (c: Contact) => ContactState; now: Date }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    const context = buildAskContext(db, stateOf, now);
    askAi("ask_people", buildAskPrompt(trimmed, context))
      .then((r) => setAnswer(r))
      .catch(() => setError("Sorry — couldn't reach Claude. Try again."))
      .finally(() => setLoading(false));
  };

  const handleChip = (c: string) => {
    setQuestion(c);
    ask(c);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask about your people"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#A51C30] text-white shadow-lg hover:bg-[#8a1728]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[72vh] w-[350px] max-w-[calc(100vw-30px)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <span className="font-serif text-[15px] font-semibold text-stone-900">Ask about your people</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-xl leading-none text-stone-400 hover:text-[#A51C30]"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-auto px-4 py-3">
            <MonoLabel>Try asking</MonoLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChip(c)}
                  disabled={loading}
                  className="rounded-full border border-stone-200 px-3 py-1 text-[12px] text-stone-600 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-3 text-[13px] text-stone-500">Thinking about your people…</div>
            )}
            {error && !loading && (
              <div className="mt-3 text-[13px] text-[#A51C30]">{error}</div>
            )}
            {answer && !loading && !error && (
              <div className="mt-3 rounded-[11px] border border-stone-200 bg-[#f9f8f6] px-4 py-3">
                <AiMarkdown text={answer} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-stone-200 px-3.5 py-2.5">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ask(question); }}
              placeholder="Who should I reconnect with?"
              className="flex-1 rounded-[8px] border border-stone-200 px-2.5 py-1.5 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]"
            />
            <button
              type="button"
              onClick={() => ask(question)}
              disabled={!question.trim() || loading}
              className="rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50"
              style={mono}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </>
  );
}
