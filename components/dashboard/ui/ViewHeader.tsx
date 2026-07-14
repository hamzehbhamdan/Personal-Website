const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function ViewHeader({ meta, title, actions }: { meta?: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          {meta && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1.5"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{meta}</p>}
          <h1 className="text-[26px] font-medium text-stone-900" style={serif}>{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
      <div className="h-px bg-stone-200 mt-5" />
    </div>
  );
}
