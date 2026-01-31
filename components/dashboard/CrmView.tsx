"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Mail, Calendar, Grid, List, UserPlus, Share2, Upload, Network, Users } from "lucide-react";
import { subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ContactTable } from "./ContactTable";
import { ContactDetailModal } from "./ContactDetailModal";
import { ImportContactsModal } from "./ImportContactsModal";
import { ConnectionManagerModal } from "./ConnectionManagerModal";
import { NetworkGraph } from "./NetworkGraph";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Contact } from "@/lib/types";
import { toast } from "sonner";
import { ContactCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const initialContacts: Contact[] = [
    { id: "00000000-0000-0000-0000-000000000001", name: "Sarah Chen", role: "Product Manager", company: "Google", lastContacted: subDays(new Date(), 45), frequency: 30, tags: ["Tech", "Mentor"], avatarColor: "bg-blue-500", customFields: [] },
    { id: "00000000-0000-0000-0000-000000000002", name: "David Miller", role: "Founder", company: "Stealth Startup", lastContacted: subDays(new Date(), 2), frequency: 90, tags: ["Investor", "Friend"], avatarColor: "bg-emerald-500", customFields: [] },
    { id: "00000000-0000-0000-0000-000000000003", name: "Emily Zhang", role: "Designer", company: "Freelance", lastContacted: subDays(new Date(), 120), frequency: 60, tags: ["Design", "Contractor"], avatarColor: "bg-purple-500", customFields: [] },
];

import { DashboardSettings } from "@/lib/types";

export function CrmView({ settings }: { settings?: DashboardSettings }) {
    const supabase = createSupabaseBrowserClient();
    const [view, setView] = useState<"grid" | "table" | "graph">("table");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

    // Filtering & Sorting
    const [filterTag, setFilterTag] = useState<string>("All");
    const [sortBy, setSortBy] = useState<"recent" | "overdue">("recent");

    const fetchContacts = async () => {
        setIsLoading(true);
        // 1. Fetch all contacts
        const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .select('*')
            .order('last_talked', { ascending: false });

        if (contactError) {
            console.error("Error fetching contacts:", JSON.stringify(contactError, null, 2));
            setContacts(initialContacts);
            setIsLoading(false);
            return;
        }

        // 2. Fetch all connections for the user
        const { data: connectionData, error: connectionError } = await supabase
            .from('contact_connections')
            .select('*');

        if (!contactData || contactData.length === 0) {
            setContacts(initialContacts);
        } else {
            setContacts(contactData.map(c => {
                // Find connections where this contact is either A or B
                const relevantConns = (connectionData || []).filter(conn =>
                    conn.contact_a === c.id || conn.contact_b === c.id
                );

                return {
                    id: c.id,
                    name: c.name,
                    nickname: c.nickname || "",
                    role: c.role || "Contact",
                    company: c.company || "TBD",
                    email: c.email || "",
                    phone: c.phone || "",
                    lastContacted: c.last_talked ? new Date(c.last_talked) : new Date(),
                    lastInteractionSummary: c.last_interaction_summary || "",
                    frequency: c.frequency || 30,
                    tags: c.tags || [],
                    avatarColor: c.avatar_color || "bg-zinc-500",
                    customFields: c.custom_fields || [],
                    connections: relevantConns.map(conn => ({
                        id: conn.id,
                        // If I am A, the other is B. If I am B, the other is A.
                        contactId: conn.contact_a === c.id ? conn.contact_b : conn.contact_a,
                        type: conn.connection_type,
                        metadata: conn.metadata
                    }))
                };
            }));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Handle global subview switching (Cmd + Shift + Arrows)
    useEffect(() => {
        const handleSwitchView = (e: any) => {
            const direction = e.detail.direction;
            const views: Array<"grid" | "table" | "graph"> = ["grid", "table", "graph"];
            const currentIndex = views.indexOf(view);
            let nextIndex = 0;

            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % views.length;
            } else {
                nextIndex = (currentIndex - 1 + views.length) % views.length;
            }

            setView(views[nextIndex]);
        };

        window.addEventListener('switch-subview', handleSwitchView);
        return () => window.removeEventListener('switch-subview', handleSwitchView);
    }, [view]);

    // Derived State
    const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || [])));

    const filteredContacts = contacts.filter(c => {
        if (filterTag !== "All" && !c.tags?.includes(filterTag)) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === "recent") {
            return b.lastContacted.getTime() - a.lastContacted.getTime();
        } else {
            return a.lastContacted.getTime() - b.lastContacted.getTime();
        }
    });

    const getStatus = (contact: Contact) => {
        const daysSince = Math.floor((new Date().getTime() - contact.lastContacted.getTime()) / (1000 * 3600 * 24));
        const overdue = daysSince > contact.frequency;
        return { daysSince, overdue };
    };

    // Get warmth indicator: green (warm), yellow (cooling), red (cold)
    const getWarmth = (contact: Contact) => {
        const daysSince = Math.floor((new Date().getTime() - contact.lastContacted.getTime()) / (1000 * 3600 * 24));
        const ratio = daysSince / contact.frequency;

        if (ratio < 0.5) return { color: 'bg-emerald-500', label: 'Warm' };
        if (ratio < 1) return { color: 'bg-amber-500', label: 'Cooling' };
        return { color: 'bg-red-500', label: 'Cold' };
    };

    return (
        <div className="h-full w-full p-8 flex flex-col text-white max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1 tracking-tight">Network</h1>
                    <p className="text-white/40 text-sm italic">Keep your relationships warm.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 px-2 backdrop-blur-md">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Filter:</span>
                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                        >
                            <option value="All" className="bg-black">ALL TAGS</option>
                            {allTags.map(t => <option key={t} value={t} className="bg-black">{t.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 px-2 backdrop-blur-md">
                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "recent" | "overdue")}
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                        >
                            <option value="recent" className="bg-black">RECENTLY CONTACTED</option>
                            <option value="overdue" className="bg-black">LEAST RECENT (OVERDUE)</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setIsConnectionsOpen(true)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all backdrop-blur-md"
                        title="Manage Connections"
                    >
                        <Network size={18} />
                    </button>

                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all backdrop-blur-md"
                        title="Import Contacts"
                    >
                        <Upload size={18} />
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex gap-1 backdrop-blur-md">
                        <button
                            onClick={() => setView("grid")}
                            className={`p-1.5 rounded-md transition-all ${view === "grid" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white"}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setView("table")}
                            className={`p-1.5 rounded-md transition-all ${view === "table" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white"}`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setView("graph")}
                            className={`p-1.5 rounded-md transition-all ${view === "graph" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white"}`}
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
                    >
                        <UserPlus size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    {view === "grid" ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 scrollbar-hide"
                        >
                            {isLoading ? (
                                // Skeleton loading state
                                <>
                                    <ContactCardSkeleton />
                                    <ContactCardSkeleton />
                                    <ContactCardSkeleton />
                                    <ContactCardSkeleton />
                                    <ContactCardSkeleton />
                                    <ContactCardSkeleton />
                                </>
                            ) : filteredContacts.length === 0 ? (
                                // Empty state - full width
                                <div className="col-span-full flex items-center justify-center py-16">
                                    <EmptyState
                                        icon={<Users size={28} />}
                                        title="Your network is empty"
                                        description="Add your first contact to start building meaningful relationships."
                                        actionLabel="Add Contact"
                                        onAction={() => setIsCreating(true)}
                                    />
                                </div>
                            ) : (
                                filteredContacts.map((contact, i) => {
                                    const status = getStatus(contact);
                                    const warmth = getWarmth(contact);
                                    const hasCompany = contact.company && contact.company !== 'TBD' && contact.company.trim() !== '';
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={contact.id}
                                            onClick={() => setSelectedContact(contact)}
                                            className="glass rounded-2xl p-6 hover:bg-white/[0.05] transition-all group relative shadow-2xl cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center text-xl font-bold font-mono shadow-inner text-white`}>
                                                        {contact.name.charAt(0)}
                                                    </div>
                                                    {/* Warmth indicator dot */}
                                                    <div
                                                        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${warmth.color} border-2 border-black/50`}
                                                        title={warmth.label}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    {contact.connections && contact.connections.length > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary animate-pulse">
                                                            <Share2 size={10} /> {contact.connections.length}
                                                        </div>
                                                    )}
                                                    <button className="text-white/20 hover:text-white transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{contact.name}</h3>
                                                {/* Only show role/company if they exist */}
                                                {(contact.role || hasCompany) && (
                                                    <p className="text-sm text-white/40 italic">
                                                        {contact.role}{hasCompany ? ` @ ${contact.company}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {contact.tags.slice(0, 3).map((tag) => (
                                                    <span key={tag} className="px-2 py-0.5 text-[10px] uppercase font-bold bg-white/5 rounded text-white/50 border border-white/5 tracking-widest">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${status.overdue ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                                    {status.overdue ? "Overdue" : `${status.daysSince}d`}
                                                </div>
                                                {status.overdue && (
                                                    <button className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition-all border border-white/10">
                                                        Reach Out
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    ) : view === "table" ? (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)" }}
                            className="flex-1 min-h-0"
                        >
                            <ContactTable contacts={filteredContacts} onContactClick={setSelectedContact} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="graph"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex-1 min-h-0 h-full overflow-hidden"
                        >
                            <NetworkGraph contacts={filteredContacts} showNicknames={settings?.showNicknames} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ImportContactsModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImportComplete={fetchContacts}
            />

            <ConnectionManagerModal
                isOpen={isConnectionsOpen}
                onClose={() => setIsConnectionsOpen(false)}
                contacts={contacts}
                onUpdate={fetchContacts}
            />

            <ContactDetailModal
                isOpen={!!selectedContact || isCreating}
                onClose={() => {
                    setSelectedContact(null);
                    setIsCreating(false);
                }}
                allContacts={contacts}
                contact={selectedContact || {
                    id: "",
                    name: "",
                    role: "",
                    company: "",
                    email: "",
                    phone: "",
                    avatarColor: "bg-zinc-500",
                    lastContacted: new Date(),
                    lastInteractionSummary: "",
                    frequency: 30,
                    tags: [],
                    connections: []
                }}
                onDelete={async (id: string) => {
                    if (!confirm("Confirm network node deletion?")) return;

                    const { error } = await supabase.from('contacts').delete().eq('id', id);
                    if (error) {
                        toast.error("Failed to delete node.");
                    } else {
                        toast.success("Node disconnected.");
                        fetchContacts();
                        setSelectedContact(null);
                    }
                }}
                onSave={async (updated: Contact) => {
                    const session = await supabase.auth.getUser();
                    const userId = session.data.user?.id || '00000000-0000-0000-0000-000000000000';

                    const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                    if (isCreating) {
                        const { data, error } = await supabase
                            .from('contacts')
                            .insert({
                                name: updated.name,
                                nickname: updated.nickname,
                                role: updated.role,
                                company: updated.company,
                                email: updated.email,
                                phone: updated.phone,
                                avatar_color: updated.avatarColor,
                                last_talked: updated.lastContacted.toISOString(),
                                last_interaction_summary: updated.lastInteractionSummary || "",
                                frequency: updated.frequency,
                                tags: updated.tags,
                                custom_fields: updated.customFields || [],
                                user_id: userId
                            })
                            .select()
                            .single();

                        if (error) {
                            console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
                            toast.error("Failed to manifest node in central database.");
                            return;
                        }

                        if (data) {
                            // Save connections
                            if (updated.connections && updated.connections.length > 0) {
                                const validConns = updated.connections.filter(c => isUuid(c.contactId));
                                if (validConns.length > 0) {
                                    const { error: connError } = await supabase.from('contact_connections').insert(
                                        validConns.map(conn => {
                                            const [a, b] = [data.id, conn.contactId].sort();
                                            return {
                                                user_id: userId,
                                                contact_a: a,
                                                contact_b: b,
                                                connection_type: conn.type
                                            };
                                        })
                                    );
                                    if (connError) toast.error("Node manifest successful, but neural links failed.");
                                }
                            }
                            toast.success(`Node ${updated.name} integrated.`);
                            fetchContacts();
                        }
                        setIsCreating(false);
                    } else {
                        const { error: updateError } = await supabase.from('contacts').update({
                            name: updated.name,
                            nickname: updated.nickname,
                            role: updated.role,
                            company: updated.company,
                            email: updated.email,
                            phone: updated.phone,
                            last_talked: updated.lastContacted.toISOString(),
                            last_interaction_summary: updated.lastInteractionSummary || "",
                            frequency: updated.frequency,
                            tags: updated.tags,
                            custom_fields: updated.customFields || [],
                        }).eq('id', updated.id);

                        if (updateError) {
                            console.error("Supabase Update Error:", JSON.stringify(updateError, null, 2));
                            toast.error("Failed to sync structural metadata.");
                            return;
                        }

                        // Clear and refresh bidirectional connections
                        await supabase.from('contact_connections')
                            .delete()
                            .or(`contact_a.eq.${updated.id},contact_b.eq.${updated.id}`);

                        if (updated.connections && updated.connections.length > 0) {
                            const validConns = updated.connections.filter(c => isUuid(c.contactId) && isUuid(updated.id));
                            if (validConns.length > 0) {
                                await supabase.from('contact_connections').insert(
                                    validConns.map(conn => {
                                        const [a, b] = [updated.id, conn.contactId].sort();
                                        return {
                                            user_id: userId,
                                            contact_a: a,
                                            contact_b: b,
                                            connection_type: conn.type
                                        };
                                    })
                                );
                            } else if (updated.connections.length > 0) {
                                toast.warning("Neural links requires database-persistent nodes. Demo nodes cannot be linked.");
                            }
                        }

                        toast.success("Synaptic pathways updated.");
                        fetchContacts();
                        setSelectedContact(null);
                    }
                }}
            />
        </div>
    );
}
