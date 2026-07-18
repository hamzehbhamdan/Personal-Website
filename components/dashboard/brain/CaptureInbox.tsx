"use client";
import { FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import type { BrainCapture } from "@/lib/dashboard/brain/types";

/** The capture inbox — quick jots waiting to be filed as notes or dismissed. */
export function CaptureInbox({
  captures,
  onFile,
  onDelete,
}: {
  captures: BrainCapture[];
  onFile: (c: BrainCapture) => void;
  onDelete: (id: string) => void;
}) {
  if (captures.length === 0) {
    return <p className="text-[13px] text-stone-400">Nothing in the inbox. Jot anything above — file it as a note when you&apos;re ready.</p>;
  }
  return (
    <div className="space-y-2">
      {captures.map((c) => (
        <Card key={c.id} className="flex items-start justify-between gap-3 p-3.5">
          <div className="min-w-0">
            <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-stone-700">{c.text}</p>
            <MonoLabel className="mt-1.5 block">{format(new Date(c.createdAt), "MMM d · HH:mm")}</MonoLabel>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => onFile(c)} title="File as note" className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]">
              <FileText className="size-4" />
            </button>
            <button type="button" onClick={() => onDelete(c.id)} title="Delete" className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]">
              <Trash2 className="size-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
