import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ShowsCalendarList, type AdminShowItem } from "@/components/admin/shows-calendar-list";
import { getCurrentUser } from "@/server/dal/auth";
import { getAdminShowsWithCounts } from "@/server/dal/shows";

async function AdminShowsContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/admin/login?next=/admin/shows");
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }

  const rows = await getAdminShowsWithCounts();
  const items: AdminShowItem[] = rows.map((s) => ({
    id: s.id,
    title: s.title,
    gatherAt: s.gatherAt.toISOString(),
    endAt: s.endAt.toISOString(),
    address: s.address,
    district: s.district,
    requiredMale: s.requiredMale,
    requiredFemale: s.requiredFemale,
    wagePerPerson: s.wagePerPerson,
    allowanceNote: s.allowanceNote,
    dressCode: s.dressCode,
    status: s.status,
    clientName: s.clientName,
    totalRevenue: s.totalRevenue,
    counts: s.counts,
  }));

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return <ShowsCalendarList shows={items} appOrigin={appOrigin} />;
}

export default function AdminShowsPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Lịch Show theo Ngày</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Tạo show, quản lý nhiều đám cưới cùng ngày và copy tin tuyển show dán thẳng vào group
            Zalo.
          </p>
        </div>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <AdminShowsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
