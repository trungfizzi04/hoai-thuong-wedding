import { Suspense } from "react";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, UserCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { shows, users } from "@/server/db/schema";

async function AdminOverviewContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/admin/login?next=/admin");
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }

  const db = getDb();
  const [staffStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${users.status} = 'ACTIVE')::int`,
      pending: sql<number>`count(*) filter (where ${users.status} = 'PENDING_APPROVAL')::int`,
      invited: sql<number>`count(*) filter (where ${users.status} = 'INVITED')::int`,
    })
    .from(users)
    .where(eq(users.role, "STAFF"));

  const [showStats] = await db
    .select({
      open: sql<number>`count(*) filter (where ${shows.status} = 'OPEN')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(shows);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#3E4A42]">Bảng điều khiển Quản trị</h1>
        <p className="mt-1 text-sm text-[#4A4242]">
          Chào {auth.user.zaloName || "Admin"} — quản lý nhân sự, xác minh danh tính và show bưng
          quả.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Tổng nhân sự
            </CardDescription>
            <CardTitle className="text-3xl">{staffStats?.total ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#4A4242]">
            Hoạt động: <strong>{staffStats?.active ?? 0}</strong> · Đã mời:{" "}
            <strong>{staffStats?.invited ?? 0}</strong>
          </CardContent>
        </Card>

        <Card className="border-[#E8B4B8] bg-[#F4D6D6]/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Chờ xác minh danh tính
            </CardDescription>
            <CardTitle className="text-3xl">{staffStats?.pending ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#4A4242]">
            Nhân sự mới tự đăng nhập Zalo từ group chung.
          </CardContent>
        </Card>

        <Card className="bg-[#EEF3E8]/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Show đang mở tuyển
            </CardDescription>
            <CardTitle className="text-3xl">{showStats?.open ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-[#4A4242]">
            Tổng show trong hệ thống: <strong>{showStats?.total ?? 0}</strong>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/shows/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E8B4B8] px-5 text-sm font-semibold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#F4D6D6]"
        >
          + Tạo Show bưng quả mới
        </Link>
        <Link
          href="/admin/shows"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#C8D5B9] px-5 text-sm font-semibold text-[#3E4A42] shadow-sm transition-colors hover:bg-[#B7C9B5]"
        >
          Lịch Show theo ngày →
        </Link>
        <Link
          href="/admin/staff"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#B7C9B5] bg-white px-5 text-sm font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
        >
          Quản lý Nhân sự
        </Link>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <AdminShell>
      <Suspense
        fallback={
          <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
            Đang tải tổng quan...
          </div>
        }
      >
        <AdminOverviewContent />
      </Suspense>
    </AdminShell>
  );
}
