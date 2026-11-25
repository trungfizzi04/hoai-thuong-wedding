import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ShowReviewPanel, type ShowApplicantItem } from "@/components/admin/show-review-panel";
import { getCurrentUser } from "@/server/dal/auth";
import { getAdminShowDetail } from "@/server/dal/show-detail";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function AdminShowDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const [auth, { id }] = await Promise.all([getCurrentUser(), params]);
  if (!auth) redirect(`/admin/login?next=/admin/shows/${id}`);
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    redirect("/staff");
  }
  if (!UUID_REGEX.test(id)) notFound();

  const detail = await getAdminShowDetail(id);
  if (!detail) notFound();

  const applicants: ShowApplicantItem[] = detail.applicants.map((r) => ({
    registrationId: r.registration.id,
    status: r.registration.status,
    isConfirmed: r.registration.isConfirmed,
    cancelReason: r.registration.cancelReason,
    createdAt: r.registration.createdAt.toISOString(),
    user: {
      id: r.user.id,
      zaloName: r.user.zaloName,
      zaloAvatarUrl: r.user.zaloAvatarUrl,
      status: r.user.status,
    },
    profile: r.profile
      ? {
          fullName: r.profile.fullName,
          contactPhone: r.profile.contactPhone,
          gender: r.profile.gender,
          heightCm: r.profile.heightCm,
          weightKg: r.profile.weightKg,
          aoDaiSize: r.profile.aoDaiSize,
          photoCount: r.profile.photoItems.length,
          reputationScore: r.profile.reputationScore,
        }
      : null,
  }));

  return (
    <ShowReviewPanel
      show={{
        id: detail.show.id,
        title: detail.show.title,
        gatherAt: detail.show.gatherAt.toISOString(),
        endAt: detail.show.endAt.toISOString(),
        address: detail.show.address,
        district: detail.show.district,
        requiredMale: detail.show.requiredMale,
        requiredFemale: detail.show.requiredFemale,
        wagePerPerson: detail.show.wagePerPerson,
        dressCode: detail.show.dressCode,
        status: detail.show.status,
        zaloGroupUrl: detail.show.zaloGroupUrl,
      }}
      summary={detail.summary}
      applicants={applicants}
    />
  );
}

export default function AdminShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminShell>
      <div className="space-y-4">
        <Link
          href="/admin/shows"
          className="inline-block text-xs font-semibold text-ink underline underline-offset-4"
        >
          ← Quay lại Lịch Show theo ngày
        </Link>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <AdminShowDetailContent params={params} />
        </Suspense>
      </div>
    </AdminShell>
  );
}
