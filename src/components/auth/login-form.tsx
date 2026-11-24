"use client";

import Link from "next/link";

interface LoginFormProps {
  nextPath?: string;
  initialError?: string | null;
  deletedNotice?: boolean;
}

export function LoginForm({ nextPath, initialError, deletedNotice }: LoginFormProps) {
  const zaloHref = nextPath
    ? `/api/auth/zalo?next=${encodeURIComponent(nextPath)}`
    : "/api/auth/zalo";

  return (
    <div className="space-y-5">
      {deletedNotice ? (
        <div className="rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3.5 text-sm text-[#3E4A42]">
          Tài khoản và toàn bộ ảnh cá nhân của bạn đã được xóa / ẩn danh theo yêu cầu.
        </div>
      ) : null}

      {initialError ? (
        <div
          role="alert"
          className="rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3.5 text-sm text-[#4A4242]"
        >
          {initialError}
        </div>
      ) : null}

      <div className="space-y-3">
        <a
          href={zaloHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E8B4B8] px-5 text-sm font-bold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          Đăng nhập 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs leading-relaxed text-[#4A4242]/80">
          Xác thực trực tiếp qua tài khoản Zalo chính chủ của bạn — không cần tạo hay ghi nhớ mật
          khẩu.
        </p>
      </div>

      <div className="border-t border-[#C8D5B9]/60 pt-4 text-center">
        <Link
          href="/admin/login"
          className="text-xs font-medium text-[#4A4242]/75 underline underline-offset-4 hover:text-[#3E4A42]"
        >
          Đăng nhập dành cho Quản trị viên (Admin)
        </Link>
      </div>
    </div>
  );
}
