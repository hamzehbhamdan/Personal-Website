"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FigureGallery, type GalleryFigure } from "./FigureGallery";
import { cn } from "@/lib/utils";

interface FilteredFigureGalleryProps {
  figures: GalleryFigure[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FilteredFigureGallery({
  figures,
  columns = 3,
  className,
}: FilteredFigureGalleryProps) {
  // Collect unique categories in insertion order
  const categories = ["All", ...Array.from(
    new Set(figures.map((f) => f.category).filter(Boolean) as string[])
  )];

  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? figures : figures.filter((f) => f.category === active);

  return (
    <div className={className}>
      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-all",
              active === cat
                ? "border-stone-400 bg-stone-800 text-white"
                : "border-stone-200 bg-white/60 text-stone-500 hover:border-stone-300 hover:text-stone-700"
            )}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-[8px] opacity-50">
                {figures.filter((f) => f.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtered gallery */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <FigureGallery figures={filtered} columns={columns} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
