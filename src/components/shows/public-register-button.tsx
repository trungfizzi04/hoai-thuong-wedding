"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  if (showStatus !== "OPEN") {
    return (
      <div className="rounded-xl border border-line bg-paper p-4 text-center text-sm font-medium text-ink-secondary">
        Show này hiện đã đủ người hoặc đã đóng tuyển.
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link
          href={`/login?next=${encodeURIComponent(`/shows/${showId}`)}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blush-strong px-6 text-sm font-semibold text-ink transition-colors hover:bg-blush"
        >
          Đăng nhập Zalo để đăng ký 1 chạm →
        </Link>
        <p className="text-center text-xs text-ink-secondary/80">
          Sau khi bấm Cho phép trên Zalo sẽ quay lại đúng show này.
        </p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="rounded-xl bg-sage-soft p-3.5 text-center text-xs text-ink">
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
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blush-strong px-6 text-sm font-semibold text-ink hover:bg-blush"
      >
        Hoàn tất hồ sơ 1 lần để đăng ký show →
      </Link>
    );
  }

  if (existingStatus === "PENDING" || existingStatus === "APPROVED" || existingStatus === "WAITLIST") {
    return (
      <div className="space-y-2 rounded-xl border border-line-strong bg-sage-soft p-4 text-center text-sm text-ink">
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
      <div className="rounded-xl border border-line bg-paper p-4 text-center text-sm text-ink-secondary">
        Show này hiện chỉ tuyển đội hình {requiredMale > 0 ? "Nam" : "Nữ"} (không khớp giới tính hồ
        sơ của bạn).
      </div>
    );
  }

  function handleRegister() {
    startTransition(async () => {
      const res = await registerForShowAction(showId);
      if (!res.ok) {
        toast.error(res.error || "Đăng ký thất bại.");
        return;
      }
      toast.success(res.message || "Đăng ký thành công!");
      router.refresh();
    });
  }

  return (
    <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={handleRegister}>
      {isPending ? "Đang gửi đăng ký..." : "Đăng ký nhận show ngay (1 chạm)"}
    </Button>
  );
}
