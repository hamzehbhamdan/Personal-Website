"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "card" | "avatar" | "button";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
    const variants = {
        text: "h-4 w-full rounded",
        card: "h-32 w-full rounded-xl",
        avatar: "h-10 w-10 rounded-full",
        button: "h-10 w-24 rounded-lg",
    };

    return (
        <div
            className={cn(
                "animate-pulse bg-white/5",
                variants[variant],
                className
            )}
        />
    );
}

// Pre-built skeleton patterns
export function TaskCardSkeleton() {
    return (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-3" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
            </div>
        </div>
    );
}

export function ContactCardSkeleton() {
    return (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center gap-4">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

export function KanbanColumnSkeleton() {
    return (
        <div className="w-[320px] min-w-[320px] space-y-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-8 rounded-lg" />
            </div>
            <div className="space-y-3 p-3">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
            </div>
        </div>
    );
}
