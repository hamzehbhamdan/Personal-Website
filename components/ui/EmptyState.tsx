"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-8 text-center",
            className
        )}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/20">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white/80 mb-2">{title}</h3>
            <p className="text-sm text-white/40 max-w-xs mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
