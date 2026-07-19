"use client";
import { useEffect, useId, useRef } from "react";
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

// Module-level LIFO stack of open modals. Only the topmost handles Escape.
let modalStack: symbol[] = [];

export function Modal({ title, onClose, children, describedById, size, confirmClose }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  describedById?: string;
  // Additive, backward-compatible width knob (Task 18). Omitted ⇒ "default"
  // (620px, unchanged) so all existing People callers are unaffected. "wide"
  // (760px) mirrors the artifact's `.modal-card.wide` for dialogs that need
  // more room (e.g. PickGoalModal's goal list).
  size?: "default" | "wide";
  /** Return false to block closing (backdrop, Escape, and ×). Use for dirty-state checks. */
  confirmClose?: () => boolean;
}) {
  const titleId = useId();
  // Keep the latest onClose in a ref so the mount-only effect never needs it as a dependency.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const confirmRef = useRef(confirmClose);
  useEffect(() => { confirmRef.current = confirmClose; }, [confirmClose]);

  const requestClose = () => {
    if (confirmRef.current && !confirmRef.current()) return;
    onCloseRef.current();
  };

  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const id = Symbol();
    modalStack.push(id);
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalStack[modalStack.length - 1] !== id) return; // not topmost → ignore
      if (confirmRef.current && !confirmRef.current()) return;
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
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        // A click's target is the common ancestor of mousedown+mouseup targets,
        // so a text-selection drag that starts in the dialog and ends on the
        // backdrop fires a backdrop click. Require the press to have STARTED here.
        const wasDown = downOnBackdrop.current;
        downOnBackdrop.current = false;
        if (e.target === e.currentTarget && wasDown) requestClose();
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        className={`w-full ${size === "wide" ? "max-w-[760px]" : "max-w-[620px]"} max-h-[88vh] flex flex-col rounded-[14px] border border-stone-200 bg-white`}
      >
        <div className="flex items-center justify-between gap-3 px-[18px] py-[15px] border-b border-stone-200">
          <span id={titleId} className="text-[17px] font-medium text-stone-900" style={serif}>{title}</span>
          <button onClick={requestClose} aria-label="Close" className="text-stone-400 hover:text-[#A51C30] text-2xl leading-none">×</button>
        </div>
        <div className="overflow-auto p-[18px]">{children}</div>
      </div>
    </div>
  );
}
