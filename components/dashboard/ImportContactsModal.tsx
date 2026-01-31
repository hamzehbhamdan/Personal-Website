"use client";

import { useState } from "react";
import { X, Upload, FileText, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ImportContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

export function ImportContactsModal({ isOpen, onClose, onImportComplete }: ImportContactsModalProps) {
    const [text, setText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleImport = async () => {
        if (!text.trim()) return;

        setIsProcessing(true);
        try {
            // Simple parsing: assumes Name, Email, Role, Company per line or comma separated?
            // Let's assume CSV format: Name, Company, Role, Email
            const lines = text.trim().split('\n');
            const contacts = lines.map(line => {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 2) return null;
                return {
                    name: parts[0],
                    company: parts[1] || "TBD",
                    role: parts[2] || "Contact",
                    email: parts[3] || "",
                    user_id: '00000000-0000-0000-0000-000000000000' // Default demo user for now, or auth user
                };
            }).filter(Boolean);

            if (contacts.length === 0) {
                toast.error("No valid contacts found. Format: Name, Company, Role, Email");
                setIsProcessing(false);
                return;
            }

            const session = await supabase.auth.getUser();
            const userId = session.data.user?.id || '00000000-0000-0000-0000-000000000000';

            const contactsWithUser = contacts.map(c => ({ ...c, user_id: userId }));

            const { error } = await supabase.from('contacts').insert(contactsWithUser);

            if (error) {
                console.error("Import error:", error);
                toast.error("Failed to import contacts.");
            } else {
                toast.success(`Broadcasting ${contacts.length} new signals...`);
                onImportComplete();
                onClose();
                setText("");
            }
        } catch (e) {
            console.error("Import parse error:", e);
            toast.error("Failed to parse input.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Upload size={20} className="text-primary" /> Import Nodes
                            </h2>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-white/60">
                                <p className="font-bold text-white mb-2 flex items-center gap-2"><FileText size={14} /> Format Guide</p>
                                <p>Paste CSV data (one per line):</p>
                                <div className="bg-black/50 p-2 rounded mt-2 font-mono text-xs text-white/40">
                                    Name, Company, Role, Email
                                </div>
                            </div>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Elon Musk, SpaceX, CEO, elon@spacex.com..."
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono outline-none focus:border-white/20 transition-all resize-none"
                            />

                            <button
                                onClick={handleImport}
                                disabled={isProcessing || !text.trim()}
                                className="w-full bg-white text-black py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? "Processing..." : "Ingest Data"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
