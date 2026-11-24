import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#C8D5B9] bg-white px-3.5 py-2 text-sm text-[#3E4A42] placeholder:text-[#4A4242]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7C9B5] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
