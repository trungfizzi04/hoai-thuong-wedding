"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPasswordAction } from "@/server/actions/auth";

interface LoginFormProps {
  nextPath?: string;
  initialError?: string | null;
  deletedNotice?: boolean;
}

export function LoginForm({ nextPath, initialError, deletedNotice }: LoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const zaloHref = nextPath
    ? `/api/auth/zalo?next=${encodeURIComponent(nextPath)}`
    : "/api/auth/zalo";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginWithPasswordAction({ phone, password, nextPath });
      if (!result.ok) {
        setError(result.error || "Đăng nhập thất bại.");
        return;
      }
      router.push(result.redirectTo || "/staff");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {deletedNotice ? (
        <div className="rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3.5 text-sm text-[#3E4A42]">
          Tài khoản và toàn bộ ảnh cá nhân của bạn đã được xóa / ẩn danh theo yêu cầu.
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3.5 text-sm text-[#4A4242]"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <a
          href={zaloHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E8B4B8] px-5 text-sm font-bold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          Đăng nhập 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs text-[#4A4242]/80">
          Khuyên dùng cho nhân sự bưng quả — không cần nhớ mật khẩu.
        </p>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#C8D5B9]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#4A4242]/80">Hoặc đăng nhập bằng SĐT &amp; Mật khẩu</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Số điện thoại</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#4A4242]/60" />
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu / Mã PIN</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#4A4242]/60" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
          {isPending ? "Đang đăng nhập..." : "Đăng nhập bằng SĐT"}
        </Button>
      </form>
    </div>
  );
}
