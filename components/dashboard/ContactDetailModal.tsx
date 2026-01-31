"use client";

import { useState, useEffect } from "react";
import {
    X,
    Mail,
    Phone,
    Building2,
    Briefcase,
    Calendar,
    Tag,
    Plus,
    Trash2,
    Shield,
    Globe,
    Linkedin,
    Twitter,
    Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Contact, CustomField } from "@/lib/types";

interface ContactDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact;
    allContacts?: Contact[];
    onSave: (contact: Contact) => void;
    onDelete?: (id: string) => void;
}

export function ContactDetailModal({ isOpen, onClose, contact, allContacts, onSave, onDelete }: ContactDetailModalProps) {
    const [editedContact, setEditedContact] = useState<Contact>(contact);
    const [newTag, setNewTag] = useState("");
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldValue, setNewFieldValue] = useState("");
    const [isAddingField, setIsAddingField] = useState(false);

    // Reset editedContact when the open contact changes
    useEffect(() => {
        setEditedContact(contact);
    }, [contact]);

    const handleAddTag = () => {
        if (!newTag.trim() || editedContact.tags.includes(newTag)) return;
        setEditedContact({
            ...editedContact,
            tags: [...editedContact.tags, newTag]
        });
        setNewTag("");
    };

    const removeTag = (tag: string) => {
        setEditedContact({
            ...editedContact,
            tags: editedContact.tags.filter(t => t !== tag)
        });
    };

    const handleAddCustomField = () => {
        if (!newFieldName.trim() || !newFieldValue.trim()) return;
        const newField: CustomField = {
            id: Math.random().toString(36).substr(2, 9),
            label: newFieldName,
            value: newFieldValue
        };
        setEditedContact({
            ...editedContact,
            customFields: [...(editedContact.customFields || []), newField]
        });
        setNewFieldName("");
        setNewFieldValue("");
        setIsAddingField(false);
    };

    const removeCustomField = (id: string) => {
        setEditedContact({
            ...editedContact,
            customFields: editedContact.customFields?.filter(f => f.id !== id)
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header Profile */}
                        <div className="p-8 pb-4 flex items-center gap-6 border-b border-white/5">
                            <div className={cn(
                                "w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner relative group overflow-hidden",
                                editedContact.avatarColor
                            )}>
                                {editedContact.name.charAt(0)}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white cursor-pointer">
                                    CHANGE
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    value={editedContact.name}
                                    onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                                    className="bg-transparent text-3xl font-black text-white outline-none w-full focus:bg-white/5 px-2 rounded-xl transition-all tracking-tighter"
                                />
                                <div className="px-2 mt-1 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Add nickname..."
                                        value={editedContact.nickname || ""}
                                        onChange={(e) => setEditedContact({ ...editedContact, nickname: e.target.value })}
                                        className="bg-transparent text-sm font-medium text-white/50 outline-none w-full focus:text-white placeholder:text-white/20 transition-all font-mono"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-2 px-2">
                                    <div className="flex items-center gap-1.5 text-xs text-white/40 font-bold uppercase tracking-widest">
                                        <Briefcase size={12} className="text-primary" />
                                        <input
                                            value={editedContact.role}
                                            onChange={(e) => setEditedContact({ ...editedContact, role: e.target.value })}
                                            className="bg-transparent outline-none focus:text-white transition-colors"
                                        />
                                    </div>
                                    <span className="text-white/10">/</span>
                                    <div className="flex items-center gap-1.5 text-xs text-white/40 font-bold uppercase tracking-widest">
                                        <Building2 size={12} className="text-primary" />
                                        <input
                                            value={editedContact.company}
                                            onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                                            className="bg-transparent outline-none focus:text-white transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/20 hover:text-white transition-colors p-2 self-start">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                            {/* Contact Info Grid */}
                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Email Node</label>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3 px-4 group focus-within:border-white/20 transition-all">
                                        <Mail size={16} className="text-white/20 group-focus-within:text-primary" />
                                        <input
                                            value={editedContact.email || ""}
                                            onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                                            placeholder="neural@network.com"
                                            className="bg-transparent text-sm outline-none flex-1 font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Voice Line</label>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3 px-4 group focus-within:border-white/20 transition-all">
                                        <Phone size={16} className="text-white/20 group-focus-within:text-primary" />
                                        <input
                                            value={editedContact.phone || ""}
                                            onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                            className="bg-transparent text-sm outline-none flex-1 font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Last Interaction Summary</label>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 px-4 group focus-within:border-white/20 transition-all">
                                        <textarea
                                            value={editedContact.lastInteractionSummary || ""}
                                            onChange={(e) => setEditedContact({ ...editedContact, lastInteractionSummary: e.target.value })}
                                            placeholder="Notes from your last conversation..."
                                            className="bg-transparent text-sm outline-none w-full font-medium h-20 resize-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Tags Section */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Tag size={12} className="text-primary" /> Relationship Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {editedContact.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/60 group hover:border-red-500/30 hover:text-red-400 transition-all cursor-default">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100"><X size={10} /></button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-full px-3 py-1 text-xs">
                                        <Plus size={12} />
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                                            placeholder="New Tag..."
                                            className="bg-transparent outline-none w-20 text-[10px] font-bold uppercase"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Custom Fields - The "Subfields" request */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Shield size={12} className="text-primary" /> Extended Metadata
                                    </h3>
                                    <button
                                        onClick={() => setIsAddingField(true)}
                                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                    >
                                        + Dynamic Field
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {editedContact.customFields?.map(field => (
                                        <div key={field.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 group">
                                            <div className="w-1/3 text-[10px] font-black text-white/30 uppercase tracking-widest truncate">{field.label}</div>
                                            <div className="flex-1 text-sm font-medium">{field.value}</div>
                                            <button
                                                onClick={() => removeCustomField(field.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {isAddingField && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3 p-4 bg-white/5 border border-primary/20 rounded-2xl">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    placeholder="Field Label (e.g. Website)"
                                                    value={newFieldName}
                                                    onChange={e => setNewFieldName(e.target.value)}
                                                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40"
                                                />
                                                <input
                                                    placeholder="Field Value"
                                                    value={newFieldValue}
                                                    onChange={e => setNewFieldValue(e.target.value)}
                                                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setIsAddingField(false)} className="px-3 py-1 text-[10px] font-bold uppercase opacity-40">Cancel</button>
                                                <button onClick={handleAddCustomField} className="px-4 py-1.5 bg-primary text-black rounded-lg text-[10px] font-black uppercase">Add Cluster</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {(!editedContact.customFields || editedContact.customFields.length === 0) && !isAddingField && (
                                        <div className="text-center py-6 opacity-20 italic text-xs">No extended data nodes found.</div>
                                    )}
                                </div>
                            </section>

                            {/* Neural Connections Section */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Share2 size={12} className="text-primary" /> Neural Connections
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {editedContact.connections?.map(conn => {
                                        const linkedContact = allContacts?.find(c => c.id === conn.contactId);
                                        return (
                                            <div key={conn.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 group">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black", linkedContact?.avatarColor || "bg-zinc-800")}>
                                                        {linkedContact?.name.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{linkedContact?.name || "Unknown Node"}</p>
                                                        <p className="text-[8px] opacity-30 uppercase tracking-widest">{conn.type}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setEditedContact({
                                                        ...editedContact,
                                                        connections: editedContact.connections?.filter(c => c.id !== conn.id)
                                                    })}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    <div className="relative group">
                                        <div className="flex items-center gap-3 bg-white/5 border border-dashed border-white/10 rounded-2xl p-3 px-4 transition-all hover:border-primary/40">
                                            <Plus size={14} className="text-white/20" />
                                            <select
                                                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none flex-1 appearance-none cursor-pointer"
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    if (!id || editedContact.connections?.some(c => c.contactId === id)) return;
                                                    setEditedContact({
                                                        ...editedContact,
                                                        connections: [...(editedContact.connections || []), {
                                                            id: Math.random().toString(),
                                                            contactId: id,
                                                            type: "direct"
                                                        }]
                                                    });
                                                    e.target.value = "";
                                                }}
                                            >
                                                <option value="" className="bg-black text-white">Link New Node...</option>
                                                {allContacts?.filter(c => c.id !== editedContact.id).map(c => (
                                                    <option key={c.id} value={c.id} className="bg-black text-white">
                                                        {c.name} ({c.company})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {(!editedContact.connections || editedContact.connections.length === 0) && (
                                        <div className="text-center py-6 opacity-20 italic text-xs">No neural links established.</div>
                                    )}
                                </div>
                            </section>
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Social Integrations</label>
                                    <div className="flex gap-2">
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all"><Linkedin size={18} /></button>
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all"><Twitter size={18} /></button>
                                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all"><Globe size={18} /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-1">Sync Frequency</label>
                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                        {[30, 90, 180].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setEditedContact({ ...editedContact, frequency: d })}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all",
                                                    editedContact.frequency === d ? "bg-white text-black" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {d}D
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center px-10">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-white/20" />
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Last Talked: {format(editedContact.lastContacted, "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex gap-4 items-center">
                                {!editedContact.id ? (
                                    <button onClick={onClose} className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">
                                        DISCARD
                                    </button>
                                ) : (
                                    onDelete && (
                                        <button
                                            onClick={() => onDelete(editedContact.id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors mr-4 flex items-center gap-2"
                                        >
                                            <Trash2 size={12} /> Delete Node
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => onSave(editedContact)}
                                    className="bg-white text-black px-12 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95"
                                >
                                    SYNC_PROFILE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
