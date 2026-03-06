"use client";

import { R2_TABLE } from "@/lib/thesis-content";

function R2Cell({
  value,
  highlight,
  strong,
}: {
  value: number | null;
  highlight?: boolean;
  strong?: boolean;
}) {
  if (value === null) {
    return (
      <span className="font-mono text-[11px] text-stone-300">—</span>
    );
  }

  const pct = (value * 100).toFixed(1);
  const isZero = value < 0.001;

  return (
    <span
      className={`font-mono text-[11px] tabular-nums font-medium ${
        highlight
          ? strong
            ? "text-[#A51C30] font-bold"
            : "text-stone-500"
          : isZero
          ? "text-stone-300"
          : "text-stone-700"
      }`}
    >
      {highlight && strong && value > 0.005 ? "+" : ""}
      {pct}%
    </span>
  );
}

export function R2ComprehensiveTable() {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-sm border border-stone-200">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="px-3 py-2.5 text-left font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Method
              </th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Freq.
              </th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Window
              </th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Target
              </th>
              <th className="px-3 py-2.5 text-center font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Own R²
              </th>
              <th className="px-3 py-2.5 text-center font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Cross R²
              </th>
              <th className="px-3 py-2.5 text-center font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Both R²
              </th>
              <th className="px-3 py-2.5 text-center font-mono text-[8px] uppercase tracking-wider text-[#A51C30]/70">
                ΔR²
              </th>
              <th className="px-3 py-2.5 text-left font-mono text-[8px] uppercase tracking-wider text-stone-400">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {R2_TABLE.rows.map((row, i) => (
              <tr
                key={i}
                className={`transition-colors hover:bg-stone-50/60 ${
                  row.strong ? "bg-[#A51C30]/2" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <span className="font-mono text-[10px] text-stone-600">{row.method}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-[10px] text-stone-400">{row.granularity}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-[10px] text-stone-400">{row.window}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        row.strong ? "bg-[#A51C30]/60" : "bg-stone-300"
                      }`}
                    />
                    <span className="text-[11px] text-stone-700">{row.target}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <R2Cell value={row.ownR2} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <R2Cell value={row.crossR2} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <R2Cell value={row.bothR2} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <R2Cell value={row.deltaR2} highlight strong={row.strong} />
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-[9px] text-stone-300">{row.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#A51C30]/60" />
          <span className="font-mono text-[9px] text-stone-400">U.S.→China (strong signal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-stone-300" />
          <span className="font-mono text-[9px] text-stone-400">China→U.S. (weak signal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-bold text-[#A51C30]">+X.X%</span>
          <span className="font-mono text-[9px] text-stone-400">= meaningful ΔR² gain</span>
        </div>
        <span className="font-mono text-[9px] text-stone-300">— = not estimated for this specification</span>
      </div>
    </div>
  );
}
