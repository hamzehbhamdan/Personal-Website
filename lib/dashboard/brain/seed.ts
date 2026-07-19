import type { BrainDoc, BrainNote, BrainCapture, BrainChat, BrainChatMsg } from "./types";

const MAX_CHATS = 50;
const MAX_MSGS = 80;
const MAX_CAPTURES = 200;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function emptyBrain(): BrainDoc {
  return {
    version: 1,
    captures: [],
    notes: [],
    chats: [],
    settings: { retrievalCount: 5, activeStoreId: null },
  };
}

function clampInt(v: unknown, min: number, max: number, dflt: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : dflt;
  return Math.min(max, Math.max(min, n));
}

function normNote(raw: unknown): BrainNote | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.text !== "string") return null;
  return {
    id: d.id,
    title: typeof d.title === "string" ? d.title : "",
    text: d.text,
    tags: Array.isArray(d.tags) ? d.tags.filter((t): t is string => typeof t === "string") : [],
    createdAt: typeof d.createdAt === "string" ? d.createdAt : nowIso(),
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : nowIso(),
    pinned: d.pinned === true,
    docId: typeof d.docId === "number" ? d.docId : null,
  };
}

function normCapture(raw: unknown): BrainCapture | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.text !== "string") return null;
  return { id: d.id, text: d.text, createdAt: typeof d.createdAt === "string" ? d.createdAt : nowIso() };
}

function normMsg(raw: unknown): BrainChatMsg | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if ((d.role !== "user" && d.role !== "assistant") || typeof d.content !== "string") return null;
  return { role: d.role, content: d.content };
}

function normChat(raw: unknown): BrainChat | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string") return null;
  return {
    id: d.id,
    title: typeof d.title === "string" ? d.title : "Untitled",
    messages: Array.isArray(d.messages) ? d.messages.map(normMsg).filter((m): m is BrainChatMsg => !!m) : [],
    pinned: d.pinned === true,
    createdAt: typeof d.createdAt === "string" ? d.createdAt : nowIso(),
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : nowIso(),
  };
}

/** Coerce a raw app_state doc into a valid BrainDoc (never throws). */
export function normalizeBrain(raw: unknown): BrainDoc {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const settings = (d.settings && typeof d.settings === "object" ? d.settings : {}) as Record<string, unknown>;
  return {
    version: typeof d.version === "number" ? d.version : 1,
    captures: Array.isArray(d.captures) ? d.captures.map(normCapture).filter((c): c is BrainCapture => !!c) : [],
    notes: Array.isArray(d.notes) ? d.notes.map(normNote).filter((n): n is BrainNote => !!n) : [],
    chats: Array.isArray(d.chats) ? d.chats.map(normChat).filter((c): c is BrainChat => !!c) : [],
    settings: {
      retrievalCount: clampInt(settings.retrievalCount, 1, 20, 5),
      activeStoreId: typeof settings.activeStoreId === "string" ? settings.activeStoreId : null,
    },
  };
}

/** Enforce the 2 MB app_state cap by bounding chats/messages/captures. */
export function trimBrain(d: BrainDoc): BrainDoc {
  let chats = d.chats.map((c) => (c.messages.length > MAX_MSGS ? { ...c, messages: c.messages.slice(-MAX_MSGS) } : c));
  if (chats.length > MAX_CHATS) {
    const pinned = chats.filter((c) => c.pinned);
    const unpinned = chats.filter((c) => !c.pinned).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    chats = [...pinned, ...unpinned].slice(0, MAX_CHATS);
  }
  const captures = d.captures.length > MAX_CAPTURES ? d.captures.slice(0, MAX_CAPTURES) : d.captures;
  return { ...d, chats, captures };
}
