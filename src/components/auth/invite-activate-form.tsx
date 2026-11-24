"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateInviteWithPasswordAction } from "@/server/actions/auth";

interface InviteActivateFormProps {
  token: string;
  invitedName: string;
  invitedPhone: string | null;
}

export function InviteActivateForm({
  token,
  invitedName,
  invitedPhone,
}: InviteActivateFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await activateInviteWithPasswordAction({
        token,
        password,
        confirmPassword,
      });
      if (!result.ok) {
        setError(result.error || "Không thể kích hoạt tài khoản.");
        return;
      }
      router.push(result.redirectTo || "/onboarding");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#EEF3E8] p-4 text-sm text-[#3E4A42]">
        <p className="font-semibold">Xin chào {invitedName}!</p>
        {invitedPhone ? (
          <p className="mt-1 text-xs text-[#4A4242]">
            Số điện thoại đã được Admin xác nhận: <strong>{invitedPhone}</strong>
          </p>
        ) : null}
      </div>

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
          href={`/api/auth/zalo?invite=${encodeURIComponent(token)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#E8B4B8] px-5 text-sm font-bold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          Kích hoạt 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs text-[#4A4242]/80">
          Tự động xác minh tài khoản (ACTIVE) ngay lập tức.
        </p>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#C8D5B9]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#4A4242]/80">Hoặc đặt mật khẩu / mã PIN riêng</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Mật khẩu / Mã PIN mới (tối thiểu 6 ký tự)</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ví dụ: 6 chữ số dễ nhớ hoặc mật khẩu"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Nhập lại mật khẩu</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại giống bên trên"
            minLength={6}
            required
          />
        </div>

        <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
          {isPending ? "Đang kích hoạt..." : "Kích hoạt bằng Mật khẩu"}
        </Button>
      </form>
    </div>
  );
}
