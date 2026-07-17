import { cn } from "@/lib/utils";

/**
 * The one centered content column for every dashboard surface (incl. loading /
 * empty states). Keeps the exact padding the views used before (`p-7 md:p-8`)
 * and adds centering + a width cap:
 *   - "reading" (default): People / Coach / Brain — roomier single column (~960px).
 *   - "wide": Home — the widget grid fills ~1152px.
 * Centering is relative to <main> (viewport minus the 158px rail). Below the cap
 * width (phones / small tablets) max-w-* is inert and mx-auto is a no-op, so the
 * mobile layout is unchanged.
 */
export function PageContainer({
  width = "reading",
  className,
  children,
}: {
  width?: "reading" | "wide";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full p-7 md:p-8",
        width === "wide" ? "max-w-wide" : "max-w-reading",
        className,
      )}
    >
      {children}
    </div>
  );
}
