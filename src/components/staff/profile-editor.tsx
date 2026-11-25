"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ImagePlus, RefreshCw, ShieldAlert, Star, Trash2 } from "lucide-react";
import { PhotoLightbox } from "@/components/staff/photo-lightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { compressImageFile } from "@/lib/client-image";
import { AO_DAI_SIZES } from "@/lib/validations/auth";
import { anonymizeMyAccountAction, updateMyProfileAction } from "@/server/actions/staff";

interface ProfileEditorProps {
  userId: string;
  userRole: "ADMIN" | "STAFF";
  userStatus: string;
  zaloName: string | null;
  zaloAvatarUrl: string | null;
  initialProfile: {
    fullName: string;
    contactPhone: string;
    gender: "MALE" | "FEMALE";
    heightCm: number;
    weightKg: number | null;
    aoDaiSize: (typeof AO_DAI_SIZES)[number];
    photoCount: number;
  };
}

const MAX_PHOTOS = 4;

type UploadStatus = "compressing" | "queued" | "uploading" | "done" | "error";

interface UploadItem {
  id: number;
  name: string;
  status: UploadStatus;
  error?: string;
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  compressing: "Đang nén...",
  queued: "Chờ tải lên",
  uploading: "Đang tải lên...",
  done: "Hoàn tất",
  error: "Lỗi",
};

interface PhotoApiResponse {
  ok?: boolean;
  error?: string;
  message?: string;
  photoCount?: number;
}

export function ProfileEditor({
  userId,
  userRole,
  userStatus,
  zaloName,
  zaloAvatarUrl,
  initialProfile,
}: ProfileEditorProps) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [contactPhone, setContactPhone] = useState(initialProfile.contactPhone);
  const [gender, setGender] = useState<"MALE" | "FEMALE">(initialProfile.gender);
  const [heightCm, setHeightCm] = useState(String(initialProfile.heightCm));
  const [weightKg, setWeightKg] = useState(
    initialProfile.weightKg !== null ? String(initialProfile.weightKg) : "",
  );
  const [aoDaiSize, setAoDaiSize] = useState<(typeof AO_DAI_SIZES)[number]>(initialProfile.aoDaiSize);

  const [photoCount, setPhotoCount] = useState(initialProfile.photoCount);
  const [photoVersion, setPhotoVersion] = useState(1);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [isSaving, startSaving] = useTransition();
  const [isDeletingAccount, startDeletingAccount] = useTransition();

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceIndexRef = useRef<number | null>(null);

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startSaving(async () => {
      const result = await updateMyProfileAction({
        fullName,
        contactPhone,
        gender,
        heightCm,
        weightKg,
        aoDaiSize,
      });

      if (!result.ok) {
        toast.error(result.error || "Cập nhật thất bại.");
        return;
      }

      toast.success(result.message || "Đã lưu thay đổi.");
      router.refresh();
    });
  }

  function patchUpload(id: number, status: UploadStatus, error?: string) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status, error } : u)));
  }

  /** Compress in parallel (CPU-bound, in browser), upload sequentially (avoids DB write races on photoItems). */
  async function uploadFiles(files: File[], replaceIndex: number | null) {
    const slots = replaceIndex !== null ? 1 : MAX_PHOTOS - photoCount;
    const picked = files.slice(0, slots);
    if (picked.length === 0) {
      toast.info("Hồ sơ đã đủ 4 ảnh. Hãy dùng nút Thay hoặc xóa bớt ảnh.");
      return;
    }
    if (files.length > picked.length) {
      toast.info(`Chỉ còn ${slots} ô trống nên đã bỏ bớt ${files.length - picked.length} ảnh.`);
    }

    setPhotoBusy(true);
    const baseId = Date.now();
    const items: UploadItem[] = picked.map((f, i) => ({
      id: baseId + i,
      name: f.name,
      status: "compressing",
    }));
    setUploads(items);

    const compressed = await Promise.all(
      picked.map(async (file, i) => {
        try {
          const out = await compressImageFile(file);
          patchUpload(items[i].id, "queued");
          return out;
        } catch (err) {
          patchUpload(items[i].id, "error", err instanceof Error ? err.message : "Lỗi xử lý ảnh.");
          return null;
        }
      }),
    );

    let okCount = 0;
    for (let i = 0; i < compressed.length; i += 1) {
      const file = compressed[i];
      if (!file) continue;
      patchUpload(items[i].id, "uploading");
      try {
        const fd = new FormData();
        fd.set("photo", file);
        if (replaceIndex !== null) fd.set("replaceIndex", String(replaceIndex));

        const res = await fetch("/api/staff/photos", { method: "POST", body: fd });
        const data = (await res.json()) as PhotoApiResponse;

        if (!res.ok || !data.ok) {
          patchUpload(items[i].id, "error", data.error || "Không thể tải ảnh lên.");
          continue;
        }
        if (typeof data.photoCount === "number") setPhotoCount(data.photoCount);
        patchUpload(items[i].id, "done");
        okCount += 1;
      } catch {
        patchUpload(items[i].id, "error", "Lỗi kết nối mạng.");
      }
    }

    setPhotoVersion((v) => v + 1);
    setPhotoBusy(false);
    if (okCount > 0) {
      toast.success(`Đã cập nhật ${okCount} ảnh.`);
      router.refresh();
      window.setTimeout(() => setUploads((prev) => prev.filter((u) => u.status === "error")), 2500);
    } else {
      toast.error("Không có ảnh nào được tải lên.");
    }
  }

  async function handleDeletePhoto(index: number) {
    const { confirmed } = await confirmDialog({
      title: "Xóa ảnh này?",
      description: "Ảnh sẽ bị xóa khỏi hồ sơ và khỏi hệ thống lưu trữ.",
      confirmLabel: "Xóa ảnh",
      destructive: true,
    });
    if (!confirmed) return;

    setPhotoBusy(true);
    try {
      const res = await fetch(`/api/staff/photos?index=${index}`, { method: "DELETE" });
      const data = (await res.json()) as PhotoApiResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Không thể xóa ảnh.");
        return;
      }
      if (typeof data.photoCount === "number") setPhotoCount(data.photoCount);
      setPhotoVersion((v) => v + 1);
      toast.success(data.message || "Đã xóa ảnh.");
      router.refresh();
    } catch {
      toast.error("Lỗi kết nối khi xóa ảnh.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSetPrimary(index: number) {
    setPhotoBusy(true);
    try {
      const res = await fetch("/api/staff/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryIndex: index }),
      });
      const data = (await res.json()) as PhotoApiResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Không thể đặt ảnh chính.");
        return;
      }
      setPhotoVersion((v) => v + 1);
      toast.success(data.message || "Đã đặt làm ảnh chính.");
      router.refresh();
    } catch {
      toast.error("Lỗi kết nối mạng.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function triggerReplace(index: number) {
    replaceIndexRef.current = index;
    replaceFileInputRef.current?.click();
  }

  async function handleAnonymizeAccount() {
    const { confirmed } = await confirmDialog({
      title: "Xóa & ẩn danh tài khoản?",
      description:
        "Toàn bộ ảnh cá nhân sẽ bị xóa vĩnh viễn và bạn sẽ bị đăng xuất ngay lập tức. Không thể hoàn tác.",
      confirmLabel: "Xóa tài khoản",
      destructive: true,
    });
    if (!confirmed) return;

    startDeletingAccount(async () => {
      await anonymizeMyAccountAction();
    });
  }

  const photoSrc = (index: number, size: "thumb" | "full") =>
    `/api/photos/${userId}?index=${index}&size=${size}&v=${photoVersion}`;

  return (
    <div className="space-y-6">
      {/* Zalo Avatar Header (distinct from the 4 personal profile photos) */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3.5">
            {zaloAvatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={zaloAvatarUrl}
                alt={zaloName || fullName}
                className="h-12 w-12 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-sm font-bold text-ink">
                {fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-ink">{fullName}</p>
              <p className="text-xs text-ink-secondary">
                Tài khoản Zalo: {zaloName || "Chưa liên kết"} · Avatar Zalo tách riêng với 4 ảnh hồ sơ
                bên dưới
              </p>
            </div>
          </div>
          <Badge variant={userStatus === "ACTIVE" ? "sage" : "warning"}>
            {userStatus === "ACTIVE" ? "Đã xác minh" : "Chờ xác minh"}
          </Badge>
        </CardContent>
      </Card>

      {/* Personal Photo Gallery (Max 4 photos, separate from Avatar) */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ảnh cá nhân ({photoCount}/{MAX_PHOTOS})
          </CardTitle>
          <CardDescription>
            Chọn cùng lúc nhiều ảnh chân dung / toàn thân. Ảnh đầu tiên là <strong>ảnh chính</strong>{" "}
            hiện đầu tiên cho Admin duyệt. Hệ thống tự nén và chống trùng ảnh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: photoCount }).map((_, index) => (
              <div
                key={`${index}-${photoVersion}`}
                className="group relative overflow-hidden rounded-xl border border-line bg-paper"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="relative block aspect-[3/4] w-full overflow-hidden"
                  title="Bấm xem ảnh rõ nét"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoSrc(index, "thumb")}
                    alt={`Ảnh cá nhân ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {index === 0 ? (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-paper">
                      <Star className="h-3 w-3 fill-current" />
                      Ảnh chính
                    </span>
                  ) : null}
                </button>
                <div className="flex items-center justify-between gap-1 border-t border-line bg-surface px-1.5 py-1">
                  {index > 0 ? (
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => void handleSetPrimary(index)}
                      title="Đặt làm ảnh chính"
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-ink hover:bg-sage-soft disabled:opacity-50"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Chính
                    </button>
                  ) : (
                    <span className="px-2 text-[11px] text-ink-secondary">Đang là chính</span>
                  )}
                  <div className="flex items-center">
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => triggerReplace(index)}
                      aria-label="Thay ảnh"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-sage-soft disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={photoBusy || photoCount <= 1}
                      onClick={() => void handleDeletePhoto(index)}
                      aria-label="Xóa ảnh"
                      title={photoCount <= 1 ? "Cần giữ tối thiểu 1 ảnh" : "Xóa ảnh này"}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {photoCount < MAX_PHOTOS ? (
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => addFileInputRef.current?.click()}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-sage-soft/50 p-3 text-center text-xs font-semibold text-ink transition-colors hover:bg-sage-soft disabled:opacity-50"
              >
                <ImagePlus className="h-6 w-6" />
                <span>{photoBusy ? "Đang tải..." : "Thêm ảnh"}</span>
                <span className="text-[11px] font-normal text-ink-secondary">
                  Chọn 1–{MAX_PHOTOS - photoCount} ảnh cùng lúc
                </span>
              </button>
            ) : null}
          </div>

          {uploads.length > 0 ? (
            <ul className="space-y-1.5 rounded-xl border border-line bg-paper p-3 text-xs">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{u.name}</span>
                  <span
                    className={
                      u.status === "error"
                        ? "shrink-0 text-rose-700 dark:text-rose-300"
                        : u.status === "done"
                          ? "shrink-0 font-semibold text-ink"
                          : "shrink-0 text-ink-secondary"
                    }
                  >
                    {u.status === "error" ? (u.error ?? STATUS_LABEL.error) : STATUS_LABEL[u.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <input
            ref={addFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length > 0) void uploadFiles(files, null);
            }}
          />
          <input
            ref={replaceFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              const idx = replaceIndexRef.current;
              e.target.value = "";
              if (f && idx !== null) void uploadFiles([f], idx);
            }}
          />
        </CardContent>
      </Card>

      {/* Editable Personal Info Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân &amp; Số đo</CardTitle>
          <CardDescription>
            Tự cập nhật chiều cao, cân nặng, size áo dài để Admin sắp xếp đội hình chuẩn xác.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-fullName">Họ và tên</Label>
                <Input id="p-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Số điện thoại liên hệ</Label>
                <Input
                  id="p-phone"
                  type="tel"
                  inputMode="numeric"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <div className="flex gap-2">
                  <Chip active={gender === "FEMALE"} onClick={() => setGender("FEMALE")} className="flex-1">
                    Nữ
                  </Chip>
                  <Chip active={gender === "MALE"} onClick={() => setGender("MALE")} className="flex-1">
                    Nam
                  </Chip>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-height">Chiều cao (cm)</Label>
                <Input
                  id="p-height"
                  type="number"
                  inputMode="numeric"
                  min={140}
                  max={210}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-weight">Cân nặng (kg)</Label>
                <Input
                  id="p-weight"
                  type="number"
                  inputMode="numeric"
                  min={35}
                  max={130}
                  placeholder="Tùy chọn"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Size áo dài</Label>
              <div className="flex flex-wrap gap-2">
                {AO_DAI_SIZES.map((s) => (
                  <Chip key={s} active={aoDaiSize === s} onClick={() => setAoDaiSize(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Personal Data Rights per Decree 356/2025/ND-CP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-4 w-4 text-ink" />
            Quyền dữ liệu cá nhân (Nghị định 356/2025/NĐ-CP)
          </CardTitle>
          <CardDescription>
            Bạn có toàn quyền tải bản sao dữ liệu cá nhân hoặc yêu cầu xóa/ẩn danh tài khoản cùng toàn bộ
            ảnh đã tải lên.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href="/api/me/export"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-xs font-semibold text-ink transition-colors hover:bg-sage-soft"
          >
            <Download className="h-4 w-4" />
            Xuất dữ liệu cá nhân (JSON)
          </a>
          {userRole !== "ADMIN" ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingAccount}
              onClick={() => void handleAnonymizeAccount()}
            >
              {isDeletingAccount ? "Đang xóa..." : "Xóa & ẩn danh tài khoản"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {lightboxIndex !== null ? (
        <PhotoLightbox
          count={photoCount}
          index={Math.min(lightboxIndex, photoCount - 1)}
          srcFor={(i) => photoSrc(i, "full")}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  );
}
