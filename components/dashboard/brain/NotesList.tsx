"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { TagFilter } from "./TagFilter";
import { noteTitle, type BrainNote } from "@/lib/dashboard/brain/types";

/** Searchable + tag-filterable list of notes (pinned first). */
export function NotesList({
  notes,
  indexingId,
  onEdit,
  onDelete,
  onTogglePin,
  onMakeSearchable,
}: {
  notes: BrainNote[];
  indexingId?: string | null;
  onEdit: (n: BrainNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMakeSearchable: (n: BrainNote) => void;
}) {
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags))).sort(), [notes]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return notes
      .filter((n) => selectedTags.every((t) => n.tags.includes(t)))
      .filter(
        (n) =>
          !ql ||
          noteTitle(n).toLowerCase().includes(ql) ||
          n.text.toLowerCase().includes(ql) ||
          n.tags.some((t) => t.includes(ql)),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, q, selectedTags]);

  if (notes.length === 0) {
    return <p className="text-[13px] text-stone-400">No notes yet. File a capture, or write a new note.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-[8px] border border-stone-200 px-3 py-2">
        <Search className="size-3.5 text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes…"
          className="flex-1 bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-300"
        />
      </div>
      <TagFilter
        allTags={allTags}
        selected={selectedTags}
        onToggle={(t) => setSelectedTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
        onClear={() => setSelectedTags([])}
      />
      {filtered.length === 0 ? (
        <p className="text-[13px] text-stone-400">No notes match.</p>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {filtered.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              indexing={indexingId === n.id}
              onEdit={() => onEdit(n)}
              onDelete={() => onDelete(n.id)}
              onTogglePin={() => onTogglePin(n.id)}
              onMakeSearchable={() => onMakeSearchable(n)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
