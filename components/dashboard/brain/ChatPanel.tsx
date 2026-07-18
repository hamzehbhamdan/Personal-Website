"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plus, Database } from "lucide-react";
import { AiMarkdown } from "@/components/dashboard/people/AiMarkdown";
import { serif, mono } from "./styles";
import type { BrainChat } from "@/lib/dashboard/brain/types";

/** RAG chat surface. Assistant text renders ONLY via AiMarkdown (no raw HTML). */
export function ChatPanel({
  chat,
  busy,
  onSend,
  sourceLabel,
  onNewChat,
}: {
  chat: BrainChat | null;
  busy: boolean;
  onSend: (text: string) => void;
  sourceLabel: string;
  onNewChat: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messages = chat?.messages ?? [];
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);
  const submit = () => {
    const t = input.trim();
    if (!t || busy) return;
    onSend(t);
    setInput("");
  };
  return (
    <div className="flex flex-col rounded-[12px] border border-stone-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={mono}>
          <Database className="size-3" /> {sourceLabel}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-[#A51C30]"
          style={mono}
        >
          <Plus className="size-3" /> New
        </button>
      </div>
      <div className="max-h-[52vh] min-h-[240px] flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !busy && (
          <div className="grid h-full min-h-[200px] place-items-center text-center">
            <div>
              <p className="text-[15px] text-stone-500" style={serif}>
                Ask your second brain
              </p>
              <p className="mt-1 text-[12px] text-stone-400">Answers draw on your searchable notes and the active source.</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <div className="max-w-[85%] whitespace-pre-wrap rounded-[12px] bg-[#f0eeea] px-3.5 py-2 text-[13.5px] leading-relaxed text-stone-800">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[92%]">
                <AiMarkdown text={m.content} />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[12px] text-stone-400">
            <Loader2 className="size-3.5 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2 border-t border-stone-200 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask anything…"
          className="flex-1 resize-none rounded-[10px] border border-stone-200 px-3.5 py-2.5 text-[14px] text-stone-800 outline-none focus:border-stone-300"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!input.trim() || busy}
          className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#A51C30] text-white hover:bg-[#8a1728] disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
