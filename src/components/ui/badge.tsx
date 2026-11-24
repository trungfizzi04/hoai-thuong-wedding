import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        sage: "border-[#B7C9B5] bg-[#EEF3E8] text-[#3E4A42]",
        blush: "border-[#E8B4B8] bg-[#F4D6D6]/70 text-[#4A4242]",
        neutral: "border-[#C8D5B9]/70 bg-[#FAF9F5] text-[#4A4242]",
        warning: "border-amber-300 bg-amber-50 text-amber-900",
        danger: "border-rose-300 bg-rose-50 text-rose-800",
      },
    },
    defaultVariants: {
      variant: "sage",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
