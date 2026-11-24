import Link from "next/link";
import { Home, LogOut, UserCircle2 } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5] pb-20 text-[#3E4A42] sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#C8D5B9] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3.5">
          <Link href="/staff" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8D5B9] text-sm font-bold text-[#3E4A42]">
              HT
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Hoài Thương Wedding</p>
              <p className="text-[11px] text-[#4A4242]">Cổng Nhân Sự Bưng Quả</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
            <Link
              href="/staff/profile"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
            >
              <UserCircle2 className="h-4 w-4" />
              Hồ sơ cá nhân
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8D5B9] px-3 py-2 text-xs font-semibold text-[#4A4242] transition-colors hover:bg-[#F4D6D6]/50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </form>
          </nav>

          <form action={logoutAction} className="sm:hidden">
            <button
              type="submit"
              aria-label="Đăng xuất"
              className="inline-flex items-center gap-1 rounded-xl border border-[#C8D5B9] px-2.5 py-1.5 text-xs font-medium text-[#4A4242]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Thoát
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>

      {/* Mobile-First Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#C8D5B9] bg-white sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2">
          <Link
            href="/staff"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
          >
            <Home className="h-5 w-5" />
            Trang chủ
          </Link>
          <Link
            href="/staff/profile"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
          >
            <UserCircle2 className="h-5 w-5" />
            Hồ sơ
          </Link>
        </div>
      </nav>
    </div>
  );
}
