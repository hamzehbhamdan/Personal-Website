export function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3.5 mb-3.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-400 whitespace-nowrap"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
        {index} — {label}
      </span>
      <span className="flex-1 h-px bg-[#f0eeea]" />
    </div>
  );
}
