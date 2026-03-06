"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

interface TeXProps {
  /** LaTeX source string */
  children: string;
  /** true = display (block) mode, false = inline */
  display?: boolean;
  className?: string;
}

export function TeX({ children, display = false, className = "" }: TeXProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          "\\E": "\\mathbb{E}",
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Sig": "\\boldsymbol{\\Sigma}",
          "\\sigM": "\\boldsymbol{\\sigma}_M",
        },
      });
    } catch {
      return `<span style="color:#A51C30">${children}</span>`;
    }
  }, [children, display]);

  return (
    <span
      className={className}
      // KaTeX output is safe — it never runs scripts
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Convenience wrapper for display (block) math */
export function BlockTeX({ children, className = "" }: Omit<TeXProps, "display">) {
  return (
    <TeX display className={`block overflow-x-auto ${className}`}>
      {children}
    </TeX>
  );
}
