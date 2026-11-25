import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { StaffShowFeed, type StaffFeedShowItem } from "@/components/staff/show-feed";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/server/dal/auth";
import { getStaffFeedShows } from "@/server/dal/shows";

async function StaffHomeContent() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.user.role === "ADMIN") redirect("/admin");
  if (!auth.profile) redirect("/onboarding");

  const { user, profile } = auth;
  const rawShows = await getStaffFeedShows(user.id);

  const feedShows: StaffFeedShowItem[] = rawShows.map((s) => ({
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
    notes: s.notes,
    counts: {
      approvedMale: s.counts.approvedMale,
      approvedFemale: s.counts.approvedFemale,
    },
    myRegistrationStatus: s.myRegistrationStatus,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div>
          <p className="text-base font-bold text-ink">Chào {profile.fullName}!</p>
          <p className="text-xs text-ink-secondary">
            {profile.gender === "MALE" ? "Nam" : "Nữ"} · {profile.heightCm} cm · Áo dài size{" "}
            <strong>{profile.aoDaiSize}</strong> ·{" "}
            <Link href="/staff/profile" className="underline">
              Sửa hồ sơ &amp; 4 ảnh
            </Link>
          </p>
        </div>
        {user.status === "ACTIVE" ? (
          <Badge variant="sage" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã xác minh
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            Chờ xác minh
          </Badge>
        )}
      </div>

      <StaffShowFeed shows={feedShows} staffGender={profile.gender} />
    </div>
  );
}

export default function StaffHomePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <StaffHomeContent />
    </Suspense>
  );
}
