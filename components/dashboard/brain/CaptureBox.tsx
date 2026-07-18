"use client";
import { useState, useRef, useEffect } from "react";
import { btnPrimary, mono } from "./styles";

/** Frictionless capture textarea. Reused by Home's QuickCapture (compact). */
export function CaptureBox({
  onCapture,
  compact = false,
  autoFocus = false,
  placeholder = "Capture a thought… (⌘↵ to save)",
}: {
  onCapture: (text: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onCapture(t);
    setText("");
    ref.current?.focus();
  };
  return (
    <div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        className="w-full resize-none rounded-[10px] border border-stone-200 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-stone-800 outline-none placeholder:text-stone-300 focus:border-stone-300"
      />
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={submit} disabled={!text.trim()} className={btnPrimary} style={mono}>
          Capture
        </button>
      </div>
    </div>
  );
}
