"use client";
import { Pin, Trash2, MessageSquare } from "lucide-react";
import { mono } from "./styles";
import type { BrainChat } from "@/lib/dashboard/brain/types";

/** Past chat sessions — select / pin / delete. */
export function ChatHistoryList({
  chats,
  activeId,
  onSelect,
  onTogglePin,
  onDelete,
}: {
  chats: BrainChat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (chats.length === 0) return null;
  const sorted = [...chats].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
  );
  return (
    <div className="space-y-1">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
        History
      </div>
      {sorted.map((c) => {
        const on = c.id === activeId;
        return (
          <div
            key={c.id}
            className={`group flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 ${on ? "bg-[#f0eeea]" : "hover:bg-[#f6f4f1]"}`}
          >
            <button type="button" onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              {c.pinned ? (
                <Pin className="size-3 shrink-0 fill-[#A51C30] text-[#A51C30]" />
              ) : (
                <MessageSquare className="size-3 shrink-0 text-stone-400" />
              )}
              <span className="truncate text-[12.5px] text-stone-600">{c.title}</span>
            </button>
            <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => onTogglePin(c.id)} title="Pin" className="grid size-6 place-items-center text-stone-400 hover:text-[#A51C30]">
                <Pin className="size-3" />
              </button>
              <button type="button" onClick={() => onDelete(c.id)} title="Delete" className="grid size-6 place-items-center text-stone-400 hover:text-[#A51C30]">
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
