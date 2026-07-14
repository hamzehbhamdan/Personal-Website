"use client";
import { useEffect } from "react";
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-[rgba(40,35,22,0.45)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[620px] max-h-[88vh] flex flex-col rounded-[14px] border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-[18px] py-[15px] border-b border-stone-200">
          <span className="text-[17px] font-medium text-stone-900" style={serif}>{title}</span>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-[#A51C30] text-2xl leading-none">×</button>
        </div>
        <div className="overflow-auto p-[18px]">{children}</div>
      </div>
    </div>
  );
}
