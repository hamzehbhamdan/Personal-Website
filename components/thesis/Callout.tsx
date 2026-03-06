import { cn } from "@/lib/utils";

interface CalloutProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "subtle";
  className?: string;
}

export function Callout({ children, variant = "default", className }: CalloutProps) {
  return (
    <blockquote
      className={cn(
        "my-8 border-l-2 pl-6 text-lg leading-relaxed",
        variant === "default" && "border-stone-300 text-stone-600 italic",
        variant === "accent" && "border-[#A51C30]/80 text-stone-700 italic",
        variant === "subtle" && "border-stone-200 text-stone-500",
        className
      )}
    >
      {children}
    </blockquote>
  );
}

interface KeyTakeawaysProps {
  items: string[];
  className?: string;
}

export function KeyTakeaways({ items, className }: KeyTakeawaysProps) {
  return (
    <div className={cn("rounded-sm border border-stone-200 bg-stone-50 p-6", className)}>
      <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
        Key Takeaways
      </h4>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-stone-700 leading-relaxed">
            <span className="mt-[2px] shrink-0 font-mono text-[10px] text-[#A51C30]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400",
        className
      )}
    >
      {children}
    </span>
  );
}
