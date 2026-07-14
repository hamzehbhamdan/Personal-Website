import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[10px] border border-stone-200 bg-white", className)}>{children}</div>;
}
