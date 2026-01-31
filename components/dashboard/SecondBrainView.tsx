"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    FileText,
    Upload,
    ArrowRight,
    Bot,
    Loader2,
    RotateCcw,
    MessageSquare,
    Terminal,
    Settings as AISettings,
    Database,
    Layers,
    Trash2,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    History,
    Zap,
    X,
    Pin,
    Edit2
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DashboardSettings, ChatParameters, VectorStore } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface SecondBrainViewProps {
    settings: DashboardSettings;
    onSettingsChange: (settings: DashboardSettings) => void;
}

export function SecondBrainView({ settings, onSettingsChange }: SecondBrainViewProps) {
    const supabase = createSupabaseBrowserClient();
    const [activeTab, setActiveTab] = useState<"docs" | "stores" | "settings">("docs");
    const [isUploading, setIsUploading] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [vectorStores, setVectorStores] = useState<any[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    // File Manager State
    const [managingStoreId, setManagingStoreId] = useState<string | null>(null);
    // Local state for input to avoid hook issues
    const [query, setQuery] = useState("");

    // Manual chat state
    const [messages, setAiMessages] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    // Chat attachment modal state
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [chatVectorStores, setChatVectorStores] = useState<string[]>([]); // Selected stores for this chat
    const [chatFiles, setChatFiles] = useState<File[]>([]); // Files attached to this chat
    const [isUploadingChatFiles, setIsUploadingChatFiles] = useState(false);

    // Discovery prompts and recent searches
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const discoveryPrompts = [
        "What did I write about yesterday?",
        "Find my notes on AI research",
        "Summarize my project plans"
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('neural-recent-searches');
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch (e) { }
    }, []);

    // Save a search query to recent searches
    const saveRecentSearch = (q: string) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('neural-recent-searches', JSON.stringify(updated));
    };

    // Remove a search from recent
    const removeRecentSearch = (q: string) => {
        const updated = recentSearches.filter(s => s !== q);
        setRecentSearches(updated);
        localStorage.setItem('neural-recent-searches', JSON.stringify(updated));
    };

    const onSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        const currentInput = query;
        setQuery(""); // Clear immediately
        saveRecentSearch(currentInput); // Save to recent searches

        // 1. Update UI Optimistically
        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: currentInput };
        const newMsgList = [...messages, userMsg];
        setAiMessages(newMsgList);

        // 2. Persist User Message
        let chatId = activeChatId;
        if (!chatId) {
            chatId = await saveChat(null, newMsgList);
            if (chatId) setActiveChatId(chatId);
        } else {
            const { data: currentChat } = await supabase.from('neural_chats').select('messages').eq('id', chatId).single();
            if (currentChat) {
                await supabase.from('neural_chats').update({
                    messages: [...currentChat.messages, userMsg],
                    updated_at: new Date().toISOString()
                }).eq('id', chatId);
            }
        }
        await fetchHistory();

        // 3. Trigger AI Response (Manual Fetch)
        setIsThinking(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMsgList.map(m => ({ role: m.role, content: m.content })),
                    params: settings.neuralSettings
                })
            });

            if (!response.ok) throw new Error("Neural Core connection failed");

            // For now, handle simple text response (non-streaming for stability first)
            // If the backend returns a stream, we might need a reader.
            // Let's assume the backend might return different things, but let's try reading text first.

            // NOTE: The backend sends a data stream. We need to parse it or use a simple reader.
            // For robust quick fix, let's treat it as a stream but concat text.


            let assistantContent = "";
            const assistantId = "ai-" + Date.now();

            // Add placeholder assistant message
            setAiMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: "" }]);

            // Fallback: Await full text to ensure content exists before rendering
            // Streaming seems to be failing or sending empty chunks.
            const fullText = await response.text();
            console.log("Neural Full Response:", fullText);

            if (!fullText) throw new Error("Received empty response from Neural Core");

            assistantContent = fullText;
            setAiMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
            ));

            // 4. Persist Assistant Message
            if (chatId) {
                const { data: currentChat } = await supabase.from('neural_chats').select('messages').eq('id', chatId).single();
                if (currentChat) {
                    const finalMsg = { id: assistantId, role: 'assistant', content: assistantContent };
                    await supabase.from('neural_chats').update({
                        messages: [...currentChat.messages, finalMsg],
                        updated_at: new Date().toISOString()
                    }).eq('id', chatId);
                    fetchHistory();
                }
            }

        } catch (error) {
            console.error("Neural: Generation failed", error);
            alert("Neural Core Error: Failed to generate response.");
        } finally {
            setIsThinking(false);
        }
    };

    // Sync external messages (history selection) with useChat state
    useEffect(() => {
        if (activeChatId) {
            // When active ID changes (user selected history), load those messages into AI SDK
            const selectedChat = history.find(c => c.id === activeChatId);
            if (selectedChat) {
                setAiMessages(selectedChat.messages);
            }
        } else {
            setAiMessages([]);
        }
    }, [activeChatId, history, setAiMessages]);

    const [storeFiles, setStoreFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const storeFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchHistory = async () => {
        console.log("Neural: Fetching chat history...");
        try {
            const { data, error } = await supabase
                .from('neural_chats')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Neural: History fetch error FULL:", JSON.stringify(error, null, 2));
                console.error("Neural: History fetch error message:", error.message);
                console.error("Neural: History fetch error code:", error.code);
                console.error("Neural: History fetch error details:", error.details);
                return;
            }

            console.log(`Neural: Received ${data?.length || 0} chats`);
            if (data) setHistory(data);
        } catch (err) {
            console.error("Neural: Critical history fetch failure:", err);
        }
    };

    const saveChat = async (chatId: string | null, msgs: ChatMessage[]) => {
        console.log("Neural: Saving chat...", { chatId, messageCount: msgs.length });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';
            console.log("Neural: Acting as user:", userId);

            const chatData = {
                user_id: userId,
                messages: msgs,
                title: msgs[0]?.content.substring(0, 40) + (msgs[0]?.content.length > 40 ? "..." : "") || "Untitled Transmission",
                updated_at: new Date().toISOString()
            };

            if (chatId) {
                console.log("Neural: Updating existing chat:", chatId);
                const { error } = await supabase.from('neural_chats').update(chatData).eq('id', chatId);
                if (error) throw error;
                console.log("Neural: Update successful");
                return chatId;
            } else {
                console.log("Neural: Inserting new chat...");
                const { data, error } = await supabase.from('neural_chats').insert(chatData).select().single();
                if (error) throw error;
                console.log("Neural: Insert successful, new ID:", data?.id);
                if (data) fetchHistory();
                return data?.id || null;
            }
        } catch (error: any) {
            console.error("Neural: Critical Save Error:", error);
            alert(`Neural Persistence Failure: ${error.message}`);
            return chatId;
        }
    };

    const handlePin = async (id: string, currentPin: boolean) => {
        await supabase.from('neural_chats').update({ is_pinned: !currentPin }).eq('id', id);
        fetchHistory();
    };

    const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Use setTimeout to escape the event loop so confirm() doesn't interfere
        setTimeout(async () => {
            if (confirm("Permanently delete this neural transmission?")) {
                await supabase.from('neural_chats').delete().eq('id', id);
                if (activeChatId === id) {
                    setAiMessages([]);
                    setActiveChatId(null);
                }
                fetchHistory();
            }
        }, 0);
    };

    const startRenaming = (chat: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingChatId(chat.id);
        setEditTitle(chat.title || "");
    };

    const handleRename = async (id: string) => {
        if (!editTitle?.trim()) return;
        await supabase.from('neural_chats').update({ title: editTitle.trim() }).eq('id', id);
        setEditingChatId(null);
        fetchHistory();
    };

    const fetchDocs = async () => {
        const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (data) setDocuments(data);
    };

    const fetchStores = async () => {
        console.log("Neural: Fetching cognitive clusters...");
        setIsLoadingStores(true);
        try {
            const res = await fetch("/api/vector/stores");
            if (!res.ok) {
                const errorData = await res.json();
                console.error("Neural: Failed to fetch stores:", errorData.error);
                return;
            }
            const data = await res.json();
            console.log(`Neural: Received ${data?.length || 0} clusters`);
            if (Array.isArray(data)) setVectorStores(data);
        } catch (error) {
            console.error("Neural: Failed to fetch stores", error);
        } finally {
            console.log("Neural: Store fetch complete.");
            setIsLoadingStores(false);
        }
    };

    useEffect(() => {
        fetchDocs();
        fetchStores();
        fetchHistory();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);







    const handleFileUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        if (settings.neuralSettings.activeStoreId) {
            formData.append("activeStoreId", settings.neuralSettings.activeStoreId);
        }

        try {
            await fetch("/api/vector/ingest", {
                method: "POST",
                body: formData,
            });
            fetchDocs();
            fetchStores();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const fetchStoreFiles = async (storeId: string) => {
        setIsLoadingFiles(true);
        setStoreFiles([]);
        try {
            const res = await fetch(`/api/vector/files?storeId=${storeId}`);
            if (!res.ok) throw new Error("Failed to fetch files");
            const data = await res.json();
            setStoreFiles(data);
        } catch (error) {
            console.error("Error fetching files:", error);
            alert("Failed to retrieve node list.");
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleManageFiles = (storeId: string) => {
        setManagingStoreId(storeId);
        fetchStoreFiles(storeId);
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm("Delete this memory node permanently?")) return;
        if (!managingStoreId) return;

        try {
            const res = await fetch(`/api/vector/files?storeId=${managingStoreId}&fileId=${fileId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete file");

            // Refresh list
            fetchStoreFiles(managingStoreId);
            // Refresh stores to update file count
            fetchStores();
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete node.");
        }
    };

    const handleCreateStore = async () => {
        const name = prompt("Enter cluster name:");
        if (!name) return;

        setIsLoadingStores(true);
        try {
            const res = await fetch("/api/vector/stores", {
                method: "POST",
                body: JSON.stringify({ name }),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to initialize cluster");
            }

            await fetchStores();
        } catch (error: any) {
            console.error("Cluster creation error:", error);
            alert(`Neural Error: ${error.message}`);
        } finally {
            setIsLoadingStores(false);
        }
    };

    const handleUploadToStore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !managingStoreId) return;
        const files = Array.from(e.target.files);

        setIsLoadingFiles(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append("file", file);
        });
        formData.append("storeId", managingStoreId);

        try {
            const res = await fetch("/api/vector/files", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            fetchStoreFiles(managingStoreId);
            fetchStores(); // Update counts
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsLoadingFiles(false);
            if (storeFileInputRef.current) storeFileInputRef.current.value = "";
        }
    };

    const handleDeleteStore = async (id: string) => {
        if (!confirm("Are you sure you want to purge this cognitive cluster?")) return;
        try {
            const res = await fetch(`/api/vector/stores?id=${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Deletion failed");
            }
            fetchStores();
        } catch (error: any) {
            console.error("Failed to delete store", error);
            alert(`Failed to delete cluster: ${error.message}`);
        }
    };

    return (
        <div className="h-full w-full flex text-white overflow-hidden relative">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <input type="file" ref={storeFileInputRef} onChange={handleUploadToStore} className="hidden" multiple />

            {/* Left Sidebar: History (Hidden by default) */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full bg-black/40 border-r border-white/5 flex flex-col p-6 overflow-hidden z-20"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black tracking-widest uppercase opacity-40">Chat History</h3>
                            <div className="flex gap-2">
                                <button onClick={fetchHistory} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white"><RotateCcw size={14} /></button>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><ChevronLeft size={16} /></button>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setAiMessages([]);
                                setActiveChatId(null);
                            }}
                            className="w-full p-4 bg-primary text-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest mb-6"
                        >
                            <Plus size={18} />
                            Start a New Chat
                        </button>
                        <div className="space-y-2 overflow-y-auto no-scrollbar flex-1">
                            {history.length === 0 && (
                                <p className="text-[10px] font-bold opacity-20 text-center py-10 uppercase tracking-widest">No previous transmissions</p>
                            )}
                            {history.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => {
                                        setAiMessages(chat.messages);
                                        setActiveChatId(chat.id);
                                        if (window.innerWidth < 1024) setIsHistoryOpen(false);
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all cursor-pointer group relative flex items-start gap-3",
                                        activeChatId === chat.id
                                            ? "bg-primary/20 border-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                                            : "bg-white/5 border-white/5 text-xs font-bold opacity-40 hover:opacity-100 hover:bg-white/10"
                                    )}
                                >
                                    <MessageSquare size={14} className={cn("mt-0.5 shrink-0", chat.is_pinned && "text-primary shadow-sm")} />

                                    <div className="flex-1 min-w-0">
                                        {editingChatId === chat.id ? (
                                            <input
                                                autoFocus
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() => handleRename(chat.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-white/10 border-none outline-none text-xs font-bold rounded px-1 py-0.5 mb-1"
                                            />
                                        ) : (
                                            <p className="truncate text-xs font-bold leading-tight mb-1">{chat.title}</p>
                                        )}
                                        <p className="text-[9px] opacity-40 uppercase tracking-widest">{format(new Date(chat.updated_at), "MMM d, HH:mm")}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePin(chat.id, chat.is_pinned); }}
                                            className={cn("p-1.5 rounded-lg hover:bg-white/10 transition-all", chat.is_pinned ? "text-primary" : "text-white/40")}
                                        >
                                            <Pin size={12} className={chat.is_pinned ? "fill-current" : ""} />
                                        </button>
                                        <button
                                            onClick={(e) => startRenaming(chat, e)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-all"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteChat(chat.id, e)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-all"
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

            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header Controls */}
                <div className="p-6 pr-24 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className={cn("p-3 rounded-2xl transition-all", isHistoryOpen ? "bg-white text-black" : "bg-white/5 text-white/40 hover:text-white")}
                        >
                            <History size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter">NEURAL BRAIN</h1>
                            <div className="flex items-center gap-2 text-[10px] font-bold opacity-30 mt-0.5 uppercase tracking-[0.2em]">
                                <Zap size={10} className="text-primary fill-primary" /> Active_Node_v4.2
                                <span className="ml-2 border-l border-white/10 pl-2">History: {history.length}</span>
                                <span className="ml-2 border-l border-white/10 pl-2">Clusters: {vectorStores.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Empty container to keep spacing consistent */}
                    </div>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className={cn("p-3 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest", isSidePanelOpen ? "bg-white text-black" : "bg-white/5 text-white/40 hover:text-white border border-white/5")}
                    >
                        <AISettings size={20} />
                        {isSidePanelOpen ? "Close Control" : "System Control"}
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 no-scrollbar max-w-4xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                                <Bot size={48} className="text-primary" />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tight mb-2">Neural Link Ready.</h2>
                            <p className="text-sm font-medium opacity-60 max-w-xs leading-relaxed">Ask anything. The system will retrieve relevant context from your ingested knowledge nodes.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {messages.map((m: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn("flex gap-6", m.role === 'user' ? "flex-row-reverse" : "flex-row")}
                                >
                                    <div
                                        style={{ backgroundColor: m.role !== 'user' && settings.secondaryColor ? settings.secondaryColor : undefined }}
                                        className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl", m.role === 'user' ? "bg-white text-black" : (settings.secondaryColor ? "text-black" : "bg-primary text-black"))}
                                    >
                                        {m.role === 'user' ? <MessageSquare size={18} /> : <Bot size={18} />}
                                    </div>
                                    <div className={cn(
                                        "p-6 rounded-[2rem] text-sm leading-relaxed max-w-[80%] shadow-2xl transition-all",
                                        m.role === 'user' ? "bg-white/10 text-white border border-white/5" : "bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-100"
                                    )}>
                                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-pre:bg-zinc-800/80 prose-pre:border prose-pre:border-white/10">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content || ""}
                                            </ReactMarkdown>
                                        </div>
                                        {m.toolInvocations && m.toolInvocations.length > 0 && (
                                            <div className="mt-4 flex flex-col gap-2">
                                                {m.toolInvocations.map((tool: any) => (
                                                    <div key={tool.toolCallId} className="bg-white/5 rounded-lg p-3 text-xs border border-white/5">
                                                        <div className="flex items-center gap-2 font-medium text-purple-300 mb-1">
                                                            <span>⚡ Executing: {tool.toolName}</span>
                                                            {tool.state === 'result' && <span className="text-green-400">✓</span>}
                                                        </div>
                                                        {tool.args && (
                                                            <div className="opacity-60 font-mono truncate max-w-[200px]">{JSON.stringify(tool.args)}</div>
                                                        )}
                                                        {tool.state === 'result' && (
                                                            <div className="mt-2 text-white/40 border-t border-white/5 pt-2">
                                                                Result ready.
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {isThinking && (
                        <div className="flex gap-4 items-center opacity-40 text-xs italic ml-16">
                            <Loader2 size={14} className="animate-spin" /> Neural cores projecting response...
                        </div>
                    )}
                    <div ref={chatEndRef} className="h-10" />
                </div>

                {/* Input Area - Adjusted elevation for comfort */}
                <div className="p-8 pb-32 w-full max-w-4xl mx-auto z-10">
                    {/* Discovery Prompts & Recent Searches */}
                    {messages.length === 0 && (
                        <div className="mb-6 space-y-4">
                            {/* Try asking... hints */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 mr-2 self-center">Try asking:</span>
                                {discoveryPrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuery(prompt); }}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>

                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 mr-2">Recent:</span>
                                    {recentSearches.map((search, i) => (
                                        <div
                                            key={i}
                                            className="group flex items-center gap-1 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full text-xs text-primary/70"
                                        >
                                            <button
                                                onClick={() => { setQuery(search); }}
                                                className="hover:text-primary transition-colors"
                                            >
                                                {search.length > 40 ? search.slice(0, 40) + '...' : search}
                                            </button>
                                            <button
                                                onClick={() => removeRecentSearch(search)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400 ml-1"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />

                        {/* Plus button for attachments */}
                        <button
                            onClick={() => setIsAttachmentModalOpen(true)}
                            className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all hover:scale-110 active:scale-95 z-10",
                                (chatVectorStores.length > 0 || chatFiles.length > 0)
                                    ? "bg-primary text-black"
                                    : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                            )}
                            title="Attach files or connect vector stores"
                        >
                            <Plus size={20} />
                            {/* Badge showing attachment count */}
                            {(chatVectorStores.length > 0 || chatFiles.length > 0) && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">
                                    {chatVectorStores.length + chatFiles.length}
                                </div>
                            )}
                        </button>

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                            placeholder={
                                chatVectorStores.length > 0 || chatFiles.length > 0
                                    ? `Querying ${chatVectorStores.length} store(s) + ${chatFiles.length} file(s)...`
                                    : settings.neuralSettings.activeStoreId
                                        ? "Querying neural nodes + cognitive cluster..."
                                        : "Connect to neural knowledge matrix..."
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-8 pl-20 pr-32 text-lg focus:outline-none focus:bg-white/[0.08] focus:border-primary/40 transition-all shadow-2xl backdrop-blur-sm"
                        />
                        <button
                            onClick={() => onSubmit()}
                            disabled={!query.trim() || isThinking}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-primary text-black rounded-3xl hover:scale-110 active:scale-90 transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
                        >
                            {isThinking ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side Panel: System Control (Docs, Settings, Stores) */}
            <AnimatePresence>
                {isSidePanelOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-6 top-24 bottom-6 w-[450px] bg-black/60 backdrop-blur-2xl border border-white/10 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">System Control</h3>
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Configure Hybrid Intelligence</p>
                            </div>
                            <button onClick={() => setIsSidePanelOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={20} /></button>
                        </div>

                        {/* Sub-Tabs Navigation */}
                        <div className="flex border-b border-white/5">
                            {[
                                { id: "docs", label: "Nodes", icon: Database },
                                { id: "stores", label: "Clusters", icon: Layers },
                                { id: "settings", label: "Neural", icon: AISettings },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-2 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                                        activeTab === tab.id ? "text-primary" : "text-white/20 hover:text-white"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                    {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-primary" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                            <AnimatePresence mode="wait">
                                {activeTab === "docs" && (
                                    <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold opacity-30">Ingested Nodes ({documents.length})</span>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-all shadow-lg"
                                            >
                                                <Upload size={16} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {documents.map((doc, i) => (
                                                <div key={i} className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <FileText size={18} className="text-white/20" />
                                                        <div>
                                                            <p className="text-xs font-bold truncate max-w-[200px]">{doc.metadata?.filename || "Node"}</p>
                                                            <p className="text-[9px] opacity-30 uppercase">{format(new Date(doc.created_at), "MMM d, HH:mm")}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "settings" && (
                                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                                        <section className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black opacity-30 uppercase tracking-widest">Inference Temperature</label>
                                                <span className="text-xs font-black text-primary">{settings.neuralSettings.temperature}</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.1"
                                                value={settings.neuralSettings.temperature}
                                                onChange={(e) => onSettingsChange({
                                                    ...settings,
                                                    neuralSettings: { ...settings.neuralSettings, temperature: parseFloat(e.target.value) }
                                                })}
                                                className="w-full accent-primary h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                            />
                                        </section>

                                        <section className="space-y-4">
                                            <label className="text-[10px] font-black opacity-30 uppercase tracking-widest">Cognitive Model</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {["gpt-5.2", "gpt-5-mini", "gpt-5-nano", "gpt-4-turbo"].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => onSettingsChange({
                                                            ...settings,
                                                            neuralSettings: { ...settings.neuralSettings, model: m as any }
                                                        })}
                                                        className={cn(
                                                            "p-4 rounded-2xl border text-left transition-all",
                                                            settings.neuralSettings.model === m ? "bg-primary text-black border-transparent" : "bg-white/5 border-white/10 text-white/40"
                                                        )}
                                                    >
                                                        <p className="text-xs font-black">{m.toUpperCase()}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black opacity-30 uppercase tracking-widest">Context Node Retrieval</label>
                                                <span className="text-xs font-black text-primary">{settings.neuralSettings.retrievalCount}</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="20" step="1"
                                                value={settings.neuralSettings.retrievalCount}
                                                onChange={(e) => onSettingsChange({
                                                    ...settings,
                                                    neuralSettings: { ...settings.neuralSettings, retrievalCount: parseInt(e.target.value) }
                                                })}
                                                className="w-full accent-primary h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                            />
                                        </section>
                                    </motion.div>
                                )}

                                {activeTab === "stores" && (
                                    <motion.div key="stores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold opacity-30">Active Clusters ({vectorStores.length})</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={fetchStores}
                                                    className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                                <button
                                                    onClick={handleCreateStore}
                                                    className="p-3 bg-primary text-black rounded-xl hover:scale-105 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Initialize Cluster
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {isLoadingStores ? (
                                                <div className="flex flex-col items-center py-20 opacity-20">
                                                    <Loader2 size={32} className="animate-spin mb-4" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Syncing with OpenAI...</p>
                                                </div>
                                            ) : vectorStores.length === 0 ? (
                                                <div className="p-8 border border-white/5 bg-white/5 rounded-[2rem] text-center opacity-30">
                                                    <Layers size={32} className="mx-auto mb-4" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">No active clusters found</p>
                                                </div>
                                            ) : (
                                                vectorStores.map((store) => (
                                                    <div key={store.id} className={cn(
                                                        "group border p-6 rounded-3xl transition-all",
                                                        settings.neuralSettings.activeStoreId === store.id
                                                            ? "bg-primary/20 border-primary/40 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    style={{ backgroundColor: settings.secondaryColor ? `${settings.secondaryColor}20` : undefined, color: settings.secondaryColor || undefined }}
                                                                    className={cn("p-3 rounded-2xl", settings.neuralSettings.activeStoreId === store.id ? "bg-primary text-black" : "bg-primary/10 text-primary")}
                                                                >
                                                                    <Layers size={18} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-black italic">{store.name}</h4>
                                                                    <div className={cn("w-1.5 h-1.5 rounded-full", store.status === 'completed' ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-yellow-500 animate-pulse")} title={store.status === 'completed' ? 'Synced' : 'Active'} />
                                                                </div>
                                                                <p className="text-[9px] opacity-30 uppercase tracking-[0.2em] font-bold">{store.id}</p>
                                                            </div>
                                                        </div>


                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="bg-white/5 p-3 rounded-2xl">
                                                                <p className="text-[8px] opacity-30 mb-1 font-black uppercase">Nodes</p>
                                                                <p className="text-xs font-black">{store.file_counts?.total || 0} Files</p>
                                                            </div>
                                                            <div className="bg-white/5 p-3 rounded-2xl flex items-center justify-center">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleManageFiles(store.id);

                                                                    }}
                                                                    className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center gap-1"
                                                                >
                                                                    <Edit2 size={10} /> Manage Files
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newId = settings.neuralSettings.activeStoreId === store.id ? undefined : store.id;
                                                                    onSettingsChange({
                                                                        ...settings,
                                                                        neuralSettings: { ...settings.neuralSettings, activeStoreId: newId }
                                                                    });
                                                                }}
                                                                className={cn(
                                                                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                    settings.neuralSettings.activeStoreId === store.id
                                                                        ? "bg-white text-black hover:bg-white/80"
                                                                        : "bg-primary/20 text-primary hover:bg-primary hover:text-black"
                                                                )}
                                                            >
                                                                {settings.neuralSettings.activeStoreId === store.id ? "Disconnect Neural Link" : "Connect Neural Link"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteStore(store.id)}
                                                                className="p-3 bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div >
                )
                }
            </AnimatePresence >

            {/* File Manager Modal */}
            <AnimatePresence>
                {
                    managingStoreId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                            onClick={() => setManagingStoreId(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
                            >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-lg font-black uppercase tracking-tighter">Cluster Memory</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => storeFileInputRef.current?.click()}
                                            className="p-2 bg-white text-black rounded-lg hover:scale-105 transition-all"
                                            title="Upload File"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <button onClick={() => setManagingStoreId(null)} className="opacity-50 hover:opacity-100 p-2">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {storeFiles.length > 0 && (
                                    <p className="px-6 pb-2 text-[10px] font-bold opacity-30 uppercase tracking-widest">{storeFiles.length} Nodes Indexed</p>
                                )}
                                <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto space-y-3">
                                    {isLoadingFiles ? (
                                        <div className="flex justify-center py-10 opacity-30">
                                            <Loader2 className="animate-spin" />
                                        </div>
                                    ) : storeFiles.length === 0 ? (
                                        <p className="text-center opacity-30 text-xs uppercase tracking-widest py-10">No memory nodes found</p>
                                    ) : (
                                        storeFiles.map((file: any) => (
                                            <div key={file.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn("p-2 rounded-lg bg-white/5",
                                                        file.status === 'completed' ? "text-green-400" :
                                                            file.status === 'failed' || file.status === 'cancelled' ? "text-red-400" :
                                                                "text-yellow-400 animate-pulse")}>
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold truncate max-w-[180px]">{file.filename || "Unknown Node"}</p>
                                                            <span className={cn("text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold",
                                                                file.status === 'completed' ? "bg-green-500/20 text-green-400" :
                                                                    file.status === 'failed' || file.status === 'cancelled' ? "bg-red-500/20 text-red-400" :
                                                                        "bg-yellow-500/20 text-yellow-400"
                                                            )}>
                                                                {file.status === 'in_progress' ? 'indexing...' : file.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[9px] opacity-40 font-bold uppercase tracking-widest mt-0.5">
                                                            <span>{(file.bytes / 1024).toFixed(1)} KB</span>
                                                            <span>•</span>
                                                            <span>{new Date(file.created_at * 1000).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    className="p-2 bg-white/5 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:scale-110"
                                                    title="Delete Node"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Chat Attachment Modal */}
            <AnimatePresence>
                {isAttachmentModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsAttachmentModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black">Chat Context</h3>
                                    <p className="text-xs text-white/40">Attach files or connect knowledge stores to this chat</p>
                                </div>
                                <button
                                    onClick={() => setIsAttachmentModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Vector Store Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/60">
                                            <Layers size={12} className="inline mr-2" />
                                            Knowledge Stores
                                        </label>
                                        <button
                                            onClick={fetchStores}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            Refresh
                                        </button>
                                    </div>

                                    {vectorStores.length === 0 ? (
                                        <div className="p-4 bg-white/5 rounded-xl text-center text-white/40 text-sm">
                                            No stores available. Create one in System Control.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {vectorStores.map((store: any) => (
                                                <label
                                                    key={store.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                                        chatVectorStores.includes(store.id)
                                                            ? "bg-primary/10 border-primary/40"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={chatVectorStores.includes(store.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const newStores = [...chatVectorStores, store.id];
                                                                setChatVectorStores(newStores);
                                                                // Sync first selected store with global settings
                                                                if (newStores.length === 1 || !settings.neuralSettings.activeStoreId) {
                                                                    onSettingsChange({
                                                                        ...settings,
                                                                        neuralSettings: {
                                                                            ...settings.neuralSettings,
                                                                            activeStoreId: store.id
                                                                        }
                                                                    });
                                                                }
                                                            } else {
                                                                const newStores = chatVectorStores.filter(id => id !== store.id);
                                                                setChatVectorStores(newStores);
                                                                // Update global settings if removing the active store
                                                                if (settings.neuralSettings.activeStoreId === store.id) {
                                                                    onSettingsChange({
                                                                        ...settings,
                                                                        neuralSettings: {
                                                                            ...settings.neuralSettings,
                                                                            activeStoreId: newStores[0] || undefined
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded accent-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate">{store.name}</p>
                                                        <p className="text-[10px] text-white/40">{store.file_counts?.total || 0} files</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        store.status === 'completed' ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                                                    )} />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* File Upload */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/60">
                                        <Upload size={12} className="inline mr-2" />
                                        Upload Files (This Chat Only)
                                    </label>

                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-xl p-6 text-center transition-all",
                                            isUploadingChatFiles
                                                ? "border-primary/40 bg-primary/5"
                                                : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                        )}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const newFiles = Array.from(e.target.files);
                                                    setChatFiles([...chatFiles, ...newFiles]);
                                                }
                                            }}
                                            className="hidden"
                                            id="chat-file-upload"
                                        />
                                        <label htmlFor="chat-file-upload" className="cursor-pointer">
                                            <Upload size={24} className="mx-auto mb-2 text-white/40" />
                                            <p className="text-sm text-white/60">Click to upload or drag files</p>
                                            <p className="text-[10px] text-white/30 mt-1">PDF, TXT, DOCX, MD supported</p>
                                        </label>
                                    </div>

                                    {/* Attached Files List */}
                                    {chatFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {chatFiles.map((file, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                                                >
                                                    <FileText size={16} className="text-primary" />
                                                    <p className="flex-1 text-sm truncate">{file.name}</p>
                                                    <span className="text-[10px] text-white/40">
                                                        {(file.size / 1024).toFixed(1)}KB
                                                    </span>
                                                    <button
                                                        onClick={() => setChatFiles(chatFiles.filter((_, idx) => idx !== i))}
                                                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                                    >
                                                        <X size={14} className="text-white/40 hover:text-red-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/5 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setChatVectorStores([]);
                                        setChatFiles([]);
                                    }}
                                    className="text-sm text-white/40 hover:text-white transition-colors"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsAttachmentModalOpen(false)}
                                    className="px-6 py-3 bg-primary text-black rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                                >
                                    Done ({chatVectorStores.length + chatFiles.length} attached)
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
