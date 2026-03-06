interface StatChip {
  label: string;
  value: string;
  note?: string;
}

interface StatChipsProps {
  stats: StatChip[];
}

export function StatChips({ stats }: StatChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-sm border border-stone-200 bg-white/60 px-4 py-3"
        >
          <div
            className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-stone-800"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {stat.value}
          </div>
          <div className="mt-1 text-xs font-medium text-stone-600">{stat.label}</div>
          {stat.note && (
            <div className="mt-0.5 font-mono text-[10px] text-stone-400">{stat.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}
