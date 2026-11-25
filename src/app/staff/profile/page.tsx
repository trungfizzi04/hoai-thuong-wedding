import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
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
        <h1 className="text-xl font-extrabold text-ink">Hồ sơ cá nhân</h1>
        <p className="text-xs text-ink-secondary">
          Quản lý số đo, size áo dài và tối đa 4 ảnh cá nhân của bạn.
        </p>
      </div>
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <StaffProfileContent />
      </Suspense>
    </div>
  );
}
