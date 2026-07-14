import { ringGeometry } from "@/lib/dashboard/ring";
export function Ring({ pct, size = 40 }: { pct: number; size?: number }) {
  const g = ringGeometry(pct, size);
  const stroke = g.p >= 100 ? "#1c1917" : "#A51C30";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${g.p}%`}>
      <circle cx={g.center} cy={g.center} r={g.r} fill="none" stroke="#e7e5e4" strokeWidth="5" />
      <circle cx={g.center} cy={g.center} r={g.r} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={g.circumference} strokeDashoffset={g.offset} transform={`rotate(-90 ${g.center} ${g.center})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.3} fontWeight="500"
        fontFamily="var(--font-playfair), serif" fill="#1c1917">{g.p}</text>
    </svg>
  );
}
