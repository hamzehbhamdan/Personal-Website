import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { MonoLabel } from "./MonoLabel";
import { Ring } from "./Ring";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

/**
 * Editorial KPI tile — Playfair value, Geist-Mono caption, optional progress
 * Ring. `tone="attention"` tints crimson when the number wants a nudge.
 * Renders as a button when `onClick` is given (click-through to an app).
 */
export function Stat({
  label,
  value,
  hint,
  tone = "default",
  onClick,
  ring,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "attention";
  onClick?: () => void;
  ring?: number;
}) {
  const inner = (
    <div className="flex items-center justify-between gap-3 p-4 md:p-5">
      <div className="min-w-0">
        <div className="text-[28px] leading-none font-medium text-stone-900" style={serif}>
          {value}
        </div>
        <MonoLabel className="mt-2 block">{label}</MonoLabel>
        {hint && <div className="mt-1 truncate text-[11px] text-stone-400">{hint}</div>}
      </div>
      {typeof ring === "number" && <Ring pct={ring} size={44} />}
    </div>
  );
  const tint = tone === "attention" ? "bg-crimson-tint border-[#A51C30]/25" : "";
  if (onClick) {
    return (
      <button onClick={onClick} className="group w-full text-left" type="button">
        <Card className={cn("transition-colors group-hover:border-stone-300", tint)}>{inner}</Card>
      </button>
    );
  }
  return <Card className={tint}>{inner}</Card>;
}
