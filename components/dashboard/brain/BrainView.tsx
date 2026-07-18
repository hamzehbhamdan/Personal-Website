"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageContainer, ViewHeader, Segmented, SectionHeader } from "@/components/dashboard/ui";
import { useBrain, type BrainTab } from "./BrainProvider";
import { CaptureBox } from "./CaptureBox";
import { CaptureInbox } from "./CaptureInbox";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { ChatPanel } from "./ChatPanel";
import { ChatHistoryList } from "./ChatHistoryList";
import { SourcesManager } from "./SourcesManager";
import { ingestText, ragChat, listStores } from "@/lib/dashboard/brain/client";
import { noteTitle, type BrainNote, type BrainChatMsg } from "@/lib/dashboard/brain/types";
import { btnPrimary, mono } from "./styles";

const TABS: { value: BrainTab; label: string }[] = [
  { value: "capture", label: "Capture" },
  { value: "notes", label: "Notes" },
  { value: "chat", label: "Chat" },
  { value: "sources", label: "Sources" },
];

type EditorState = { note?: BrainNote; prefill?: string; fromCaptureId?: string } | null;

const statusEl = (status: string) =>
  status === "saving" ? (
    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-300" style={mono}>Saving…</span>
  ) : status === "saved" ? (
    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-300" style={mono}>Saved</span>
  ) : status === "error" ? (
    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A51C30]" style={mono}>Save failed</span>
  ) : null;

export function BrainView() {
  const {
    doc,
    loaded,
    status,
    addCapture,
    deleteCapture,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    addChat,
    appendChatMsg,
    togglePinChat,
    deleteChat,
    intent,
    consumeIntent,
  } = useBrain();

  const [tab, setTab] = useState<BrainTab>("capture");
  const [editor, setEditor] = useState<EditorState>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [captureFocus, setCaptureFocus] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);

  const activeStoreId = doc.settings.activeStoreId;
  const allTags = useMemo(() => Array.from(new Set(doc.notes.flatMap((n) => n.tags))).sort(), [doc.notes]);
  const activeChat = useMemo(() => doc.chats.find((c) => c.id === activeChatId) ?? null, [doc.chats, activeChatId]);

  // Resolve the active store's display name for the chat "source" chip.
  useEffect(() => {
    let alive = true;
    if (!activeStoreId) {
      setStoreName(null);
      return;
    }
    listStores()
      .then((s) => {
        if (alive) setStoreName(s.find((x) => x.id === activeStoreId)?.name ?? "Source");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [activeStoreId]);

  async function sendChat(text: string, chatIdOverride?: string) {
    let id = chatIdOverride ?? activeChatId;
    let history: BrainChatMsg[] = [];
    if (!id) {
      const c = addChat();
      id = c.id;
      setActiveChatId(id);
    } else {
      history = doc.chats.find((c) => c.id === id)?.messages ?? [];
    }
    appendChatMsg(id, { role: "user", content: text });
    setChatBusy(true);
    try {
      const reply = await ragChat([...history, { role: "user", content: text }], doc.settings);
      appendChatMsg(id, { role: "assistant", content: reply.trim() || "…" });
    } catch {
      appendChatMsg(id, { role: "assistant", content: "Sorry — I couldn't reach the model. Please try again." });
      toast.error("Chat failed");
    } finally {
      setChatBusy(false);
    }
  }

  // Deep-link intent (from ⌘K / Home). Consume once.
  useEffect(() => {
    if (!intent) return;
    setTab(intent.tab);
    if (intent.noteId) {
      const n = doc.notes.find((x) => x.id === intent.noteId);
      if (n) setEditor({ note: n });
    } else if (intent.compose) {
      setEditor({ prefill: intent.draft });
    }
    if (intent.tab === "capture") setCaptureFocus(true);
    if (intent.tab === "chat" && intent.draft) {
      const c = addChat();
      setActiveChatId(c.id);
      void sendChat(intent.draft, c.id);
    }
    consumeIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  async function makeSearchable(n: BrainNote) {
    if (typeof n.docId === "number") return;
    setIndexingId(n.id);
    try {
      const { id } = await ingestText(n.text, { title: noteTitle(n), type: "note", noteId: n.id });
      updateNote(n.id, { docId: id });
      toast.success("Added to chat memory");
    } catch {
      toast.error("Couldn't index note");
    } finally {
      setIndexingId(null);
    }
  }

  function saveNote(data: { title: string; text: string; tags: string[] }) {
    if (editor?.note) {
      updateNote(editor.note.id, data);
    } else {
      addNote(data);
      if (editor?.fromCaptureId) deleteCapture(editor.fromCaptureId);
    }
  }

  if (!loaded) {
    return (
      <PageContainer>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400" style={mono}>Loading…</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ViewHeader meta="Second Brain" title="Brain" status={statusEl(status)} />

      <div className="mb-5 flex items-center justify-between gap-3">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === "notes" && (
          <button type="button" onClick={() => setEditor({})} className={btnPrimary} style={mono}>
            <Plus className="mr-1 inline size-3" />
            New note
          </button>
        )}
        {tab === "chat" && (
          <button
            type="button"
            onClick={() => {
              const c = addChat();
              setActiveChatId(c.id);
            }}
            className={btnPrimary}
            style={mono}
          >
            <Plus className="mr-1 inline size-3" />
            New chat
          </button>
        )}
      </div>

      {tab === "capture" && (
        <div className="space-y-5">
          <CaptureBox onCapture={addCapture} autoFocus={captureFocus} />
          <SectionHeader index="01" label="Inbox" />
          <CaptureInbox
            captures={doc.captures}
            onDelete={deleteCapture}
            onFile={(c) => {
              setTab("notes");
              setEditor({ prefill: c.text, fromCaptureId: c.id });
            }}
          />
        </div>
      )}

      {tab === "notes" && (
        <NotesList
          notes={doc.notes}
          indexingId={indexingId}
          onEdit={(n) => setEditor({ note: n })}
          onDelete={deleteNote}
          onTogglePin={togglePinNote}
          onMakeSearchable={makeSearchable}
        />
      )}

      {tab === "chat" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <ChatPanel
            chat={activeChat}
            busy={chatBusy}
            onSend={(t) => sendChat(t)}
            onNewChat={() => {
              const c = addChat();
              setActiveChatId(c.id);
            }}
            sourceLabel={storeName ?? "Notes corpus"}
          />
          <div className="order-first lg:order-none">
            <ChatHistoryList
              chats={doc.chats}
              activeId={activeChatId}
              onSelect={setActiveChatId}
              onTogglePin={togglePinChat}
              onDelete={(id) => {
                deleteChat(id);
                if (activeChatId === id) setActiveChatId(null);
              }}
            />
          </div>
        </div>
      )}

      {tab === "sources" && <SourcesManager />}

      {editor && (
        <NoteEditor
          note={editor.note}
          prefill={editor.prefill}
          allTags={allTags}
          onSave={saveNote}
          onDelete={editor.note ? () => deleteNote(editor.note!.id) : undefined}
          onClose={() => setEditor(null)}
        />
      )}
    </PageContainer>
  );
}
