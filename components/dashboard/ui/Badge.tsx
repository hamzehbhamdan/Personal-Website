export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "attention" | "neutral" }) {
  const cls = tone === "attention" ? "text-[#A51C30] bg-[#faf0f1]" : "text-stone-500 bg-[#f0eeea]";
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.1em] rounded px-2 py-[3px] ${cls}`}
      style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
      {children}
    </span>
  );
}
