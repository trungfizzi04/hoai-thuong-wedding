import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Shirt, Users, Wallet } from "lucide-react";
import { PublicRegisterButton } from "@/components/shows/public-register-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";
import { getCurrentUser } from "@/server/dal/auth";
import { getPublicShowById } from "@/server/dal/shows";
import { getDb } from "@/server/db";
import { registrations } from "@/server/db/schema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return { title: "Không tìm thấy show — Hoài Thương Wedding" };
  }

  const show = await getPublicShowById(id);
  if (!show) {
    return { title: "Không tìm thấy show — Hoài Thương Wedding" };
  }

  const slotText: string[] = [];
  if (show.requiredMale > 0) {
    slotText.push(`Nam ${Math.max(0, show.requiredMale - show.counts.approvedMale)}/${show.requiredMale}`);
  }
  if (show.requiredFemale > 0) {
    slotText.push(
      `Nữ ${Math.max(0, show.requiredFemale - show.counts.approvedFemale)}/${show.requiredFemale}`,
    );
  }

  const description = `${formatVietnamDateTime(show.gatherAt)} · ${show.district} · Cát-xê ${formatVnd(show.wagePerPerson)} · Còn slot: ${slotText.join(", ")}`;

  return {
    title: `${show.title} — Hoài Thương Wedding`,
    description,
    openGraph: {
      title: `🌸 Tuyển bưng quả: ${show.title}`,
      description,
      type: "website",
      locale: "vi_VN",
      siteName: "Hoài Thương Wedding",
    },
  };
}

async function PublicShowContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const [show, auth] = await Promise.all([getPublicShowById(id), getCurrentUser()]);
  if (!show) notFound();

  let existingStatus: string | null = null;
  if (auth && auth.user.role === "STAFF") {
    const db = getDb();
    const [reg] = await db
      .select({ status: registrations.status })
      .from(registrations)
      .where(and(eq(registrations.showId, show.id), eq(registrations.userId, auth.user.id)))
      .limit(1);
    existingStatus = reg?.status ?? null;
  }

  const remainMale = Math.max(0, show.requiredMale - show.counts.approvedMale);
  const remainFemale = Math.max(0, show.requiredFemale - show.counts.approvedFemale);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={show.status === "OPEN" ? "sage" : "blush"}>
            {show.status === "OPEN"
              ? "Đang mở tuyển"
              : show.status === "FULL"
                ? "Đã đủ người"
                : "Đã đóng"}
          </Badge>
          <Badge variant="neutral">{show.district}</Badge>
        </div>
        <CardTitle className="text-xl sm:text-2xl">{show.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl bg-[#EEF3E8]/70 p-4 text-sm text-[#3E4A42]">
          <p className="flex items-start gap-2.5">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Giờ có mặt:</strong> {formatVietnamDateTime(show.gatherAt)}
              <br />
              <span className="text-xs text-[#4A4242]">
                Dự kiến xong: {formatVietnamDateTime(show.endAt)}
              </span>
            </span>
          </p>

          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Địa điểm:</strong> {show.address}, {show.district}
            </span>
          </p>

          <p className="flex items-start gap-2.5">
            <Users className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Slot cần tuyển:</strong>{" "}
              {show.requiredMale > 0 ? `Nam (còn ${remainMale}/${show.requiredMale})` : ""}
              {show.requiredMale > 0 && show.requiredFemale > 0 ? " · " : ""}
              {show.requiredFemale > 0 ? `Nữ (còn ${remainFemale}/${show.requiredFemale})` : ""}
            </span>
          </p>

          <p className="flex items-start gap-2.5">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Cát-xê:</strong> {formatVnd(show.wagePerPerson)}/người
              {show.allowanceNote ? (
                <span className="block text-xs text-[#4A4242]">Phụ cấp: {show.allowanceNote}</span>
              ) : null}
            </span>
          </p>

          <p className="flex items-start gap-2.5">
            <Shirt className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>Trang phục:</strong> {show.dressCode}
            </span>
          </p>
        </div>

        {show.notes ? (
          <div className="rounded-xl border border-[#C8D5B9] bg-white p-4 text-sm text-[#4A4242]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#3E4A42]">
              Lưu ý thêm
            </p>
            <p className="mt-1 whitespace-pre-line">{show.notes}</p>
          </div>
        ) : null}

        <PublicRegisterButton
          showId={show.id}
          showStatus={show.status}
          isLoggedIn={Boolean(auth)}
          isStaff={auth?.user.role === "STAFF"}
          hasProfile={Boolean(auth?.profile)}
          staffGender={auth?.profile?.gender ?? null}
          requiredMale={show.requiredMale}
          requiredFemale={show.requiredFemale}
          existingStatus={existingStatus}
        />
      </CardContent>
    </Card>
  );
}

export default function PublicShowPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen bg-[#FAF9F5] px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8D5B9] text-sm font-bold text-[#3E4A42]">
              HT
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-[#3E4A42]">Hoài Thương Wedding</p>
              <p className="text-[11px] text-[#4A4242]">Đăng ký Show Bưng Quả 1 Chạm</p>
            </div>
          </Link>
          <Link
            href="/staff"
            className="text-xs font-semibold text-[#3E4A42] underline underline-offset-4"
          >
            Xem tất cả show
          </Link>
        </header>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-6 text-sm text-[#4A4242]">
              Đang tải thông tin show...
            </div>
          }
        >
          <PublicShowContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}
