import Link from "next/link";
import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F5] text-[#3E4A42]">
      <header className="sticky top-0 z-30 border-b border-[#C8D5B9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8D5B9] text-sm font-bold text-[#3E4A42]">
              HT
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Hoài Thương Wedding</p>
              <p className="text-[11px] text-[#4A4242]">Quản trị viên (Admin)</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </Link>
            <Link
              href="/admin/staff"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
            >
              <Users className="h-4 w-4" />
              Nhân sự
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8D5B9] px-3 py-2 text-xs font-semibold text-[#4A4242] hover:bg-[#F4D6D6]/50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
