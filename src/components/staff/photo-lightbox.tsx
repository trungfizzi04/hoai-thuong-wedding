"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoLightboxProps {
  count: number;
  index: number;
  srcFor: (index: number) => string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Fullscreen photo viewer: arrow keys, Esc, on-screen arrows and horizontal swipe. */
export function PhotoLightbox({ count, index, srcFor, onIndexChange, onClose }: PhotoLightboxProps) {
  const touchStartX = React.useRef<number | null>(null);

  const go = React.useCallback(
    (delta: number) => {
      if (count <= 1) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink"
      >
        <X className="h-5 w-5" />
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Ảnh trước"
            className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Ảnh sau"
            className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-ink"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcFor(index)}
        alt={`Ảnh ${index + 1}/${count}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-xl object-contain"
      />
      <p className="absolute bottom-5 rounded-full bg-black/60 px-3 py-1 text-xs text-white tabular-nums">
        {index + 1} / {count}
      </p>
    </div>
  );
}
