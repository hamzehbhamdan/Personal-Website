import { cn } from "@/lib/utils";

export function MonoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400", className)}
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
      {children}
    </span>
  );
}
