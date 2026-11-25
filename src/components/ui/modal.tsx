"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md animate-modal-in rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl",
          className,
        )}
      >
        <h2 className="font-serif text-2xl font-semibold leading-tight">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When set, shows a text field (replaces window.prompt). */
  inputLabel?: string;
  inputPlaceholder?: string;
}

export interface ConfirmResult {
  confirmed: boolean;
  input: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const [input, setInput] = React.useState("");
  const resolver = React.useRef<((r: ConfirmResult) => void) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    setInput("");
    setOptions(opts);
    return new Promise<ConfirmResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = React.useCallback(
    (confirmed: boolean) => {
      resolver.current?.({ confirmed, input: input.trim() });
      resolver.current = null;
      setOptions(null);
    },
    [input],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => finish(false)}
        title={options?.title ?? ""}
        description={options?.description}
        footer={
          <>
            <Button variant="outline" onClick={() => finish(false)}>
              {options?.cancelLabel ?? "Hủy"}
            </Button>
            <Button
              variant={options?.destructive ? "destructive" : "primary"}
              onClick={() => finish(true)}
            >
              {options?.confirmLabel ?? "Xác nhận"}
            </Button>
          </>
        }
      >
        {options?.inputLabel ? (
          <label className="block space-y-1.5 text-sm font-medium">
            {options.inputLabel}
            <textarea
              autoFocus
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={options.inputPlaceholder}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink placeholder:text-ink-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong"
            />
          </label>
        ) : null}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
