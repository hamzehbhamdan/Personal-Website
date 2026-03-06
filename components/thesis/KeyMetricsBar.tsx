"use client";

import { KEY_METRICS } from "@/lib/thesis-content";

export function KeyMetricsBar() {
  const china = KEY_METRICS.chinaFromUS;
  const us = KEY_METRICS.usFromChina;

  const rows = [
    {
      direction: "U.S. → China",
      own: china.ownBaseline.r2,
      cross: china.crossOnly.r2,
      combined: china.combined.r2,
      delta: china.delta.r2,
      strong: true,
      context: china.context,
    },
    {
      direction: "China → U.S.",
      own: us.ownBaseline.r2,
      cross: us.crossOnly.r2,
      combined: us.combined.r2,
      delta: us.delta.r2,
      strong: false,
      context: us.context,
    },
  ];

  return (
    <div className="rounded-sm border border-stone-200 bg-white/60 overflow-hidden">
      <div className="border-b border-stone-100 px-5 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
          R² at a Glance — Linear Regression
        </p>
      </div>
      <div className="divide-y divide-stone-100">
        {rows.map((row) => (
          <div key={row.direction} className="grid grid-cols-[auto_1fr] gap-x-6 px-5 py-4 sm:grid-cols-[160px_repeat(4,1fr)]">
            {/* Direction */}
            <div className="col-span-2 mb-2 sm:col-span-1 sm:mb-0 flex items-center">
              <span className={`font-mono text-[10px] font-medium uppercase tracking-wider ${row.strong ? "text-[#A51C30]" : "text-stone-500"}`}>
                {row.direction}
              </span>
            </div>

            {/* Metrics */}
            {[
              { label: "Own factors", value: row.own },
              { label: "Cross only", value: row.cross },
              { label: "Combined", value: row.combined },
              { label: "ΔR² added", value: row.delta, highlight: true },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div
                  className={`text-base font-semibold tabular-nums ${
                    m.highlight
                      ? row.strong
                        ? "text-[#A51C30]"
                        : "text-stone-400"
                      : "text-stone-700"
                  }`}
                >
                  {m.highlight && row.strong && "+"}
                  {(m.value * 100).toFixed(1)}%
                </div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-stone-400">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 px-5 py-2">
        <p className="font-mono text-[8px] text-stone-300">
          U.S.→China: {KEY_METRICS.chinaFromUS.context} · China→U.S.: {KEY_METRICS.usFromChina.context}
        </p>
      </div>
    </div>
  );
}
