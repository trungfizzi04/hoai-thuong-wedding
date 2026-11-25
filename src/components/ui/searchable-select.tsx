"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/** Vietnamese-friendly normalization: "Gò Vấp" matches "go vap". */
export function normalizeVi(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Gõ để tìm (không cần dấu)...",
  disabled,
  loading,
  className,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = normalizeVi(query);
    return q ? options.filter((o) => normalizeVi(o.label).includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 text-left text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn("truncate", !selected && "text-ink-secondary/60")}>
          {loading ? "Đang tải..." : (selected?.label ?? placeholder)}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-secondary" />
      </button>

      {open ? (
        <div className="absolute z-40 mt-1.5 w-full animate-modal-in rounded-xl border border-line bg-surface p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[0]) pick(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-line bg-paper pr-3 pl-9 text-sm text-ink placeholder:text-ink-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-ink-secondary">Không có kết quả phù hợp.</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value} role="option" aria-selected={o.value === value}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-sage-soft",
                      o.value === value && "bg-sage-soft font-semibold",
                    )}
                  >
                    {o.label}
                    {o.value === value ? <Check className="h-4 w-4" /> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
