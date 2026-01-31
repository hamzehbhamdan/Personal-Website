"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, User, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface NeuralChatPopUpProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NeuralChatPopUp({ isOpen, onClose }: NeuralChatPopUpProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Neural Interface active. How can I assist with your objectives today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userMsg }]
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
            }
        } catch (e) {
            console.error("Chat failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-start p-8 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
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
                                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                    <Brain size={18} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-40">Neural Link</span>
                                    <span className="text-xs font-bold text-white/80">AI Assistant</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10",
                                        msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"
                                    )}>
                                        {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === "assistant" ? "bg-white/5 border border-white/5 text-white/90" : "bg-primary text-black font-medium"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center">
                                        <Bot size={14} className="text-primary" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-1 items-center">
                                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/5 bg-black/20">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Inquire..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 outline-none focus:border-primary transition-all text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-3 bg-primary text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
