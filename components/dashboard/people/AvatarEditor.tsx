"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/dashboard/ui";
import { fileToAvatar } from "@/lib/dashboard/people/avatar-client";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

export function AvatarEditor({ avatarImg, initials, tone = "neutral", onChange }: {
  avatarImg: string | null;
  initials: string;
  tone?: "neutral" | "attention";
  onChange: (avatarImg: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToAvatar(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process image.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar initials={initials} tone={tone} src={avatarImg ?? undefined} size={56} />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500 border border-stone-300 rounded-full px-3.5 py-1.5 hover:border-[#A51C30] hover:text-[#A51C30] transition-colors"
            style={MONO}
          >
            Upload image
          </button>
          {avatarImg && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 hover:text-[#A51C30] transition-colors"
              style={MONO}
            >
              Remove image
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
        {error && (
          <span className="text-[11px] text-[#A51C30]">{error}</span>
        )}
      </div>
    </div>
  );
}
