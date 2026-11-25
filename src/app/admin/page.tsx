import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
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
        <h1 className="text-2xl font-extrabold text-ink">Bảng điều khiển Quản trị</h1>
        <p className="mt-1 text-sm text-ink-secondary">
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
          <CardContent className="text-xs text-ink-secondary">
            Hoạt động: <strong>{staffStats?.active ?? 0}</strong> · Đã mời:{" "}
            <strong>{staffStats?.invited ?? 0}</strong>
          </CardContent>
        </Card>

        <Card className="border-blush-strong bg-blush/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Chờ xác minh danh tính
            </CardDescription>
            <CardTitle className="text-3xl">{staffStats?.pending ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-ink-secondary">
            Nhân sự mới tự đăng nhập Zalo từ group chung.
          </CardContent>
        </Card>

        <Card className="bg-sage-soft/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Show đang mở tuyển
            </CardDescription>
            <CardTitle className="text-3xl">{showStats?.open ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-ink-secondary">
            Tổng show trong hệ thống: <strong>{showStats?.total ?? 0}</strong>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/shows/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blush-strong px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-blush"
        >
          + Tạo Show bưng quả mới
        </Link>
        <Link
          href="/admin/shows"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-sage px-5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-sage-muted"
        >
          Lịch Show theo ngày →
        </Link>
        <Link
          href="/admin/staff"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-sage-soft"
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
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <AdminOverviewContent />
      </Suspense>
    </AdminShell>
  );
}
