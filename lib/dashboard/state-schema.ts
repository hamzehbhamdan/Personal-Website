export const MAX_STATE_BYTES = 2 * 1024 * 1024; // 2 MB per app document
const APPS = new Set(["lifeCRM", "execCoach"]);

export type StateWriteResult = { ok: true } | { ok: false; status: 400; reason: string };

export function validateStateWrite(app: string, data: unknown): StateWriteResult {
  if (!APPS.has(app)) return { ok: false, status: 400, reason: "unknown app" };
  if (data === null || typeof data !== "object" || Array.isArray(data))
    return { ok: false, status: 400, reason: "data must be a JSON object" };
  const size = Buffer.byteLength(JSON.stringify(data), "utf8");
  if (size > MAX_STATE_BYTES) return { ok: false, status: 400, reason: "payload too large" };
  return { ok: true };
}
