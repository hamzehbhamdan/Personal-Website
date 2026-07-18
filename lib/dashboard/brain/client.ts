// Thin fetch wrappers for Brain's server routes. NO browser Supabase client —
// all authed data access goes through requireUser-gated /api/* routes.
import type { BrainChatMsg, BrainSettings } from "./types";

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`${res.status}`);
  return res;
}
async function asJson(res: Response) {
  return (await ok(res)).json();
}

// ── pgvector documents corpus (notes made searchable + ingested files) ──
export async function ingestText(
  text: string,
  meta: { title?: string; type?: string; noteId?: string } = {},
): Promise<{ id: number | null }> {
  const fd = new FormData();
  fd.append("content", text);
  fd.append("metadata", JSON.stringify(meta));
  const j = await asJson(await fetch("/api/vector/ingest", { method: "POST", body: fd }));
  return { id: typeof j.id === "number" ? j.id : null };
}

export async function ingestFile(file: File, activeStoreId?: string | null): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  if (activeStoreId) fd.append("activeStoreId", activeStoreId);
  await ok(await fetch("/api/vector/ingest", { method: "POST", body: fd }));
}

export interface BrainDocument {
  id: number;
  title: string;
  type: string;
  preview: string;
}
export async function listDocuments(): Promise<BrainDocument[]> {
  const j = await asJson(await fetch("/api/brain/documents"));
  return Array.isArray(j.documents) ? j.documents : [];
}
export async function deleteDocument(id: number): Promise<void> {
  await ok(await fetch(`/api/brain/documents?id=${encodeURIComponent(String(id))}`, { method: "DELETE" }));
}

// ── RAG chat (OpenAI, plain-text response) ──
export async function ragChat(messages: BrainChatMsg[], settings: BrainSettings): Promise<string> {
  const res = await ok(
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        params: { activeStoreId: settings.activeStoreId ?? undefined, retrievalCount: settings.retrievalCount },
      }),
    }),
  );
  return res.text();
}

// ── OpenAI vector stores (Sources) ──
export interface VectorStore {
  id: string;
  name?: string;
}
export async function listStores(): Promise<VectorStore[]> {
  const j = await asJson(await fetch("/api/vector/stores"));
  return Array.isArray(j) ? j : [];
}
export async function createStore(name: string): Promise<VectorStore> {
  return asJson(
    await fetch("/api/vector/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
}
export async function deleteStore(id: string): Promise<void> {
  await ok(await fetch(`/api/vector/stores?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
}

export interface StoreFile {
  id: string;
  filename?: string;
  bytes?: number;
  upload_status?: string;
}
export async function listStoreFiles(storeId: string): Promise<StoreFile[]> {
  const j = await asJson(await fetch(`/api/vector/files?storeId=${encodeURIComponent(storeId)}`));
  return Array.isArray(j) ? j : [];
}
export async function uploadStoreFiles(storeId: string, files: File[]): Promise<void> {
  const fd = new FormData();
  files.forEach((f) => fd.append("file", f));
  fd.append("storeId", storeId);
  await ok(await fetch("/api/vector/files", { method: "POST", body: fd }));
}
export async function deleteStoreFile(storeId: string, fileId: string): Promise<void> {
  await ok(
    await fetch(`/api/vector/files?storeId=${encodeURIComponent(storeId)}&fileId=${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    }),
  );
}
