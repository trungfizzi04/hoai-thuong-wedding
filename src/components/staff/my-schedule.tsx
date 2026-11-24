"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, ExternalLink, MapPin, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";
import {
  cancelMyRegistrationAction,
  confirmMyAttendanceAction,
} from "@/server/actions/registrations";

export interface StaffScheduleItem {
  registrationId: string;
  registrationStatus: "PENDING" | "APPROVED" | "WAITLIST" | "REJECTED" | "CANCELLED" | "NO_SHOW";
  isConfirmed: boolean;
  cancelReason: string | null;
  canSelfCancel: boolean;
  lockedWithin24h: boolean;
  show: {
    id: string;
    title: string;
    gatherAt: string;
    address: string;
    district: string;
    wagePerPerson: number;
    dressCode: string;
    zaloGroupUrl: string | null;
  };
}

const REG_STATUS_META: Record<
  StaffScheduleItem["registrationStatus"],
  { label: string; variant: "sage" | "blush" | "neutral" | "warning" | "danger" }
> = {
  PENDING: { label: "Chờ Admin duyệt", variant: "warning" },
  APPROVED: { label: "Đã được duyệt", variant: "sage" },
  WAITLIST: { label: "Danh sách dự bị", variant: "blush" },
  REJECTED: { label: "Không phù hợp", variant: "neutral" },
  CANCELLED: { label: "Đã hủy", variant: "neutral" },
  NO_SHOW: { label: "Vắng mặt", variant: "danger" },
};

export function StaffMySchedule({ items }: { items: StaffScheduleItem[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busyShowId, setBusyShowId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(showId: string) {
    setNotice(null);
    setBusyShowId(showId);
    startTransition(async () => {
      const res = await confirmMyAttendanceAction(showId);
      setBusyShowId(null);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Không thể xác nhận tham gia." });
        return;
      }
      setNotice({ type: "ok", text: res.message || "Đã xác nhận đi show!" });
      router.refresh();
    });
  }

  function handleCancel(showId: string, title: string) {
    const reason = window.prompt(`Nhập lý do hủy đăng ký show "${title}" (tùy chọn):`);
    if (reason === null) return;

    setNotice(null);
    setBusyShowId(showId);
    startTransition(async () => {
      const res = await cancelMyRegistrationAction(showId, reason);
      setBusyShowId(null);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Không thể hủy đăng ký." });
        return;
      }
      setNotice({ type: "ok", text: res.message || "Đã hủy đăng ký." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
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

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center text-sm text-[#4A4242]">
            <p>Bạn chưa đăng ký show nào.</p>
            <Link
              href="/staff"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#E8B4B8] px-4 text-xs font-bold text-[#3E4A42]"
            >
              Xem các show đang mở tuyển →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const meta = REG_STATUS_META[item.registrationStatus];
            const isBusy = isPending && busyShowId === item.show.id;
            return (
              <Card key={item.registrationId}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {item.registrationStatus === "APPROVED" && item.isConfirmed ? (
                          <Badge variant="sage" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Đã xác nhận đi show
                          </Badge>
                        ) : null}
                      </div>
                      <h2 className="mt-1.5 text-base font-bold text-[#3E4A42]">
                        {item.show.title}
                      </h2>
                    </div>
                    <p className="text-sm font-bold text-[#3E4A42]">
                      {formatVnd(item.show.wagePerPerson)}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-[#4A4242]">
                    <p className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-[#3E4A42]" />
                      Có mặt: <strong>{formatVietnamDateTime(item.show.gatherAt)}</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#3E4A42]" />
                      {item.show.address}, {item.show.district}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.registrationStatus === "APPROVED" && !item.isConfirmed ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => handleConfirm(item.show.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isBusy ? "Đang xác nhận..." : "Xác nhận đi show (Confirm)"}
                      </Button>
                    ) : null}

                    {item.registrationStatus === "APPROVED" && item.show.zaloGroupUrl ? (
                      <a
                        href={item.show.zaloGroupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#C8D5B9] px-3.5 text-xs font-bold text-[#3E4A42] hover:bg-[#B7C9B5]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Vào group Zalo show
                      </a>
                    ) : null}

                    {item.canSelfCancel ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleCancel(item.show.id, item.show.title)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Hủy đăng ký
                      </Button>
                    ) : item.lockedWithin24h ? (
                      <p className="text-xs font-medium text-amber-800">
                        Show diễn ra trong vòng 24h tới — cần hủy gấp hãy nhắn trực tiếp Admin trên
                        Zalo.
                      </p>
                    ) : null}
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
