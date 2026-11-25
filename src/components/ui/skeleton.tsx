import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-sage-soft", className)} />;
}

export function ShowCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => (
        <ShowCardSkeleton key={i} />
      ))}
    </div>
  );
}
