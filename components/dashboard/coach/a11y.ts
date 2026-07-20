// components/dashboard/coach/a11y.ts
//
// Shared focus-visible treatment for the coach view's inline edit affordances
// (task/subtask labels, goal titles, goal chips, search rows, kanban cards).
// Mirrors the ui-kit convention (components/ui/button.tsx: outline-none +
// focus-visible ring) but uses the coach crimson accent (#A51C30) instead of
// --ring, matching the hover treatment these affordances already have.
//
// `focusRing` — default: ring drawn outside the element. Pair with a rounded-*
// class on the element so the ring follows its corners.
// `focusRingInset` — for full-bleed rows inside `overflow-hidden` containers
// (SearchOverlay results), where an outside ring would be clipped.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A51C30]/45";

export const focusRingInset =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#A51C30]/45";
