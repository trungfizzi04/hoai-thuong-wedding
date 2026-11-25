import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";
import { StaffMySchedule, type StaffScheduleItem } from "@/components/staff/my-schedule";
import { getCurrentUser } from "@/server/dal/auth";
import { getStaffMySchedule } from "@/server/dal/shows";

async function ScheduleContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login?next=/staff/schedule");
  if (!auth.profile) redirect("/onboarding");

  const rows = await getStaffMySchedule(auth.user.id);

  const items: StaffScheduleItem[] = rows.map((r) => {
    const isApproved = r.registrationStatus === "APPROVED";

    return {
      registrationId: r.registrationId,
      registrationStatus: r.registrationStatus,
      isConfirmed: r.isConfirmed,
      cancelReason: r.cancelReason,
      canSelfCancel: r.canSelfCancel,
      lockedWithin24h: r.lockedWithin24h,
      show: {
        id: r.show.id,
        title: r.show.title,
        gatherAt: r.show.gatherAt.toISOString(),
        address: r.show.address,
        district: r.show.district,
        wagePerPerson: r.show.wagePerPerson,
        dressCode: r.show.dressCode,
        // Strictly only expose Zalo group link when APPROVED
        zaloGroupUrl: isApproved ? r.show.zaloGroupUrl : null,
      },
    };
  });

  return <StaffMySchedule items={items} />;
}

export default function StaffSchedulePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Lịch của tôi</h1>
        <p className="text-xs text-ink-secondary">
          Theo dõi trạng thái các show bạn đã đăng ký và vào group Zalo show khi được duyệt.
        </p>
      </div>
      <Suspense fallback={<ListSkeleton rows={2} />}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
