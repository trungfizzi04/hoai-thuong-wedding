"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "htw-theme";

/** Pure-CSS icon swap (no state) → zero hydration mismatch, zero flash. */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {
      // Zalo WebView may block storage; theme still applies for this session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện Sáng / Tối"
      title="Đổi giao diện Sáng / Tối"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-sage-soft",
        className,
      )}
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
