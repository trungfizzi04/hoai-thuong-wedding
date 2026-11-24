"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Shirt,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";
import { AO_DAI_SIZES } from "@/lib/validations/auth";
import { reviewRegistrationAction } from "@/server/actions/admin-review";
import type { SizeBreakdown } from "@/server/dal/show-detail";

export interface ShowApplicantItem {
  registrationId: string;
  status: "PENDING" | "APPROVED" | "WAITLIST" | "REJECTED" | "CANCELLED" | "NO_SHOW";
  isConfirmed: boolean;
  cancelReason: string | null;
  createdAt: string;
  user: {
    id: string;
    zaloName: string | null;
    zaloAvatarUrl: string | null;
    status: "INVITED" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";
  };
  profile: {
    fullName: string;
    contactPhone: string;
    gender: "MALE" | "FEMALE";
    heightCm: number;
    weightKg: number | null;
    aoDaiSize: (typeof AO_DAI_SIZES)[number];
    photoCount: number;
    reputationScore: number;
  } | null;
}

export interface ShowReviewPanelProps {
  show: {
    id: string;
    title: string;
    gatherAt: string;
    endAt: string;
    address: string;
    district: string;
    requiredMale: number;
    requiredFemale: number;
    wagePerPerson: number;
    dressCode: string;
    status: string;
    zaloGroupUrl: string | null;
  };
  summary: {
    approvedMale: number;
    approvedFemale: number;
    unconfirmedApprovedCount: number;
    waitlistMale: number;
    waitlistFemale: number;
    maleSizes: SizeBreakdown;
    femaleSizes: SizeBreakdown;
  };
  applicants: ShowApplicantItem[];
}

const FILTER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "WAITLIST", label: "Dự bị" },
  { key: "UNCONFIRMED", label: "Chưa Confirm" },
  { key: "OTHER", label: "Hủy / Từ chối" },
] as const;

function formatSizeLine(sizes: SizeBreakdown): string {
  const parts = AO_DAI_SIZES.filter((s) => sizes[s] > 0).map((s) => `${s}: ${sizes[s]}`);
  return parts.length > 0 ? parts.join(" · ") : "Chưa có";
}

export function ShowReviewPanel({ show, summary, applicants }: ShowReviewPanelProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]["key"]>("ALL");
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedApproved, setCopiedApproved] = useState(false);
  const [lightbox, setLightbox] = useState<{ staffId: string; index: number } | null>(null);
  const [busyRegId, setBusyRegId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = applicants.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "UNCONFIRMED") return a.status === "APPROVED" && !a.isConfirmed;
    if (filter === "OTHER")
      return a.status === "CANCELLED" || a.status === "REJECTED" || a.status === "NO_SHOW";
    return a.status === filter;
  });

  const needsWaitlistPromotion =
    show.status === "FULL" &&
    ((summary.approvedMale < show.requiredMale && summary.waitlistMale > 0) ||
      (summary.approvedFemale < show.requiredFemale && summary.waitlistFemale > 0));

  function handleReview(
    registrationId: string,
    nextStatus: "APPROVED" | "WAITLIST" | "REJECTED",
    verifyIdentity?: boolean,
  ) {
    setNotice(null);
    setBusyRegId(registrationId);
    startTransition(async () => {
      const res = await reviewRegistrationAction({
        showId: show.id,
        registrationId,
        nextStatus,
        verifyIdentity,
      });
      setBusyRegId(null);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Thao tác thất bại." });
        return;
      }
      setNotice({ type: "ok", text: res.message || "Đã cập nhật trạng thái." });
      router.refresh();
    });
  }

  async function handleExportApprovedList() {
    const approved = applicants.filter((a) => a.status === "APPROVED");
    const males = approved.filter((a) => a.profile?.gender === "MALE");
    const females = approved.filter((a) => a.profile?.gender === "FEMALE");

    const formatPerson = (item: ShowApplicantItem, idx: number) => {
      const name = item.profile?.fullName || item.user.zaloName || "Nhân sự";
      const phone = item.profile?.contactPhone || "—";
      const size = item.profile?.aoDaiSize || "—";
      const confirmIcon = item.isConfirmed ? "✅ Đã confirm" : "⏳ Chưa confirm";
      return `${idx + 1}. ${name} - ${phone} - Size ${size} (${confirmIcon})`;
    };

    const lines = [
      `🌸 DANH SÁCH ĐỘI HÌNH BƯNG QUẢ — ${show.title}`,
      `⏰ Có mặt: ${formatVietnamDateTime(show.gatherAt)}`,
      `📍 Địa chỉ: ${show.address}, ${show.district}`,
      `👘 Trang phục: ${show.dressCode}`,
      `💰 Cát-xê: ${formatVnd(show.wagePerPerson)}/người`,
      ``,
    ];

    if (show.requiredMale > 0 || males.length > 0) {
      lines.push(`👔 ĐỘI HÌNH NAM (${males.length}/${show.requiredMale}):`);
      if (males.length === 0) lines.push("  (Chưa có)");
      else males.forEach((m, i) => lines.push(formatPerson(m, i)));
      lines.push(`→ Tổng Size Nam: ${formatSizeLine(summary.maleSizes)}`);
      lines.push("");
    }

    if (show.requiredFemale > 0 || females.length > 0) {
      lines.push(`👗 ĐỘI HÌNH NỮ (${females.length}/${show.requiredFemale}):`);
      if (females.length === 0) lines.push("  (Chưa có)");
      else females.forEach((f, i) => lines.push(formatPerson(f, i)));
      lines.push(`→ Tổng Size Nữ: ${formatSizeLine(summary.femaleSizes)}`);
      lines.push("");
    }

    lines.push("Các bạn nhớ có mặt đúng giờ và bấm xác nhận đi show trên web nhé!");

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopiedApproved(true);
    setTimeout(() => setCopiedApproved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={show.status === "OPEN" ? "sage" : "blush"}>{show.status}</Badge>
              <Badge variant="neutral">{show.district}</Badge>
              {summary.unconfirmedApprovedCount > 0 ? (
                <Badge variant="warning">
                  {summary.unconfirmedApprovedCount} bạn chưa Confirm
                </Badge>
              ) : null}
            </div>
            <CardTitle className="text-xl">{show.title}</CardTitle>
            <CardDescription>
              Có mặt: <strong>{formatVietnamDateTime(show.gatherAt)}</strong> · {show.address}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => void handleExportApprovedList()}
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedApproved ? "Đã copy danh sách Zalo!" : "Xuất danh sách đã duyệt"}
            </Button>
            <Link
              href={`/admin/shows/${show.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B7C9B5] bg-white px-3 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Sửa Show
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {needsWaitlistPromotion ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Có chỗ trống — Chờ đôn Dự bị:</strong> Show đang giữ trạng thái đóng công
                khai để ưu tiên hàng đợi Dự bị. Hãy mở tab <strong>Dự bị</strong> bên dưới để
                duyệt nhân sự lên!
              </span>
            </div>
          ) : null}

          {/* Progress Counters & Auto Ao Dai Size Table */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#C8D5B9] bg-[#EEF3E8]/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#3E4A42]">
                <Users className="h-4 w-4" /> Tiến độ đội hình (Đã duyệt)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[#4A4242]">Đội hình Nam</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-[#3E4A42]">
                    {summary.approvedMale}
                    <span className="text-sm font-medium text-[#4A4242]">
                      /{show.requiredMale}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[#4A4242]">Đội hình Nữ</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-[#3E4A42]">
                    {summary.approvedFemale}
                    <span className="text-sm font-medium text-[#4A4242]">
                      /{show.requiredFemale}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C8D5B9] bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#3E4A42]">
                <Shirt className="h-4 w-4" /> Bảng thống kê Size áo dài (Đã duyệt)
              </p>
              <div className="mt-2.5 overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-[#C8D5B9]/60 text-[#4A4242]">
                      <th className="py-1 text-left font-semibold">Đội</th>
                      {AO_DAI_SIZES.map((s) => (
                        <th key={s} className="px-1.5 py-1 font-semibold">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8D5B9]/40">
                    <tr>
                      <td className="py-1.5 text-left font-bold text-[#3E4A42]">Nam</td>
                      {AO_DAI_SIZES.map((s) => (
                        <td
                          key={s}
                          className={
                            summary.maleSizes[s] > 0
                              ? "px-1.5 py-1.5 font-extrabold text-[#3E4A42]"
                              : "px-1.5 py-1.5 text-[#4A4242]/40"
                          }
                        >
                          {summary.maleSizes[s]}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-1.5 text-left font-bold text-[#3E4A42]">Nữ</td>
                      {AO_DAI_SIZES.map((s) => (
                        <td
                          key={s}
                          className={
                            summary.femaleSizes[s] > 0
                              ? "px-1.5 py-1.5 font-extrabold text-[#3E4A42]"
                              : "px-1.5 py-1.5 text-[#4A4242]/40"
                          }
                        >
                          {summary.femaleSizes[s]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={
              filter === tab.key
                ? "rounded-full bg-[#3E4A42] px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-[#C8D5B9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applicants List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[#4A4242]">
              Không có ứng viên nào trong mục này.
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => {
            const isNewUnverified = item.user.status === "PENDING_APPROVAL";
            const isTicked = Boolean(verifiedMap[item.registrationId]);
            const isBusy = isPending && busyRegId === item.registrationId;

            return (
              <Card key={item.registrationId}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      {item.user.zaloAvatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.user.zaloAvatarUrl}
                          alt={item.profile?.fullName || "Avatar"}
                          className="h-11 w-11 rounded-full border border-[#C8D5B9] object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C8D5B9] text-xs font-bold text-[#3E4A42]">
                          {(item.profile?.fullName || "NV").slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[#3E4A42]">
                            {item.profile?.fullName || item.user.zaloName || "(Chưa có tên)"}
                          </p>
                          {item.status === "APPROVED" ? (
                            <Badge variant="sage">Đã duyệt</Badge>
                          ) : item.status === "PENDING" ? (
                            <Badge variant="warning">Chờ duyệt</Badge>
                          ) : item.status === "WAITLIST" ? (
                            <Badge variant="blush">Dự bị</Badge>
                          ) : (
                            <Badge variant="neutral">{item.status}</Badge>
                          )}

                          {item.status === "APPROVED" ? (
                            item.isConfirmed ? (
                              <Badge variant="sage" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã Confirm
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="gap-1">
                                <Clock className="h-3 w-3" /> Chưa Confirm
                              </Badge>
                            )
                          ) : null}

                          {isNewUnverified ? (
                            <Badge variant="danger">Nhân sự mới chờ xác minh</Badge>
                          ) : null}
                        </div>

                        <p className="text-xs text-[#4A4242]">
                          SĐT: <strong>{item.profile?.contactPhone || "—"}</strong>
                          {item.user.zaloName ? ` · Zalo: ${item.user.zaloName}` : ""}
                        </p>

                        {item.profile ? (
                          <p className="text-xs text-[#4A4242]">
                            {item.profile.gender === "MALE" ? "Nam" : "Nữ"} · Cao{" "}
                            <strong>{item.profile.heightCm} cm</strong>
                            {item.profile.weightKg ? ` · Nặng ${item.profile.weightKg} kg` : ""} ·
                            Áo dài size <strong>{item.profile.aoDaiSize}</strong> · Uy tín{" "}
                            <strong>{item.profile.reputationScore}</strong>
                          </p>
                        ) : null}

                        {item.cancelReason ? (
                          <p className="text-xs italic text-rose-700">
                            Lý do hủy: {item.cancelReason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "APPROVED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isBusy || (isNewUnverified && !isTicked)}
                          onClick={() =>
                            handleReview(item.registrationId, "APPROVED", isTicked)
                          }
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {isBusy
                            ? "Đang xử lý..."
                            : isNewUnverified
                              ? "Xác minh & Duyệt"
                              : "Duyệt"}
                        </Button>
                      ) : null}

                      {item.status !== "WAITLIST" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => handleReview(item.registrationId, "WAITLIST")}
                        >
                          {item.status === "APPROVED" ? "Hạ xuống Dự bị" : "Đưa vào Dự bị"}
                        </Button>
                      ) : null}

                      {item.status !== "REJECTED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleReview(item.registrationId, "REJECTED")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Từ chối
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Mandatory identity verification block for PENDING_APPROVAL staff */}
                  {isNewUnverified && item.status !== "APPROVED" ? (
                    <label className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                      <input
                        type="checkbox"
                        checked={isTicked}
                        onChange={(e) =>
                          setVerifiedMap((prev) => ({
                            ...prev,
                            [item.registrationId]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-4 w-4 accent-[#3E4A42]"
                      />
                      <span>
                        <strong>Đã xác minh danh tính nhân sự mới</strong> (đã đối chiếu Tên Zalo{" "}
                        <em>{item.user.zaloName || "—"}</em> + SĐT{" "}
                        <em>{item.profile?.contactPhone || "—"}</em> + ảnh cá nhân bên dưới khớp
                        người thật).
                      </span>
                    </label>
                  ) : null}

                  {/* Personal Photos (up to 4) */}
                  {item.profile && item.profile.photoCount > 0 ? (
                    <div className="flex flex-wrap gap-2 border-t border-[#C8D5B9]/40 pt-3">
                      {Array.from({ length: item.profile.photoCount }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightbox({ staffId: item.user.id, index: idx })}
                          className="h-20 w-16 overflow-hidden rounded-xl border border-[#C8D5B9] bg-[#FAF9F5] transition-transform hover:scale-105"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/photos/${item.user.id}?index=${idx}&size=thumb`}
                            alt={`Ảnh ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Lightbox */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] max-w-xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Đóng"
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3E4A42] shadow"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${lightbox.staffId}?index=${lightbox.index}&size=full`}
              alt="Ảnh cá nhân ứng viên"
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-xl"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
