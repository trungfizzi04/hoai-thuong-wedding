"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, ExternalLink, MapPin, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
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
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [busyShowId, setBusyShowId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(showId: string) {
    setBusyShowId(showId);
    startTransition(async () => {
      const res = await confirmMyAttendanceAction(showId);
      setBusyShowId(null);
      if (!res.ok) {
        toast.error(res.error || "Không thể xác nhận tham gia.");
        return;
      }
      toast.success(res.message || "Đã xác nhận đi show!");
      router.refresh();
    });
  }

  async function handleCancel(showId: string, title: string) {
    const { confirmed, input: reason } = await confirmDialog({
      title: "Hủy đăng ký show?",
      description: `Show "${title}". Bạn có thể ghi lý do (tùy chọn).`,
      inputLabel: "Lý do hủy",
      inputPlaceholder: "VD: Bận việc đột xuất",
      confirmLabel: "Hủy đăng ký",
      cancelLabel: "Giữ lại",
      destructive: true,
    });
    if (!confirmed) return;

    setBusyShowId(showId);
    startTransition(async () => {
      const res = await cancelMyRegistrationAction(showId, reason);
      setBusyShowId(null);
      if (!res.ok) {
        toast.error(res.error || "Không thể hủy đăng ký.");
        return;
      }
      toast.success(res.message || "Đã hủy đăng ký.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center text-sm text-ink-secondary">
            <p>Bạn chưa đăng ký show nào.</p>
            <Link
              href="/staff"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blush-strong px-4 text-xs font-bold text-ink"
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
                      <h2 className="mt-1.5 text-base font-bold text-ink">
                        {item.show.title}
                      </h2>
                    </div>
                    <p className="text-sm font-bold text-ink">
                      {formatVnd(item.show.wagePerPerson)}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-ink-secondary">
                    <p className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-ink" />
                      Có mặt: <strong>{formatVietnamDateTime(item.show.gatherAt)}</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-ink" />
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
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sage px-3.5 text-xs font-bold text-ink hover:bg-sage-muted"
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
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
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
