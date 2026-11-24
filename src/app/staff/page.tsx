import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/dal/auth";
import { MAX_STAFF_PHOTOS } from "@/server/lib/cloudinary";

async function StaffHomeContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role === "ADMIN") redirect("/admin");
  if (!auth.profile) redirect("/onboarding");

  const { user, profile } = auth;
  const photoCount = profile.photoItems.length;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Xin chào, {profile.fullName}</CardTitle>
            <CardDescription className="mt-1">
              {profile.gender === "MALE" ? "Đội hình Nam" : "Đội hình Nữ"} · Cao{" "}
              {profile.heightCm} cm
              {profile.weightKg ? ` · Nặng ${profile.weightKg} kg` : ""} · Áo dài size{" "}
              <strong>{profile.aoDaiSize}</strong>
            </CardDescription>
          </div>
          {user.status === "ACTIVE" ? (
            <Badge variant="sage" className="shrink-0 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã xác minh
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0 gap-1">
              <Clock className="h-3.5 w-3.5" />
              Chờ Admin xác minh
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {user.status === "PENDING_APPROVAL" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
              Hồ sơ của bạn đã được lưu. Admin sẽ xác minh danh tính nhanh khi duyệt đơn nhận show
              đầu tiên của bạn.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EEF3E8] p-4">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-[#3E4A42]" />
              <div>
                <p className="text-sm font-semibold text-[#3E4A42]">
                  Album ảnh cá nhân: {photoCount}/{MAX_STAFF_PHOTOS} ảnh
                </p>
                <p className="text-xs text-[#4A4242]">
                  Cập nhật chiều cao, cân nặng, size áo dài và tối đa {MAX_STAFF_PHOTOS} ảnh cá
                  nhân.
                </p>
              </div>
            </div>
            <Link
              href="/staff/profile"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#E8B4B8] px-4 text-xs font-semibold text-[#3E4A42] transition-colors hover:bg-[#F4D6D6]"
            >
              Mở tab Hồ sơ →
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-[#EEF3E8]/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3E4A42]" />
            <CardTitle className="text-base">Bảng tin Show đang mở tuyển (Phase 2)</CardTitle>
          </div>
          <CardDescription>
            Tính năng xem danh sách show đang tuyển, lọc theo giới tính và bấm đăng ký 1 chạm sẽ
            sẵn sàng ngay ở Phase 2 tiếp theo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function StaffHomePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
          Đang tải bảng điều khiển nhân sự...
        </div>
      }
    >
      <StaffHomeContent />
    </Suspense>
  );
}
