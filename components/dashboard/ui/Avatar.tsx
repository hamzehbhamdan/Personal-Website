const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function Avatar({ initials, tone = "neutral", src, size = 34 }:
  { initials: string; tone?: "attention" | "neutral"; src?: string | null; size?: number }) {
  const bg = tone === "attention" ? "#faf0f1" : "#f0eeea";
  const fg = tone === "attention" ? "#A51C30" : "#78716c";
  if (src) return <div style={{ width: size, height: size, backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }} className="rounded-full shrink-0" />;
  return (
    <div style={{ width: size, height: size, background: bg, color: fg, ...serif }}
      className="rounded-full shrink-0 flex items-center justify-center text-[13px] font-medium">
      {initials}
    </div>
  );
}
