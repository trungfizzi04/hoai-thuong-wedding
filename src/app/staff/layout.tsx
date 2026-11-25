import Link from "next/link";
import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ShellNav } from "@/components/nav/shell-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/server/actions/auth";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/staff" className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9 text-base" />
            <div>
              <p className="font-serif text-xl font-semibold leading-none">Hoài Thương</p>
              <p className="mt-1 hidden text-[11px] uppercase tracking-widest text-ink-secondary sm:block">
                Cổng nhân sự bưng quả
              </p>
            </div>
          </Link>

          <ShellNav variant="staff" placement="top" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Đăng xuất"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line px-3 text-xs font-medium text-ink-secondary transition-colors hover:bg-blush/50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
        {children}
      </main>

      <ShellNav variant="staff" placement="bottom" />
    </div>
  );
}
