"use client";

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
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-sage-soft p-4 text-sm text-ink">
        <p className="font-semibold">Xin chào {invitedName}!</p>
        {invitedPhone ? (
          <p className="mt-1 text-xs text-ink-secondary">
            Số điện thoại đã được Admin xác nhận: <strong>{invitedPhone}</strong>
          </p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <a
          href={`/api/auth/zalo?invite=${encodeURIComponent(token)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blush-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-blush"
        >
          Kích hoạt 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs leading-relaxed text-ink-secondary/80">
          Liên kết trực tiếp với tài khoản Zalo của bạn và kích hoạt trạng thái chính thức ngay
          lập tức — không cần đặt mật khẩu.
        </p>
      </div>
    </div>
  );
}
