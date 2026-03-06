"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THESIS_CHAPTERS } from "@/lib/thesis-content";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ChapterNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 640);

      // Determine active section
      const sections = THESIS_CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean);
      let current = "";
      for (const section of sections) {
        if (section && window.scrollY >= section.offsetTop - 120) {
          current = section.id;
        }
      }
      setActive(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.3 }}
          className="fixed right-6 top-24 z-50 hidden flex-col gap-[6px] text-right xl:flex"
          aria-label="Chapter navigation"
        >
          <span className="mb-1 text-[9px] uppercase tracking-[0.25em] text-stone-400">
            Chapters
          </span>
          {THESIS_CHAPTERS.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => scrollToSection(chapter.id)}
              className={`text-right text-[11px] leading-relaxed transition-all duration-200 ${
                active === chapter.id
                  ? "font-medium text-[#A51C30]"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              {chapter.label}
            </button>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

// Inline chapter nav row shown beneath the hero
export function ChapterNavRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {THESIS_CHAPTERS.map((chapter, i) => (
        <button
          key={chapter.id}
          onClick={() => scrollToSection(chapter.id)}
          className="group flex items-center gap-2 text-xs text-stone-500 transition-colors hover:text-[#A51C30]"
        >
          <span className="text-[10px] text-stone-300 font-mono">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="border-b border-transparent group-hover:border-[#A51C30]/55 transition-all">
            {chapter.label}
          </span>
        </button>
      ))}
    </div>
  );
}
