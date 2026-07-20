"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2, Circle, CheckCircle2, FileText, Database } from "lucide-react";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import { useBrain } from "./BrainProvider";
import { btnPrimary, mono } from "./styles";
import {
  listStores,
  createStore,
  deleteStore,
  ingestFile,
  listDocuments,
  deleteDocument,
  type VectorStore,
  type BrainDocument,
} from "@/lib/dashboard/brain/client";

/** Manage OpenAI vector stores (file_search) + the pgvector searchable-memory corpus. */
export function SourcesManager() {
  const { doc, setSettings, updateNote } = useBrain();
  const activeStoreId = doc.settings.activeStoreId;
  const [stores, setStores] = useState<VectorStore[]>([]);
  const [docs, setDocs] = useState<BrainDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([listStores(), listDocuments()]);
      setStores(s);
      setDocs(d);
    } catch {
      /* fail-soft */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const s = await createStore(name);
      setNewName("");
      setStores((p) => [...p, s]);
      setSettings({ activeStoreId: s.id });
      toast.success("Source created");
    } catch {
      toast.error("Create failed");
    } finally {
      setBusy(false);
    }
  };
  const removeStore = async (s: VectorStore) => {
    // Confirm-gated (finding #21): deletes the OpenAI store and orphans its uploaded files.
    if (!window.confirm(`Delete source "${s.name || s.id}" and its uploaded files? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteStore(s.id);
      setStores((p) => p.filter((x) => x.id !== s.id));
      if (activeStoreId === s.id) setSettings({ activeStoreId: null });
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };
  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) await ingestFile(f, activeStoreId);
      toast.success("Uploaded to memory");
      await refresh();
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const removeDoc = async (d: BrainDocument) => {
    // Confirm-gated (finding #21): hard-deletes the pgvector row server-side.
    if (!window.confirm(`Remove "${d.title}" from searchable memory? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteDocument(d.id);
      setDocs((p) => p.filter((x) => x.id !== d.id));
      // Reconcile: a note that pointed at this document is no longer searchable.
      doc.notes.forEach((n) => {
        if (n.docId === d.id) updateNote(n.id, { docId: null });
      });
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2">
          <MonoLabel>Sources · file search</MonoLabel>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="New source name…"
            className="flex-1 rounded-[8px] border border-stone-200 px-3 py-1.5 text-[13px] outline-none focus:border-stone-300"
          />
          <button type="button" onClick={create} disabled={busy || !newName.trim()} className={btnPrimary} style={mono}>
            <Plus className="mr-1 inline size-3" />
            Add
          </button>
        </div>
        {loading ? (
          <p className="text-[12px] text-stone-400">Loading…</p>
        ) : stores.length === 0 ? (
          <p className="text-[12px] text-stone-400">No sources yet. Create one to upload files for retrieval.</p>
        ) : (
          <div className="space-y-2">
            {stores.map((s) => {
              const active = s.id === activeStoreId;
              return (
                <Card key={s.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings({ activeStoreId: active ? null : s.id })}
                      className="flex min-w-0 items-center gap-2 text-left"
                      title={active ? "Active for chat — click to use notes corpus instead" : "Use this source in chat"}
                    >
                      {active ? (
                        <CheckCircle2 className="size-4 shrink-0 text-[#A51C30]" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-stone-300" />
                      )}
                      <span className="truncate text-[13.5px] text-stone-800">{s.name || s.id}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      {active && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={busy}
                          title="Upload file to this source"
                          className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]"
                        >
                          <Upload className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeStore(s)}
                        title="Delete source"
                        className="grid size-7 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <input ref={fileRef} type="file" hidden onChange={(e) => upload(e.target.files)} accept=".txt,.md,.pdf,.png,.jpg,.jpeg" />
      </section>

      <section>
        <div className="mb-2">
          <MonoLabel>Searchable memory · {docs.length}</MonoLabel>
        </div>
        {loading ? null : docs.length === 0 ? (
          <p className="text-[12px] text-stone-400">Nothing indexed yet. Make a note searchable, or upload a file above.</p>
        ) : (
          <div className="space-y-1.5">
            {docs.map((d) => (
              <Card key={d.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {d.type === "note" ? <FileText className="size-3 shrink-0 text-stone-400" /> : <Database className="size-3 shrink-0 text-stone-400" />}
                    <span className="truncate text-[13px] font-medium text-stone-700">{d.title}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-stone-400">{d.preview}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(d)}
                  title="Remove from memory"
                  className="grid size-7 shrink-0 place-items-center rounded-md text-stone-400 hover:text-[#A51C30]"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>
      {busy && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <Loader2 className="size-3 animate-spin" /> Working…
        </div>
      )}
    </div>
  );
}
