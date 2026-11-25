import Link from "next/link";
import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ShellNav } from "@/components/nav/shell-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/server/actions/auth";

function LogoutButton({ withLabel }: { withLabel?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Đăng xuất"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line px-3 text-xs font-medium text-ink-secondary transition-colors hover:bg-blush/50"
      >
        <LogOut className="h-4 w-4" />
        {withLabel ? "Đăng xuất" : null}
      </button>
    </form>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-line md:bg-surface md:px-4 md:py-6">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-1">
          <BrandMark />
          <div>
            <p className="font-serif text-xl font-semibold leading-none">Hoài Thương</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-ink-secondary">Admin</p>
          </div>
        </Link>
        <ShellNav variant="admin" placement="sidebar" />
        <div className="mt-auto flex items-center gap-2 px-1">
          <ThemeToggle />
          <LogoutButton withLabel />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9 text-base" />
            <span className="font-serif text-xl font-semibold">Hoài Thương</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      <ShellNav variant="admin" placement="bottom" />
    </div>
  );
}
