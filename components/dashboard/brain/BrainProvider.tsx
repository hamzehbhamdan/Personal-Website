"use client";
// Shell-level provider owning the SINGLE useAppState("brain") instance. Mounted
// in Shell above <main> and <CommandPalette> so Home's quick-capture and ⌘K's
// capture both mutate the same in-memory doc — no extra route, no autosave race.
import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { useAppState } from "@/lib/dashboard/useAppState";
import type { SaveStatus as SyncSaveStatus } from "@/lib/dashboard/state-sync";
import { emptyBrain, normalizeBrain, trimBrain, uid, nowIso } from "@/lib/dashboard/brain/seed";
import type { BrainDoc, BrainNote, BrainChat, BrainChatMsg, BrainSettings } from "@/lib/dashboard/brain/types";

export type BrainTab = "capture" | "notes" | "chat" | "sources";
export interface BrainIntent {
  tab: BrainTab;
  noteId?: string; // open an existing note in the editor
  compose?: boolean; // open a NEW-note composer
  draft?: string; // prefill text for compose (notes) or auto-send (chat)
}

type SaveStatus = "idle" | SyncSaveStatus;

interface BrainContextValue {
  doc: BrainDoc;
  loaded: boolean;
  loadError: boolean;
  retryLoad: () => void;
  status: SaveStatus;
  addCapture: (text: string) => void;
  deleteCapture: (id: string) => void;
  addNote: (partial: { title?: string; text: string; tags?: string[] }) => BrainNote;
  updateNote: (id: string, patch: Partial<Pick<BrainNote, "title" | "text" | "tags" | "docId" | "pinned">>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  addChat: () => BrainChat;
  appendChatMsg: (chatId: string, msg: BrainChatMsg) => void;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  togglePinChat: (id: string) => void;
  setSettings: (patch: Partial<BrainSettings>) => void;
  intent: BrainIntent | null;
  requestOpen: (intent: BrainIntent) => void;
  consumeIntent: () => void;
}

const BrainContext = createContext<BrainContextValue | null>(null);

export function useBrain(): BrainContextValue {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error("useBrain must be used within <BrainProvider>");
  return ctx;
}

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const { state, setState, loaded, loadError, retryLoad, status } = useAppState<BrainDoc>("brain", emptyBrain());
  const doc = useMemo(() => normalizeBrain(state), [state]);
  const [intent, setIntent] = useState<BrainIntent | null>(null);

  const mutate = useCallback(
    (fn: (d: BrainDoc) => BrainDoc) => setState((prev) => trimBrain(fn(normalizeBrain(prev)))),
    [setState],
  );

  const addCapture = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      const cap = { id: uid(), text: t, createdAt: nowIso() };
      mutate((d) => ({ ...d, captures: [cap, ...d.captures] }));
    },
    [mutate],
  );
  const deleteCapture = useCallback(
    (id: string) => mutate((d) => ({ ...d, captures: d.captures.filter((c) => c.id !== id) })),
    [mutate],
  );

  const addNote = useCallback(
    (partial: { title?: string; text: string; tags?: string[] }): BrainNote => {
      const note: BrainNote = {
        id: uid(),
        title: partial.title ?? "",
        text: partial.text,
        tags: partial.tags ?? [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        pinned: false,
        docId: null,
      };
      mutate((d) => ({ ...d, notes: [note, ...d.notes] }));
      return note;
    },
    [mutate],
  );
  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<BrainNote, "title" | "text" | "tags" | "docId" | "pinned">>) =>
      mutate((d) => ({
        ...d,
        notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)),
      })),
    [mutate],
  );
  const deleteNote = useCallback(
    (id: string) => mutate((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) })),
    [mutate],
  );
  const togglePinNote = useCallback(
    (id: string) =>
      mutate((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),
    [mutate],
  );

  const addChat = useCallback((): BrainChat => {
    const chat: BrainChat = { id: uid(), title: "New chat", messages: [], createdAt: nowIso(), updatedAt: nowIso() };
    mutate((d) => ({ ...d, chats: [chat, ...d.chats] }));
    return chat;
  }, [mutate]);
  const appendChatMsg = useCallback(
    (chatId: string, msg: BrainChatMsg) =>
      mutate((d) => ({
        ...d,
        chats: d.chats.map((c) => {
          if (c.id !== chatId) return c;
          const title = c.title === "New chat" && msg.role === "user" ? msg.content.slice(0, 60) : c.title;
          return { ...c, messages: [...c.messages, msg], title, updatedAt: nowIso() };
        }),
      })),
    [mutate],
  );
  const renameChat = useCallback(
    (id: string, title: string) =>
      mutate((d) => ({ ...d, chats: d.chats.map((c) => (c.id === id ? { ...c, title: title.slice(0, 80) } : c)) })),
    [mutate],
  );
  const deleteChat = useCallback(
    (id: string) => mutate((d) => ({ ...d, chats: d.chats.filter((c) => c.id !== id) })),
    [mutate],
  );
  const togglePinChat = useCallback(
    (id: string) =>
      mutate((d) => ({ ...d, chats: d.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)) })),
    [mutate],
  );

  const setSettings = useCallback(
    (patch: Partial<BrainSettings>) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [mutate],
  );

  const requestOpen = useCallback((i: BrainIntent) => setIntent(i), []);
  const consumeIntent = useCallback(() => setIntent(null), []);

  const value = useMemo<BrainContextValue>(
    () => ({
      doc,
      loaded,
      loadError,
      retryLoad,
      status,
      addCapture,
      deleteCapture,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      addChat,
      appendChatMsg,
      renameChat,
      deleteChat,
      togglePinChat,
      setSettings,
      intent,
      requestOpen,
      consumeIntent,
    }),
    [doc, loaded, loadError, retryLoad, status, addCapture, deleteCapture, addNote, updateNote, deleteNote, togglePinNote, addChat, appendChatMsg, renameChat, deleteChat, togglePinChat, setSettings, intent, requestOpen, consumeIntent],
  );

  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
}
