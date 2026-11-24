import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/staff/profile-editor";
import { getCurrentUser } from "@/server/dal/auth";

async function StaffProfileContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (!auth.profile) redirect("/onboarding");

  return (
    <ProfileEditor
      userId={auth.user.id}
      userRole={auth.user.role}
      userStatus={auth.user.status}
      zaloName={auth.user.zaloName}
      zaloAvatarUrl={auth.user.zaloAvatarUrl}
      initialProfile={{
        fullName: auth.profile.fullName,
        contactPhone: auth.profile.contactPhone,
        gender: auth.profile.gender,
        heightCm: auth.profile.heightCm,
        weightKg: auth.profile.weightKg,
        aoDaiSize: auth.profile.aoDaiSize,
        photoCount: auth.profile.photoItems.length,
      }}
    />
  );
}

export default function StaffProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-[#3E4A42]">Hồ sơ cá nhân</h1>
        <p className="text-xs text-[#4A4242]">
          Quản lý số đo, size áo dài và tối đa 4 ảnh cá nhân của bạn.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
            Đang tải hồ sơ cá nhân...
          </div>
        }
      >
        <StaffProfileContent />
      </Suspense>
    </div>
  );
}
