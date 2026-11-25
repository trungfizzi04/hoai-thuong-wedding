import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Quick-pick chip (toggle / single choice). */
export function Chip({ active, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-surface text-ink hover:bg-sage-soft",
        className,
      )}
      {...props}
    />
  );
}
