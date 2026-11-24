"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, MapPin, Shirt, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";
import { registerForShowAction } from "@/server/actions/registrations";

export interface StaffFeedShowItem {
  id: string;
  title: string;
  gatherAt: string;
  endAt: string;
  address: string;
  district: string;
  requiredMale: number;
  requiredFemale: number;
  wagePerPerson: number;
  allowanceNote: string | null;
  dressCode: string;
  status: "OPEN" | "FULL" | "CLOSED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  counts: {
    approvedMale: number;
    approvedFemale: number;
  };
  myRegistrationStatus: string | null;
}

export function StaffShowFeed({
  shows,
  staffGender,
}: {
  shows: StaffFeedShowItem[];
  staffGender: "MALE" | "FEMALE";
}) {
  const router = useRouter();
  const [onlyMatching, setOnlyMatching] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = onlyMatching
    ? shows.filter((s) =>
        staffGender === "MALE" ? s.requiredMale > 0 : s.requiredFemale > 0,
      )
    : shows;

  function handleRegister(showId: string) {
    setNotice(null);
    setBusyId(showId);
    startTransition(async () => {
      const res = await registerForShowAction(showId);
      setBusyId(null);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Đăng ký thất bại." });
        return;
      }
      setNotice({ type: "ok", text: res.message || "Đăng ký thành công!" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOnlyMatching(true)}
            className={
              onlyMatching
                ? "rounded-full bg-[#3E4A42] px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-[#C8D5B9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3E4A42]"
            }
          >
            Phù hợp với tôi ({staffGender === "MALE" ? "Nam" : "Nữ"})
          </button>
          <button
            type="button"
            onClick={() => setOnlyMatching(false)}
            className={
              !onlyMatching
                ? "rounded-full bg-[#3E4A42] px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-[#C8D5B9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3E4A42]"
            }
          >
            Tất cả show ({shows.length})
          </button>
        </div>
      </div>

      {notice ? (
        <div
          className={
            notice.type === "ok"
              ? "rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3.5 text-xs text-[#3E4A42]"
              : "rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3.5 text-xs text-[#4A4242]"
          }
        >
          {notice.text}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-[#4A4242]">
            Hiện chưa có show mới đang mở tuyển cho đội hình{" "}
            {staffGender === "MALE" ? "Nam" : "Nữ"}. Hãy quay lại sau nhé!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((show) => {
            const remainMale = Math.max(0, show.requiredMale - show.counts.approvedMale);
            const remainFemale = Math.max(0, show.requiredFemale - show.counts.approvedFemale);
            const genderMatches =
              staffGender === "MALE" ? show.requiredMale > 0 : show.requiredFemale > 0;
            const alreadyApplied =
              show.myRegistrationStatus === "PENDING" ||
              show.myRegistrationStatus === "APPROVED" ||
              show.myRegistrationStatus === "WAITLIST";

            return (
              <Card key={show.id}>
                <CardContent className="space-y-3.5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={show.status === "OPEN" ? "sage" : "blush"}>
                          {show.status === "OPEN" ? "Đang mở" : "Đã đủ người"}
                        </Badge>
                        <Badge variant="neutral">{show.district}</Badge>
                      </div>
                      <h2 className="text-base font-bold text-[#3E4A42]">
                        <Link href={`/shows/${show.id}`} className="hover:underline">
                          {show.title}
                        </Link>
                      </h2>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-extrabold text-[#3E4A42]">
                        {formatVnd(show.wagePerPerson)}
                      </p>
                      <p className="text-[11px] text-[#4A4242]">/ người</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#4A4242]">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#3E4A42]" />
                      <span>
                        Có mặt: <strong className="text-[#3E4A42]">{formatVietnamDateTime(show.gatherAt)}</strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3E4A42]" />
                      <span>
                        {show.address}, {show.district}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 text-[#3E4A42]" />
                      <span>
                        {show.requiredMale > 0 ? `Nam: còn ${remainMale}/${show.requiredMale}` : ""}
                        {show.requiredMale > 0 && show.requiredFemale > 0 ? " · " : ""}
                        {show.requiredFemale > 0
                          ? `Nữ: còn ${remainFemale}/${show.requiredFemale}`
                          : ""}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Shirt className="h-3.5 w-3.5 shrink-0 text-[#3E4A42]" />
                      <span>{show.dressCode}</span>
                    </p>
                    {show.allowanceNote ? (
                      <p className="flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 shrink-0 text-[#3E4A42]" />
                        <span>Phụ cấp: {show.allowanceNote}</span>
                      </p>
                    ) : null}
                  </div>

                  {show.notes ? (
                    <p className="rounded-xl bg-[#FAF9F5] p-2.5 text-xs text-[#4A4242]">
                      {show.notes}
                    </p>
                  ) : null}

                  <div className="pt-1">
                    {alreadyApplied ? (
                      <div className="flex items-center justify-between rounded-xl bg-[#EEF3E8] px-4 py-2.5 text-xs font-semibold text-[#3E4A42]">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          {show.myRegistrationStatus === "APPROVED"
                            ? "Đã được duyệt đi show"
                            : show.myRegistrationStatus === "WAITLIST"
                              ? "Đang trong danh sách dự bị"
                              : "Đã đăng ký — Đang chờ duyệt"}
                        </span>
                        <Link href="/staff/schedule" className="underline">
                          Xem lịch
                        </Link>
                      </div>
                    ) : show.status !== "OPEN" ? (
                      <Button type="button" variant="outline" className="w-full" disabled>
                        Show đã đủ người
                      </Button>
                    ) : !genderMatches ? (
                      <Button type="button" variant="outline" className="w-full" disabled>
                        Chỉ tuyển đội hình {show.requiredMale > 0 ? "Nam" : "Nữ"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isPending && busyId === show.id}
                        onClick={() => handleRegister(show.id)}
                      >
                        {isPending && busyId === show.id
                          ? "Đang đăng ký..."
                          : show.myRegistrationStatus === "CANCELLED"
                            ? "Đăng ký lại ngay (1 chạm)"
                            : "Đăng ký ngay (1 chạm)"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
