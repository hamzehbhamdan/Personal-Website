"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThesisSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
  wide?: boolean;
}

export function ThesisSection({
  id,
  children,
  className,
  label,
  wide = false,
}: ThesisSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative z-10 mx-auto px-6 py-20",
        wide ? "max-w-5xl" : "max-w-3xl",
        className
      )}
    >
      {label && (
        <div className="mb-10 flex items-center gap-4">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">
            {label}
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
      )}
      {children}
    </motion.section>
  );
}

// Reusable animated reveal for individual elements
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
