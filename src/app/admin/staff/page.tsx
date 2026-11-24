import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { StaffManager, type AdminStaffListItem } from "@/components/admin/staff-manager";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { staffProfiles, users } from "@/server/db/schema";

async function AdminStaffContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/admin/login?next=/admin/staff");
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }

  const db = getDb();
  const rows = await db
    .select({
      user: users,
      profile: staffProfiles,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(eq(users.role, "STAFF"))
    .orderBy(desc(users.createdAt));

  const staffList: AdminStaffListItem[] = rows.map(({ user, profile }) => ({
    id: user.id,
    loginPhone: user.loginPhone,
    zaloName: user.zaloName,
    zaloAvatarUrl: user.zaloAvatarUrl,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    profile: profile
      ? {
          fullName: profile.fullName,
          contactPhone: profile.contactPhone,
          gender: profile.gender,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          aoDaiSize: profile.aoDaiSize,
          photoCount: profile.photoItems.length,
          reputationScore: profile.reputationScore,
        }
      : null,
  }));

  return <StaffManager staffList={staffList} />;
}

export default function AdminStaffPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Quản lý Nhân sự</h1>
          <p className="mt-1 text-sm text-[#4A4242]">
            Tạo nhân sự khung, gửi link kích hoạt 1 lần qua Zalo cá nhân, xem bộ 4 ảnh cá nhân và
            xác minh danh tính.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
              Đang tải danh sách nhân sự...
            </div>
          }
        >
          <AdminStaffContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
