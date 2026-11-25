import { cn } from "@/lib/utils";

/**
 * Brand monogram. To use a real logo later: drop `public/images/logo.png`
 * and swap the inner <span> for <Image src="/images/logo.png" ... />.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-sage-soft font-serif text-lg font-semibold text-ink",
        className,
      )}
    >
      HT
    </span>
  );
}
