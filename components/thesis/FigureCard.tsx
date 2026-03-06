"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FigureCardProps {
  src: string;
  title: string;
  caption: string;
  source?: string;
  wide?: boolean;
  className?: string;
}

export function FigureCard({
  src,
  title,
  caption,
  source,
  wide = false,
  className,
}: FigureCardProps) {
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const imgSrc = `/figures/${src}`;

  return (
    <>
      <figure className={cn("group", wide && "col-span-full", className)}>
        <div
          className="relative cursor-zoom-in overflow-hidden rounded-sm border border-stone-200 bg-stone-50 transition-colors hover:border-stone-300"
          onClick={() => !hasError && setIsOpen(true)}
          role={hasError ? undefined : "button"}
          tabIndex={hasError ? undefined : 0}
          onKeyDown={(e) => e.key === "Enter" && !hasError && setIsOpen(true)}
          aria-label={hasError ? undefined : `Expand ${title}`}
        >
          <div className="relative aspect-[16/9]">
            {!hasError ? (
              <>
                <Image
                  src={imgSrc}
                  alt={title}
                  fill
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.015]"
                  onError={() => setHasError(true)}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                    <ZoomIn className="h-3 w-3" />
                    Expand
                  </div>
                </div>
              </>
            ) : (
              // Placeholder for missing figures
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-100">
                <ImageOff className="h-8 w-8 text-stone-300" />
                <div className="text-center">
                  <p className="text-xs font-medium text-stone-400">Upload figure here</p>
                  <p className="mt-1 font-mono text-[10px] text-stone-300">{src}</p>
                </div>
                <div className="rounded border border-stone-200 bg-white px-3 py-1 font-mono text-[10px] text-stone-400">
                  /public/figures/{src}
                </div>
              </div>
            )}
          </div>
        </div>

        <figcaption className="mt-3 space-y-1">
          <p className="text-sm font-semibold text-stone-700">{title}</p>
          <p className="text-xs leading-relaxed text-stone-500">{caption}</p>
          {source && (
            <p className="font-mono text-[10px] text-stone-400">{source}</p>
          )}
        </figcaption>
      </figure>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && !hasError && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              key="modal-content"
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-10 right-0 rounded-sm p-1 text-white/60 transition-colors hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-stone-900">
                <Image
                  src={imgSrc}
                  alt={title}
                  fill
                  className="object-contain"
                  unoptimized
                  sizes="90vw"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-white/90">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{caption}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Two-column figure grid
interface FigureGridProps {
  figures: FigureCardProps[];
}

export function FigureGrid({ figures }: FigureGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {figures.map((fig) => (
        <FigureCard key={fig.src} {...fig} />
      ))}
    </div>
  );
}
