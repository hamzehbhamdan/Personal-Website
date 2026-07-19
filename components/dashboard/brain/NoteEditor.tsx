"use client";
import { useRef, useState } from "react";
import { Sparkles, Loader2, Trash2 } from "lucide-react";
import { Modal } from "@/components/dashboard/ui";
import { TagInput } from "./TagInput";
import { btnPrimary, btnGhost, mono, serif } from "./styles";
import { askAi } from "@/lib/dashboard/people/client-ai";
import type { BrainNote } from "@/lib/dashboard/brain/types";

/** Create/edit a note. Optional AI tag suggestions via the allowlisted suggest_tags task. */
export function NoteEditor({
  note,
  prefill,
  allTags = [],
  onSave,
  onDelete,
  onClose,
}: {
  note?: BrainNote;
  prefill?: string;
  allTags?: string[];
  onSave: (data: { title: string; text: string; tags: string[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [text, setText] = useState(note?.text ?? prefill ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);

  const initialRef = useRef(JSON.stringify({ title, text, tags }));
  const dirty = JSON.stringify({ title, text, tags }) !== initialRef.current;

  const suggestTags = async () => {
    if (!text.trim()) return;
    setSuggesting(true);
    try {
      const out = await askAi(
        "suggest_tags",
        `Suggest 2-5 short lowercase topical tags (comma-separated, no # symbol, one or two words each) for this note. Output only the tags.\n"""\n${text.slice(0, 4000)}\n"""`,
      );
      const parsed = out
        .split(/[,\n]/)
        .map((t) => t.trim().toLowerCase().replace(/^#/, "").replace(/["'.]/g, ""))
        .filter((t) => t && t.length <= 24)
        .slice(0, 6);
      setSuggested(parsed);
    } catch {
      /* AI unavailable — silently skip */
    } finally {
      setSuggesting(false);
    }
  };

  const save = () => {
    if (!text.trim()) return;
    onSave({ title: title.trim(), text: text.trim(), tags });
    onClose();
  };

  return (
    <Modal
      title={note ? "Edit note" : "New note"}
      onClose={onClose}
      size="wide"
      confirmClose={() => !dirty || window.confirm("Discard unsaved changes to this note?")}
    >
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-[8px] border border-stone-200 px-3 py-2 text-[15px] text-stone-900 outline-none focus:border-stone-300"
          style={serif}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Write…"
          autoFocus
          className="w-full resize-y rounded-[10px] border border-stone-200 px-3.5 py-3 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-stone-300"
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
              Tags
            </span>
            <button
              type="button"
              onClick={suggestTags}
              disabled={suggesting || !text.trim()}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-[#A51C30] disabled:opacity-40"
              style={mono}
            >
              {suggesting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Suggest
            </button>
          </div>
          <TagInput tags={tags} onChange={setTags} suggestions={[...new Set([...suggested, ...allTags])]} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-[#A51C30]"
                style={mono}
              >
                <Trash2 className="size-3" /> Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={btnGhost} style={mono}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={!text.trim()} className={btnPrimary} style={mono}>
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
