"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVietnamDateKey, formatVietnamDateTime, formatVnd } from "@/lib/utils";
import { buildRecruitShareMessage } from "@/lib/validations/show";
import { updateShowStatusAction } from "@/server/actions/admin-shows";

export interface AdminShowItem {
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
  clientName: string | null;
  totalRevenue: number | null;
  counts: {
    approvedMale: number;
    approvedFemale: number;
    pendingCount: number;
    waitlistCount: number;
  };
}

const FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "OPEN", label: "Đang mở" },
  { key: "FULL", label: "Đủ người" },
  { key: "CLOSED", label: "Đã đóng" },
] as const;

const STATUS_BADGE: Record<
  AdminShowItem["status"],
  { label: string; variant: "sage" | "blush" | "neutral" | "warning" | "danger" }
> = {
  OPEN: { label: "Đang mở tuyển", variant: "sage" },
  FULL: { label: "Đã đủ người", variant: "blush" },
  CLOSED: { label: "Đã đóng", variant: "neutral" },
  COMPLETED: { label: "Hoàn thành", variant: "sage" },
  CANCELLED: { label: "Đã hủy", variant: "danger" },
};

export function ShowsCalendarList({
  shows,
  appOrigin,
}: {
  shows: AdminShowItem[];
  appOrigin: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "ALL" ? shows : shows.filter((s) => s.status === filter);

  // Group shows by Vietnam date (YYYY-MM-DD) for clean multi-show daily management
  const grouped = new Map<string, AdminShowItem[]>();
  for (const show of filtered) {
    const key = formatVietnamDateKey(show.gatherAt);
    const arr = grouped.get(key) ?? [];
    arr.push(show);
    grouped.set(key, arr);
  }

  async function handleCopyRecruit(show: AdminShowItem) {
    const origin = typeof window !== "undefined" ? window.location.origin : appOrigin;
    const text = buildRecruitShareMessage({
      id: show.id,
      title: show.title,
      gatherAt: show.gatherAt,
      district: show.district,
      requiredMale: show.requiredMale,
      requiredFemale: show.requiredFemale,
      approvedMale: show.counts.approvedMale,
      approvedFemale: show.counts.approvedFemale,
      wagePerPerson: show.wagePerPerson,
      allowanceNote: show.allowanceNote,
      dressCode: show.dressCode,
      origin,
    });
    await navigator.clipboard.writeText(text);
    setCopiedId(show.id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  function handleChangeStatus(
    showId: string,
    nextStatus: "OPEN" | "CLOSED" | "COMPLETED" | "CANCELLED",
  ) {
    setNotice(null);
    startTransition(async () => {
      const res = await updateShowStatusAction(showId, nextStatus);
      if (!res.ok) {
        setNotice(res.error || "Không thể đổi trạng thái.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div className="rounded-xl border border-blush-strong bg-blush/60 p-3 text-xs text-ink-secondary">
          {notice}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-paper"
                  : "rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-sage-soft"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <Link
          href="/admin/shows/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blush-strong px-4 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-blush"
        >
          + Tạo Show mới
        </Link>
      </div>

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-ink-secondary">
            Chưa có show nào trong mục này. Bấm <strong>+ Tạo Show mới</strong> để bắt đầu!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, dayShows]) => (
            <section key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-ink" />
                <h2 className="text-sm font-bold text-ink">
                  Ngày {dateKey.split("-").reverse().join("/")} ({dayShows.length} show)
                </h2>
              </div>

              <div className="space-y-3">
                {dayShows.map((show) => {
                  const statusMeta = STATUS_BADGE[show.status];
                  return (
                    <Card key={show.id}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-ink">
                                <Link href={`/admin/shows/${show.id}`} className="hover:underline">
                                  {show.title}
                                </Link>
                              </h3>
                              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                              {show.counts.pendingCount > 0 ? (
                                <Badge variant="warning">
                                  {show.counts.pendingCount} chờ duyệt
                                </Badge>
                              ) : null}
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              Có mặt: <strong>{formatVietnamDateTime(show.gatherAt)}</strong>
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {show.address}, {show.district}
                            </p>
                            <p className="flex flex-wrap items-center gap-3 text-xs text-ink">
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <Users className="h-3.5 w-3.5" />
                                Nam: {show.counts.approvedMale}/{show.requiredMale} · Nữ:{" "}
                                {show.counts.approvedFemale}/{show.requiredFemale}
                              </span>
                              <span>
                                Cát-xê: <strong>{formatVnd(show.wagePerPerson)}</strong>
                              </span>
                              {show.clientName ? (
                                <span className="text-ink-secondary">Khách: {show.clientName}</span>
                              ) : null}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/shows/${show.id}`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sage px-3 text-xs font-bold text-ink shadow-sm hover:bg-sage-muted"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Duyệt ứng viên
                            </Link>

                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() => void handleCopyRecruit(show)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedId === show.id ? "Đã copy tin Zalo!" : "Copy tin tuyển"}
                            </Button>

                            <Link
                              href={`/admin/shows/${show.id}/edit`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-xs font-semibold text-ink hover:bg-sage-soft"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Sửa
                            </Link>

                            <Link
                              href={`/shows/${show.id}`}
                              target="_blank"
                              className="inline-flex h-9 items-center gap-1 rounded-xl border border-line bg-paper px-3 text-xs font-medium text-ink-secondary hover:bg-sage-soft"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Link công khai
                            </Link>

                            {show.status === "OPEN" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleChangeStatus(show.id, "CLOSED")}
                              >
                                Đóng tuyển
                              </Button>
                            ) : show.status === "CLOSED" || show.status === "FULL" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isPending}
                                onClick={() => handleChangeStatus(show.id, "OPEN")}
                              >
                                Mở lại
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
