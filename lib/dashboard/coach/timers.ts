import type { Task } from "./types";

export function startTimer(tasks: Task[], id: string, now: number = Date.now()): void {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  tasks.forEach((x) => { if (x.timerStart) { x.timeMs = (+x.timeMs || 0) + (now - x.timerStart); x.timerStart = null; } });
  t.timerStart = now;
}
export function pauseTimer(t: Task | undefined, now: number = Date.now()): void {
  if (t && t.timerStart) { t.timeMs = (+t.timeMs || 0) + (now - t.timerStart); t.timerStart = null; }
}
export function resetTimer(t: Task): void { t.timerStart = null; t.timeMs = 0; }

export function fmtDur(ms: number): string {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  return m + ":" + String(sec).padStart(2, "0");
}
export function fmtHM(ms: number): string {
  const mins = Math.round(ms / 60000), h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}
