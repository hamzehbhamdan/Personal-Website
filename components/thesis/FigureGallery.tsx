"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryFigure {
  src: string;
  title: string;
  caption: string;
  source?: string;
  category?: string;
  wide?: boolean;
}

interface FigureGalleryProps {
  figures: GalleryFigure[];
  /** Number of thumbnail columns on desktop (default: 3) */
  columns?: 2 | 3 | 4;
  /** Show figure title below thumbnail (default: true) */
  showLabel?: boolean;
  className?: string;
}

export function FigureGallery({
  figures,
  columns = 3,
  showLabel = true,
  className,
}: FigureGalleryProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [errored, setErrored] = useState<Set<number>>(new Set());

  const isOpen = openIdx !== null;
  const active = isOpen ? figures[openIdx] : null;

  const prev = useCallback(
    () => setOpenIdx((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i !== null && i < figures.length - 1 ? i + 1 : i)),
    [figures.length]
  );
  const close = useCallback(() => setOpenIdx(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, prev, next, close]);

  const colClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <>
      {/* ── Thumbnail grid ──────────────────────────────────── */}
      <div className={cn("grid gap-3", colClass[columns], className)}>
        {figures.map((fig, i) => {
          const hasErr = errored.has(i);
          return (
            <button
              key={fig.src}
              onClick={() => setOpenIdx(i)}
              className="group relative overflow-hidden rounded-sm border border-stone-200 bg-stone-50 text-left transition-all hover:border-stone-300 hover:shadow-sm"
              aria-label={`Open ${fig.title}`}
            >
              {/* Thumbnail image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                {!hasErr ? (
                  <Image
                    src={`/figures/${fig.src}`}
                    alt={fig.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    onError={() =>
                      setErrored((prev) => {
                        const next = new Set(prev);
                        next.add(i);
                        return next;
                      })
                    }
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-stone-100 p-2">
                    <ImageOff className="h-5 w-5 text-stone-300" />
                    <span className="text-center font-mono text-[9px] leading-tight text-stone-300 break-all">
                      {fig.src}
                    </span>
                  </div>
                )}
                {/* Hover zoom hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/18">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
                </div>
                {/* Figure index badge */}
                <div className="absolute left-2 top-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-white/80">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              {showLabel && (
                <div className="px-2.5 py-2">
                  <p className="line-clamp-2 text-[11px] font-medium leading-snug text-stone-600">
                    {fig.title}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Lightbox modal ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && active && (
          <motion.div
            key="gallery-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
            onClick={close}
          >
            <motion.div
              key="gallery-panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex w-full max-w-4xl flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                className="absolute -top-9 right-0 rounded p-1 text-white/50 transition-colors hover:text-white"
                onClick={close}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image area */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-stone-900">
                {!errored.has(openIdx!) ? (
                  <Image
                    src={`/figures/${active.src}`}
                    alt={active.title}
                    fill
                    className="object-contain"
                    unoptimized
                    sizes="90vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-500">
                    <ImageOff className="h-10 w-10" />
                    <p className="font-mono text-xs">
                      Upload: /public/figures/{active.src}
                    </p>
                  </div>
                )}
              </div>

              {/* Caption + navigation */}
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90">{active.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                    {active.caption}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={prev}
                    disabled={openIdx === 0}
                    className="rounded p-1.5 text-white/50 transition-colors hover:text-white disabled:opacity-20"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[40px] text-center font-mono text-[11px] text-white/40">
                    {openIdx! + 1}/{figures.length}
                  </span>
                  <button
                    onClick={next}
                    disabled={openIdx === figures.length - 1}
                    className="rounded p-1.5 text-white/50 transition-colors hover:text-white disabled:opacity-20"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {figures.map((fig, i) => (
                  <button
                    key={fig.src}
                    onClick={() => setOpenIdx(i)}
                    className={cn(
                      "relative h-10 w-16 shrink-0 overflow-hidden rounded-sm border transition-all",
                      i === openIdx
                        ? "border-[#A51C30]/55 opacity-100"
                        : "border-white/10 opacity-40 hover:opacity-70"
                    )}
                  >
                    {!errored.has(i) ? (
                      <Image
                        src={`/figures/${fig.src}`}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="64px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-stone-800" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
