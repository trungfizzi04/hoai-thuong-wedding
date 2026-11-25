"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Link2,
  Lock,
  Unlock,
  UserPlus,
} from "lucide-react";
import { PhotoLightbox } from "@/components/staff/photo-lightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInvitedStaffAction,
  regenerateInviteLinkAction,
  toggleSuspendStaffAction,
  verifyStaffAction,
} from "@/server/actions/admin-staff";

export interface AdminStaffListItem {
  id: string;
  loginPhone: string | null;
  zaloName: string | null;
  zaloAvatarUrl: string | null;
  status: "INVITED" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  profile: {
    fullName: string;
    contactPhone: string;
    gender: "MALE" | "FEMALE";
    heightCm: number;
    weightKg: number | null;
    aoDaiSize: string;
    photoCount: number;
    reputationScore: number;
  } | null;
}

const STATUS_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING_APPROVAL", label: "Chờ xác minh" },
  { key: "ACTIVE", label: "Đang hoạt động" },
  { key: "INVITED", label: "Đã mời" },
  { key: "SUSPENDED", label: "Đã khóa" },
] as const;

export function StaffManager({ staffList }: { staffList: AdminStaffListItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["key"]>("ALL");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteBox, setInviteBox] = useState<{ url: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ staffId: string; index: number; count: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered =
    filter === "ALL" ? staffList : staffList.filter((item) => item.status === filter);

  function handleCreateInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setInviteBox(null);

    startTransition(async () => {
      const res = await createInvitedStaffAction({ fullName, phone });
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Không thể tạo nhân sự." });
        return;
      }
      setFullName("");
      setPhone("");
      if (res.inviteUrl && res.inviteMessage) {
        setInviteBox({ url: res.inviteUrl, message: res.inviteMessage });
      }
      setNotice({ type: "ok", text: "Đã tạo hồ sơ khung và sinh link kích hoạt 1 lần (72 giờ)." });
      router.refresh();
    });
  }

  function handleRegenerate(userId: string) {
    setNotice(null);
    startTransition(async () => {
      const res = await regenerateInviteLinkAction(userId);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Không tạo lại được link." });
        return;
      }
      if (res.inviteUrl && res.inviteMessage) {
        setInviteBox({ url: res.inviteUrl, message: res.inviteMessage });
      }
      setNotice({ type: "ok", text: "Đã tạo link kích hoạt mới (hiệu lực 72 giờ)." });
      router.refresh();
    });
  }

  function handleVerify(userId: string) {
    setNotice(null);
    startTransition(async () => {
      const res = await verifyStaffAction(userId);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Xác minh thất bại." });
        return;
      }
      setNotice({ type: "ok", text: "Đã xác minh danh tính nhân sự (ACTIVE)." });
      router.refresh();
    });
  }

  function handleToggleSuspend(userId: string, suspend: boolean) {
    setNotice(null);
    startTransition(async () => {
      const res = await toggleSuspendStaffAction(userId, suspend);
      if (!res.ok) {
        setNotice({ type: "err", text: res.error || "Thao tác thất bại." });
        return;
      }
      setNotice({
        type: "ok",
        text: suspend
          ? "Đã khóa tài khoản và thu hồi toàn bộ phiên đăng nhập."
          : "Đã mở khóa tài khoản nhân sự.",
      });
      router.refresh();
    });
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Create Invited Staff Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Tạo nhân sự khung &amp; Sinh Link kích hoạt 1 lần (72h)
          </CardTitle>
          <CardDescription>
            Nhập Tên + SĐT thật của nhân sự rồi gửi link mời vào tin nhắn Zalo cá nhân của bạn ấy
            (chống giả mạo SĐT 0đ).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="inv-name">Họ và tên</Label>
              <Input
                id="inv-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Minh Anh"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-phone">SĐT thật (Zalo)</Label>
              <Input
                id="inv-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo & Sinh Link mời"}
              </Button>
            </div>
          </form>

          {notice ? (
            <div
              className={
                notice.type === "ok"
                  ? "rounded-xl border border-line-strong bg-sage-soft p-3 text-xs text-ink"
                  : "rounded-xl border border-blush-strong bg-blush/60 p-3 text-xs text-ink-secondary"
              }
            >
              {notice.text}
            </div>
          ) : null}

          {inviteBox ? (
            <div className="space-y-2 rounded-xl border border-line-strong bg-sage-soft p-4 text-xs text-ink">
              <p className="font-bold">Tin nhắn mời dán vào Zalo cá nhân:</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 font-sans text-xs text-ink">
                {inviteBox.message}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => void copyText(inviteBox.message)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Đã copy tin nhắn!" : "Copy tin nhắn mời"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(inviteBox.url)}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Chỉ copy link
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={
              filter === tab.key
                ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-paper"
                : "rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-sage-soft"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-ink-secondary">
              Không có nhân sự nào trong mục này.
            </CardContent>
          </Card>
        ) : (
          filtered.map((staff) => (
            <Card key={staff.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    {staff.zaloAvatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={staff.zaloAvatarUrl}
                        alt={staff.profile?.fullName || staff.zaloName || "Avatar"}
                        className="h-11 w-11 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-ink">
                        {(staff.profile?.fullName || staff.zaloName || "NV")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-ink">
                          {staff.profile?.fullName || staff.zaloName || "(Chưa điền tên)"}
                        </p>
                        {staff.status === "ACTIVE" ? (
                          <Badge variant="sage">Đang hoạt động</Badge>
                        ) : staff.status === "PENDING_APPROVAL" ? (
                          <Badge variant="warning">Chờ xác minh</Badge>
                        ) : staff.status === "INVITED" ? (
                          <Badge variant="neutral">Đã gửi link mời</Badge>
                        ) : (
                          <Badge variant="danger">Đã khóa</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary">
                        SĐT: <strong>{staff.profile?.contactPhone || staff.loginPhone || "—"}</strong>
                        {staff.zaloName ? ` · Zalo: ${staff.zaloName}` : ""}
                      </p>
                      {staff.profile ? (
                        <p className="text-xs text-ink-secondary">
                          {staff.profile.gender === "MALE" ? "Nam" : "Nữ"} · Cao{" "}
                          <strong>{staff.profile.heightCm} cm</strong>
                          {staff.profile.weightKg ? ` · Nặng ${staff.profile.weightKg} kg` : ""} ·
                          Size áo dài <strong>{staff.profile.aoDaiSize}</strong> · Uy tín{" "}
                          <strong>{staff.profile.reputationScore}</strong>
                        </p>
                      ) : (
                        <p className="text-xs italic text-ink-secondary/70">Chưa hoàn tất hồ sơ 6 trường</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {staff.status === "PENDING_APPROVAL" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleVerify(staff.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Xác minh danh tính
                      </Button>
                    ) : null}
                    {staff.status === "INVITED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleRegenerate(staff.id)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Cấp lại link mời
                      </Button>
                    ) : null}
                    {staff.status !== "SUSPENDED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleToggleSuspend(staff.id, true)}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Khóa
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleToggleSuspend(staff.id, false)}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Mở khóa
                      </Button>
                    )}
                  </div>
                </div>

                {/* Staff Personal Photos (up to 4) */}
                {staff.profile && staff.profile.photoCount > 0 ? (
                  <div className="flex flex-wrap gap-2 border-t border-line/40 pt-3">
                    {Array.from({ length: staff.profile.photoCount }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setLightbox({
                            staffId: staff.id,
                            index: idx,
                            count: staff.profile?.photoCount ?? 1,
                          })
                        }
                        className="h-20 w-16 overflow-hidden rounded-xl border border-line bg-paper transition-transform hover:scale-105"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/photos/${staff.id}?index=${idx}&size=thumb`}
                          alt={`Ảnh ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Lightbox */}
      {lightbox ? (
        <PhotoLightbox
          count={lightbox.count}
          index={lightbox.index}
          srcFor={(i) => `/api/photos/${lightbox.staffId}?index=${i}&size=full`}
          onIndexChange={(next) => setLightbox((cur) => (cur ? { ...cur, index: next } : null))}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  );
}
