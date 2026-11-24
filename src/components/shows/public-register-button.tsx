"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerForShowAction } from "@/server/actions/registrations";

interface PublicRegisterButtonProps {
  showId: string;
  showStatus: string;
  isLoggedIn: boolean;
  isStaff: boolean;
  hasProfile: boolean;
  staffGender: "MALE" | "FEMALE" | null;
  requiredMale: number;
  requiredFemale: number;
  existingStatus: string | null;
}

export function PublicRegisterButton({
  showId,
  showStatus,
  isLoggedIn,
  isStaff,
  hasProfile,
  staffGender,
  requiredMale,
  requiredFemale,
  existingStatus,
}: PublicRegisterButtonProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (showStatus !== "OPEN") {
    return (
      <div className="rounded-xl border border-[#C8D5B9] bg-[#FAF9F5] p-4 text-center text-sm font-medium text-[#4A4242]">
        Show này hiện đã đủ người hoặc đã đóng tuyển.
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link
          href={`/login?next=${encodeURIComponent(`/shows/${showId}`)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#E8B4B8] px-6 text-sm font-bold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          Đăng nhập Zalo để đăng ký 1 chạm →
        </Link>
        <p className="text-center text-xs text-[#4A4242]/80">
          Sau khi bấm Cho phép trên Zalo sẽ quay lại đúng show này.
        </p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="rounded-xl bg-[#EEF3E8] p-3.5 text-center text-xs text-[#3E4A42]">
        Bạn đang đăng nhập bằng tài khoản Quản trị viên.{" "}
        <Link href={`/admin/shows/${showId}/edit`} className="font-bold underline">
          Chỉnh sửa show này
        </Link>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <Link
        href="/onboarding"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#E8B4B8] px-6 text-sm font-bold text-[#3E4A42] shadow-sm hover:bg-[#F4D6D6]"
      >
        Hoàn tất hồ sơ 1 lần để đăng ký show →
      </Link>
    );
  }

  if (existingStatus === "PENDING" || existingStatus === "APPROVED" || existingStatus === "WAITLIST") {
    return (
      <div className="space-y-2 rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-4 text-center text-sm text-[#3E4A42]">
        <p className="inline-flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="h-4 w-4" />
          Bạn đã đăng ký show này (
          {existingStatus === "APPROVED"
            ? "Đã được duyệt"
            : existingStatus === "WAITLIST"
              ? "Danh sách dự bị"
              : "Đang chờ Admin duyệt"}
          )
        </p>
        <div>
          <Link href="/staff/schedule" className="text-xs font-semibold underline">
            Xem trong Lịch của tôi →
          </Link>
        </div>
      </div>
    );
  }

  const genderMismatch =
    (staffGender === "MALE" && requiredMale <= 0) ||
    (staffGender === "FEMALE" && requiredFemale <= 0);

  if (genderMismatch) {
    return (
      <div className="rounded-xl border border-[#C8D5B9] bg-[#FAF9F5] p-4 text-center text-sm text-[#4A4242]">
        Show này hiện chỉ tuyển đội hình {requiredMale > 0 ? "Nam" : "Nữ"} (không khớp giới tính hồ
        sơ của bạn).
      </div>
    );
  }

  function handleRegister() {
    setNotice(null);
    startTransition(async () => {
      const res = await registerForShowAction(showId);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Đăng ký thất bại." });
        return;
      }
      setNotice({ type: "ok", text: res.message || "Đăng ký thành công!" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {notice ? (
        <div
          className={
            notice.type === "ok"
              ? "rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3 text-xs text-[#3E4A42]"
              : "rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3 text-xs text-[#4A4242]"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={handleRegister}>
        {isPending ? "Đang gửi đăng ký..." : "Đăng ký nhận show ngay (1 chạm)"}
      </Button>
    </div>
  );
}
