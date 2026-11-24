import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ShowForm } from "@/components/admin/show-form";
import { toVietnamDateTimeLocalInput } from "@/lib/validations/show";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { shows } from "@/server/db/schema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function EditShowContent({ params }: { params: Promise<{ id: string }> }) {
  const [auth, { id }] = await Promise.all([getCurrentUser(), params]);
  if (!auth) redirect(`/admin/login?next=/admin/shows/${id}/edit`);
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }
  if (!UUID_REGEX.test(id)) notFound();

  const db = getDb();
  const [show] = await db.select().from(shows).where(eq(shows.id, id)).limit(1);
  if (!show) notFound();

  return (
    <ShowForm
      initialData={{
        id: show.id,
        title: show.title,
        gatherAtLocal: toVietnamDateTimeLocalInput(show.gatherAt),
        endAtLocal: toVietnamDateTimeLocalInput(show.endAt),
        address: show.address,
        district: show.district,
        requiredMale: show.requiredMale,
        requiredFemale: show.requiredFemale,
        wagePerPerson: show.wagePerPerson,
        allowanceNote: show.allowanceNote ?? "",
        dressCode: show.dressCode,
        zaloGroupUrl: show.zaloGroupUrl ?? "",
        autoCloseWhenFull: show.autoCloseWhenFull,
        notes: show.notes ?? "",
        clientName: show.clientName ?? "",
        clientPhone: show.clientPhone ?? "",
        totalRevenue: show.totalRevenue !== null ? String(show.totalRevenue) : "",
      }}
    />
  );
}

export default function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3E4A42]">Chỉnh sửa Show</h1>
          <p className="mt-1 text-sm text-[#4A4242]">
            Hệ thống tự khóa dòng dữ liệu để bảo vệ số slot đã duyệt khi bạn chỉnh sửa.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
              Đang tải thông tin show...
            </div>
          }
        >
          <EditShowContent params={params} />
        </Suspense>
      </div>
    </AdminShell>
  );
}
