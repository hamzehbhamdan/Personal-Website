"use client";
import { Pin, Trash2, Sparkles, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import { noteTitle, type BrainNote } from "@/lib/dashboard/brain/types";
import { serif, mono } from "./styles";

/** One note in the Notes list. Click the body to edit; hover for pin/index/delete. */
export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onMakeSearchable,
  indexing = false,
}: {
  note: BrainNote;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onMakeSearchable: () => void;
  indexing?: boolean;
}) {
  const searchable = typeof note.docId === "number";
  return (
    <Card className="group p-4 hover:border-stone-300">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            {note.pinned && <span className="size-1.5 shrink-0 rounded-full bg-[#A51C30]" aria-label="Pinned" />}
            <h3 className="truncate text-[15px] font-medium text-stone-900" style={serif}>
              {noteTitle(note)}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[13px] leading-relaxed text-stone-500">{note.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {note.tags.map((t) => (
              <span key={t} className="rounded-full bg-[#f0eeea] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-stone-500" style={mono}>
                {t}
              </span>
            ))}
            <MonoLabel>{format(new Date(note.updatedAt), "MMM d")}</MonoLabel>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={onTogglePin} title={note.pinned ? "Unpin" : "Pin"} className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]">
            <Pin className={`size-3.5 ${note.pinned ? "fill-[#A51C30] text-[#A51C30]" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onMakeSearchable}
            disabled={searchable || indexing}
            title={searchable ? "In chat memory" : "Make searchable in chat"}
            className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30] disabled:cursor-default disabled:text-emerald-600"
          >
            {indexing ? <Loader2 className="size-3.5 animate-spin" /> : searchable ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />}
          </button>
          <button type="button" onClick={onDelete} title="Delete" className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
