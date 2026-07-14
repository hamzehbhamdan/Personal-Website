export function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n || 0)));
}

export function ringGeometry(pct: number, size = 40) {
  const p = clampPct(pct);
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - p / 100);
  return { p, r, circumference, offset, center: size / 2 };
}
