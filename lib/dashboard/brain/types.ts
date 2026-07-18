// The app_state "brain" document — the second-brain's structured data.
// Heavy corpus (embeddings, uploaded files) lives OUTSIDE this doc, in the
// pgvector `documents` table and OpenAI vector stores; this JSON stays lean.

export interface BrainNote {
  id: string;
  title: string; // may be "" — display falls back to the first line of `text`
  text: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  pinned?: boolean;
  docId?: number | null; // pgvector documents.id if this note was made searchable
}

export interface BrainCapture {
  id: string;
  text: string;
  createdAt: string; // ISO
}

export interface BrainChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface BrainChat {
  id: string;
  title: string;
  messages: BrainChatMsg[];
  pinned?: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface BrainSettings {
  // Only the knobs the RAG route actually honors are surfaced (model/temperature
  // are hardcoded server-side, so they're intentionally not stored here).
  retrievalCount: number; // pgvector match_count
  activeStoreId: string | null; // OpenAI vector store for file_search, or null → notes corpus
}

export interface BrainDoc {
  version: number;
  captures: BrainCapture[];
  notes: BrainNote[];
  chats: BrainChat[];
  settings: BrainSettings;
}

/** Display title for a note: its title, else the first non-empty line of its text. */
export function noteTitle(n: BrainNote): string {
  if (n.title.trim()) return n.title.trim();
  const first = n.text.split("\n").map((l) => l.trim()).find(Boolean);
  return first ? first.slice(0, 80) : "Untitled note";
}
