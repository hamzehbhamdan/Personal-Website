"use client";

import { useState } from "react";
import { X, Share2, Trash2, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConnectionManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: Contact[];
    onUpdate: () => void;
}

export function ConnectionManagerModal({ isOpen, onClose, contacts, onUpdate }: ConnectionManagerModalProps) {
    // Flatten all connections
    const allConnections = contacts.flatMap(c =>
        (c.connections || []).map(conn => ({
            id: conn.id,
            source: c,
            targetId: conn.contactId,
            type: conn.type
        }))
    ).filter((v, i, a) => a.findIndex(t => (t.source.id === v.source.id && t.targetId === v.targetId) || (t.source.id === v.targetId && t.targetId === v.source.id)) === i); // Deduplicate simple pairs

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = async (connId: string) => {
        // This is tricky because connId in UI might be synthesized if not strictly from DB ID
        // But let's assume valid ID.
        // Actually, deleting requires identifying the 'contact_connections' row ID.
        // Our 'Contact' type has 'connections.id' which should map to the join table ID.
        if (!connId) return;

        const { error } = await supabase.from('contact_connections').delete().eq('id', connId);

        if (error) {
            toast.error("Failed to sever link.");
            console.error(error);
        } else {
            toast.success("Link severed.");
            onUpdate();
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
                        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Share2 size={20} className="text-primary" /> Neural Synapses ({allConnections.length})
                            </h2>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                            {allConnections.length === 0 ? (
                                <div className="text-center py-10 opacity-30 italic">
                                    No active connections detected in the network.
                                </div>
                            ) : (
                                allConnections.map((conn) => {
                                    const target = contacts.find(c => c.id === conn.targetId);
                                    if (!target) return null;

                                    return (
                                        <div key={conn.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4 group hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center -space-x-3">
                                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-black z-10", conn.source.avatarColor)}>
                                                        {conn.source.name.charAt(0)}
                                                    </div>
                                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-black", target.avatarColor)}>
                                                        {target.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold flex items-center gap-2 text-white">
                                                        {conn.source.name} <LinkIcon size={12} className="opacity-30" /> {target.name}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-widest opacity-40">
                                                        {conn.type || "Direct"} Connection
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(conn.id)}
                                                className="p-2 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
