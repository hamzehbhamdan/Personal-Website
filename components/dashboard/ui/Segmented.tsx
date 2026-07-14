"use client";
export function Segmented<T extends string>({ options, value, onChange }:
  { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-[#f0eeea] p-[3px]" role="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)}
            className={`font-mono text-[10px] uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-md transition-colors ${
              on ? "bg-white text-[#A51C30] shadow-[0_1px_1px_rgba(0,0,0,0.04)]" : "text-stone-400"}`}
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
