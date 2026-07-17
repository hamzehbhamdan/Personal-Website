"use client";
import { useEffect, useId, useRef } from "react";
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

// Module-level LIFO stack of open modals. Only the topmost handles Escape.
let modalStack: symbol[] = [];

export function Modal({ title, onClose, children, describedById }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  describedById?: string;
}) {
  const titleId = useId();
  // Keep the latest onClose in a ref so the mount-only effect never needs it as a dependency.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const id = Symbol();
    modalStack.push(id);
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalStack[modalStack.length - 1] !== id) return; // not topmost → ignore
      onCloseRef.current();
    };
    document.addEventListener("keydown", h);
    return () => {
      document.removeEventListener("keydown", h);
      modalStack = modalStack.filter((x) => x !== id);
    };
  }, []); // mount/unmount only — stack order is stable regardless of onClose identity
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-[rgba(40,35,22,0.45)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        className="w-full max-w-[620px] max-h-[88vh] flex flex-col rounded-[14px] border border-stone-200 bg-white"
      >
        <div className="flex items-center justify-between gap-3 px-[18px] py-[15px] border-b border-stone-200">
          <span id={titleId} className="text-[17px] font-medium text-stone-900" style={serif}>{title}</span>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-[#A51C30] text-2xl leading-none">×</button>
        </div>
        <div className="overflow-auto p-[18px]">{children}</div>
      </div>
    </div>
  );
}
