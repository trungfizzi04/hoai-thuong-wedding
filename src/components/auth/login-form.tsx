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
        <div className="rounded-xl border border-line-strong bg-sage-soft p-3.5 text-sm text-ink">
          Tài khoản và toàn bộ ảnh cá nhân của bạn đã được xóa / ẩn danh theo yêu cầu.
        </div>
      ) : null}

      {initialError ? (
        <div
          role="alert"
          className="rounded-xl border border-blush-strong bg-blush/60 p-3.5 text-sm text-ink-secondary"
        >
          {initialError}
        </div>
      ) : null}

      <div className="space-y-3">
        <a
          href={zaloHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blush-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-blush"
        >
          Đăng nhập 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs leading-relaxed text-ink-secondary/80">
          Xác thực trực tiếp qua tài khoản Zalo chính chủ của bạn — không cần tạo hay ghi nhớ mật
          khẩu.
        </p>
      </div>

      <div className="border-t border-line/60 pt-4 text-center">
        <Link
          href="/admin/login"
          className="text-xs font-medium text-ink-secondary/75 underline underline-offset-4 hover:text-ink"
        >
          Đăng nhập dành cho Quản trị viên (Admin)
        </Link>
      </div>
    </div>
  );
}
