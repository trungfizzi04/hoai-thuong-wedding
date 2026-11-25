"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  CalendarDays,
  LayoutDashboard,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ITEMS: Record<"admin" | "staff", NavItem[]> = {
  admin: [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
    { href: "/admin/shows", label: "Lịch Show", icon: CalendarDays },
    { href: "/admin/staff", label: "Nhân sự", icon: Users },
  ],
  staff: [
    { href: "/staff", label: "Show mở", icon: CalendarDays, exact: true },
    { href: "/staff/schedule", label: "Lịch của tôi", icon: CalendarCheck2 },
    { href: "/staff/profile", label: "Hồ sơ", icon: UserCircle2 },
  ],
};

interface ShellNavProps {
  variant: "admin" | "staff";
  placement: "sidebar" | "top" | "bottom";
}

function ShellNavView({
  variant,
  placement,
  pathname,
}: ShellNavProps & { pathname: string | null }) {
  const items = ITEMS[variant];

  const isActive = (item: NavItem) => {
    if (!pathname) return false;
    return item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  if (placement === "bottom") {
    return (
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-secondary hover:text-ink",
                )}
              >
                {active ? (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-blush-strong" />
                ) : null}
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn(
        placement === "sidebar" ? "flex flex-col gap-1" : "hidden items-center gap-1 md:flex",
      )}
    >
      {items.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sage-soft font-semibold text-ink"
                : "font-medium text-ink-secondary hover:bg-sage-soft hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ShellNavWithPathname(props: ShellNavProps) {
  const pathname = usePathname();
  return <ShellNavView {...props} pathname={pathname} />;
}

/** Wraps `usePathname()` in Suspense so dynamic routes prerender cleanly under Next.js 16 cacheComponents. */
export function ShellNav(props: ShellNavProps) {
  return (
    <Suspense fallback={<ShellNavView {...props} pathname={null} />}>
      <ShellNavWithPathname {...props} />
    </Suspense>
  );
}
