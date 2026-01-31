"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Save, Clock, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

interface QuickNotesPopUpProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Note {
    id: string;
    content: string;
    updated_at: string;
    user_id: string;
}

export function QuickNotesPopUp({ isOpen, onClose }: QuickNotesPopUpProps) {
    const supabase = createSupabaseBrowserClient();
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchNotes = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please log in to manage notes");
            return;
        }

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (data) {
            setNotes(data);
            if (data.length > 0 && !activeNoteId) {
                setActiveNoteId(data[0].id);
                setContent(data[0].content);
            } else if (data.length === 0) {
                // Create first note if none exist
                const { data: newNote } = await supabase.from('notes').insert({
                    user_id: user.id,
                    content: "# New Note\nStart typing..."
                }).select().single();
                if (newNote) {
                    setNotes([newNote]);
                    setActiveNoteId(newNote.id);
                    setContent(newNote.content);
                }
            }
        }
    }, [activeNoteId]);

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen, fetchNotes]);

    const saveNote = async (id: string, newContent: string) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('notes')
                .update({
                    content: newContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (!error) {
                setNotes(prev => prev.map(n => n.id === id ? { ...n, content: newContent, updated_at: new Date().toISOString() } : n));
                toast.success("Note saved");
            } else {
                toast.error("Failed to save note");
            }
        } catch (e) {
            console.error("Failed to save note", e);
            toast.error("Error saving note");
        } finally {
            setIsSaving(false);
        }
    };

    const createNewNote = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please log in to create notes");
            return;
        }

        const { data } = await supabase.from('notes').insert({
            user_id: user.id,
            content: "# New Note\nStart typing..."
        }).select().single();

        if (data) {
            setNotes([data, ...notes]);
            setActiveNoteId(data.id);
            setContent(data.content);
            setShowSidebar(false);
        }
    };

    const deleteNote = async (id: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (!error) {
            const remainingNotes = notes.filter(n => n.id !== id);
            setNotes(remainingNotes);
            if (activeNoteId === id) {
                if (remainingNotes.length > 0) {
                    setActiveNoteId(remainingNotes[0].id);
                    setContent(remainingNotes[0].content);
                } else {
                    createNewNote();
                }
            }
            toast.success("Note deleted");
        }
    };

    // Debounced save for active note
    useEffect(() => {
        if (!activeNoteId) return;
        const timer = setTimeout(() => {
            const currentNote = notes.find(n => n.id === activeNoteId);
            if (currentNote && currentNote.content !== content) {
                saveNote(activeNoteId, content);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [content, activeNoteId, notes]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-start p-8 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: -50 }}
                        className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto h-[600px] flex flex-col mb-24 ml-24"
                    >
                        {/* Header */}
                        <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className={cn("flex items-center p-2 rounded-xl transition-all", showSidebar ? "bg-primary text-black" : "bg-primary/20 text-primary")}
                                >
                                    <FileText size={18} />
                                    <span className={cn("text-xs font-bold transition-all overflow-hidden", showSidebar ? "max-w-[100px] ml-2" : "max-w-0 opacity-0")}>
                                        Archives
                                    </span>
                                </button>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-40">Neural Scratchpad</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white/80">
                                            {notes.find(n => n.id === activeNoteId)?.content.split('\n')[0].replace(/^#\s*/, '') || "Untitled"}
                                        </span>
                                        {isSaving && <span className="w-1 h-1 bg-primary rounded-full animate-ping" />}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => activeNoteId && saveNote(activeNoteId, content)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
                                    title="Save Note"
                                >
                                    <Save size={18} />
                                </button>
                                <button onClick={createNewNote} className="p-2 hover:bg-white/10 rounded-full transition-all text-primary" title="New Note">
                                    <Plus size={18} />
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Main Layout */}
                        <div className="flex-1 flex overflow-hidden relative">
                            {/* Sidebar Overlay */}
                            <AnimatePresence>
                                {showSidebar && (
                                    <motion.div
                                        initial={{ x: -250 }}
                                        animate={{ x: 0 }}
                                        exit={{ x: -250 }}
                                        className="absolute inset-y-0 left-0 w-64 bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
                                    >
                                        <div className="p-4 flex justify-between items-center border-b border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Your Archives</span>
                                            <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-white/10 rounded-lg">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {notes.map(note => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => {
                                                        setActiveNoteId(note.id);
                                                        setContent(note.content);
                                                        setShowSidebar(false);
                                                    }}
                                                    className={cn(
                                                        "p-3 rounded-xl cursor-pointer transition-all border group",
                                                        activeNoteId === note.id
                                                            ? "bg-primary/10 border-primary/20"
                                                            : "border-transparent hover:bg-white/5"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className={cn("text-xs font-bold truncate", activeNoteId === note.id ? "text-primary" : "text-white/70")}>
                                                                {note.content.split('\n')[0].replace(/^#\s*/, '') || "Untitled"}
                                                            </div>
                                                            <div className="text-[9px] opacity-30 font-mono mt-1">
                                                                {new Date(note.updated_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Editor */}
                            <div className="flex-1 p-6 relative">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Capture your thoughts here... (Markdown supported)"
                                    className="w-full h-full bg-transparent outline-none resize-none text-white/90 placeholder:text-white/10 text-sm leading-relaxed font-mono"
                                />
                            </div>
                        </div>

                        {/* Footer / Meta */}
                        <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[10px] font-bold opacity-30 uppercase tracking-widest">
                                <Clock size={12} />
                                <span>
                                    {notes.find(n => n.id === activeNoteId)
                                        ? `MODIFIED: ${new Date(notes.find(n => n.id === activeNoteId)!.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        : "NO ARCHIVE SELECTED"}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold opacity-30">
                                <span>{content.length} CHR</span>
                                <span>{content.split(/\s+/).filter(Boolean).length} WRD</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
