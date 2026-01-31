"use client";

import { X, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
    const shortcuts = [
        {
            category: "Navigation", items: [
                { keys: ["⌘", "K"], description: "Open Command Palette" },
                { keys: ["1"], description: "Switch to Momentum View" },
                { keys: ["2"], description: "Switch to Tasks View" },
                { keys: ["3"], description: "Switch to People View" },
                { keys: ["4"], description: "Switch to Brain View" },
            ]
        },
        {
            category: "Actions", items: [
                { keys: ["N"], description: "Create New Task" },
                { keys: [","], description: "Open Settings" },
                { keys: ["?"], description: "Show Keyboard Shortcuts" },
                { keys: ["Esc"], description: "Close Modal / Deselect" },
            ]
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] max-w-[90vw] glass border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Command size={20} className="text-white/60" />
                                    </div>
                                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {shortcuts.map((section) => (
                                    <div key={section.category}>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
                                            {section.category}
                                        </h3>
                                        <div className="space-y-2">
                                            {section.items.map((shortcut, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                                                >
                                                    <span className="text-sm text-white/70">{shortcut.description}</span>
                                                    <div className="flex items-center gap-1">
                                                        {shortcut.keys.map((key, j) => (
                                                            <kbd
                                                                key={j}
                                                                className="px-2 py-1 text-[11px] font-mono font-bold bg-white/10 border border-white/10 rounded-md text-white/70"
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
