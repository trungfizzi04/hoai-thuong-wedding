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
      <div className="rounded-xl bg-[#EEF3E8] p-4 text-sm text-[#3E4A42]">
        <p className="font-semibold">Xin chào {invitedName}!</p>
        {invitedPhone ? (
          <p className="mt-1 text-xs text-[#4A4242]">
            Số điện thoại đã được Admin xác nhận: <strong>{invitedPhone}</strong>
          </p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <a
          href={`/api/auth/zalo?invite=${encodeURIComponent(token)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#E8B4B8] px-5 text-sm font-bold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          Kích hoạt 1 chạm bằng Zalo
        </a>
        <p className="text-center text-xs leading-relaxed text-[#4A4242]/80">
          Liên kết trực tiếp với tài khoản Zalo của bạn và kích hoạt trạng thái chính thức ngay
          lập tức — không cần đặt mật khẩu.
        </p>
      </div>
    </div>
  );
}
