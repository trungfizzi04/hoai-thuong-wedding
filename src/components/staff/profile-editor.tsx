"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Expand,
  ImagePlus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function ProfileEditor({
  userId,
  userRole,
  userStatus,
  zaloName,
  zaloAvatarUrl,
  initialProfile,
}: ProfileEditorProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [contactPhone, setContactPhone] = useState(initialProfile.contactPhone);
  const [gender, setGender] = useState<"MALE" | "FEMALE">(initialProfile.gender);
  const [heightCm, setHeightCm] = useState(String(initialProfile.heightCm));
  const [weightKg, setWeightKg] = useState(
    initialProfile.weightKg !== null ? String(initialProfile.weightKg) : "",
  );
  const [aoDaiSize, setAoDaiSize] = useState<(typeof AO_DAI_SIZES)[number]>(
    initialProfile.aoDaiSize,
  );

  const [photoCount, setPhotoCount] = useState(initialProfile.photoCount);
  const [photoVersion, setPhotoVersion] = useState(1);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [profileNotice, setProfileNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [isSaving, startSaving] = useTransition();
  const [isDeletingAccount, startDeletingAccount] = useTransition();

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceIndexRef = useRef<number | null>(null);

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileNotice(null);

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
        setProfileNotice({ type: "err", text: result.error || "Cập nhật thất bại." });
        return;
      }

      setProfileNotice({ type: "ok", text: result.message || "Đã lưu thay đổi." });
      router.refresh();
    });
  }

  async function uploadPhoto(file: File, replaceIndex: number | null) {
    setPhotoNotice(null);
    setPhotoBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const fd = new FormData();
      fd.set("photo", compressed);
      if (replaceIndex !== null) {
        fd.set("replaceIndex", String(replaceIndex));
      }

      const res = await fetch("/api/staff/photos", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        photoCount?: number;
      };

      if (!res.ok || !data.ok) {
        setPhotoNotice({ type: "err", text: data.error || "Không thể tải ảnh lên." });
        return;
      }

      if (typeof data.photoCount === "number") {
        setPhotoCount(data.photoCount);
      }
      setPhotoVersion((v) => v + 1);
      setPhotoNotice({ type: "ok", text: data.message || "Đã cập nhật ảnh." });
      router.refresh();
    } catch (err) {
      setPhotoNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Lỗi xử lý ảnh.",
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleDeletePhoto(index: number) {
    setPhotoNotice(null);
    setPhotoBusy(true);
    try {
      const res = await fetch(`/api/staff/photos?index=${index}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        photoCount?: number;
      };
      if (!res.ok || !data.ok) {
        setPhotoNotice({ type: "err", text: data.error || "Không thể xóa ảnh." });
        return;
      }
      if (typeof data.photoCount === "number") {
        setPhotoCount(data.photoCount);
      }
      setPhotoVersion((v) => v + 1);
      setPhotoNotice({ type: "ok", text: data.message || "Đã xóa ảnh." });
      router.refresh();
    } catch {
      setPhotoNotice({ type: "err", text: "Lỗi kết nối khi xóa ảnh." });
    } finally {
      setPhotoBusy(false);
    }
  }

  function triggerReplace(index: number) {
    replaceIndexRef.current = index;
    replaceFileInputRef.current?.click();
  }

  function handleAnonymizeAccount() {
    const confirmed = window.confirm(
      "Bạn chắc chắn muốn xóa/ẩn danh tài khoản? Toàn bộ ảnh cá nhân trên Cloudinary sẽ bị xóa vĩnh viễn và bạn sẽ bị đăng xuất ngay lập tức.",
    );
    if (!confirmed) return;

    startDeletingAccount(async () => {
      await anonymizeMyAccountAction();
    });
  }

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
                className="h-12 w-12 rounded-full border border-[#C8D5B9] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8D5B9] text-sm font-bold text-[#3E4A42]">
                {fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#3E4A42]">{fullName}</p>
              <p className="text-xs text-[#4A4242]">
                Tài khoản Zalo: {zaloName || "Chưa liên kết"} · Avatar Zalo tách riêng với 4 ảnh
                hồ sơ bên dưới
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
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Ảnh cá nhân ({photoCount}/{MAX_PHOTOS})</CardTitle>
              <CardDescription className="mt-1">
                Tối đa {MAX_PHOTOS} ảnh chân dung / toàn thân (không phải ảnh avatar). Khi thay
                ảnh mới, ảnh cũ sẽ tự động xóa khỏi Cloudinary và hệ thống tự chống trùng ảnh.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {photoNotice ? (
            <div
              className={
                photoNotice.type === "ok"
                  ? "rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3 text-xs text-[#3E4A42]"
                  : "rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3 text-xs text-[#4A4242]"
              }
            >
              {photoNotice.text}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: photoCount }).map((_, index) => (
              <div
                key={`${index}-${photoVersion}`}
                className="group relative overflow-hidden rounded-2xl border border-[#C8D5B9] bg-[#FAF9F5]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="block aspect-[3/4] w-full overflow-hidden"
                  title="Bấm xem ảnh rõ nét"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photos/${userId}?index=${index}&size=thumb&v=${photoVersion}`}
                    alt={`Ảnh cá nhân ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
                <div className="flex items-center justify-between gap-1 border-t border-[#C8D5B9]/60 bg-white px-2 py-1.5">
                  <button
                    type="button"
                    disabled={photoBusy}
                    onClick={() => triggerReplace(index)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#3E4A42] hover:bg-[#EEF3E8] disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Thay
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    aria-label="Phóng to"
                    className="rounded-lg p-1 text-[#4A4242] hover:bg-[#EEF3E8]"
                  >
                    <Expand className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={photoBusy || photoCount <= 1}
                    onClick={() => handleDeletePhoto(index)}
                    aria-label="Xóa ảnh"
                    title={photoCount <= 1 ? "Cần giữ tối thiểu 1 ảnh" : "Xóa ảnh này"}
                    className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {photoCount < MAX_PHOTOS ? (
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => addFileInputRef.current?.click()}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B7C9B5] bg-[#EEF3E8]/50 p-3 text-center text-xs font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8] disabled:opacity-50"
              >
                <ImagePlus className="h-6 w-6" />
                <span>{photoBusy ? "Đang tải..." : "Thêm ảnh"}</span>
                <span className="text-[11px] font-normal text-[#4A4242]">
                  Còn {MAX_PHOTOS - photoCount} ô
                </span>
              </button>
            ) : null}
          </div>

          <input
            ref={addFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadPhoto(f, null);
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
              if (f && idx !== null) void uploadPhoto(f, idx);
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
            {profileNotice ? (
              <div
                className={
                  profileNotice.type === "ok"
                    ? "rounded-xl border border-[#B7C9B5] bg-[#EEF3E8] p-3 text-xs text-[#3E4A42]"
                    : "rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3 text-xs text-[#4A4242]"
                }
              >
                {profileNotice.text}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-fullName">Họ và tên</Label>
                <Input
                  id="p-fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-gender">Giới tính</Label>
                <select
                  id="p-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                  className="flex h-11 w-full rounded-xl border border-[#C8D5B9] bg-white px-3 text-sm text-[#3E4A42]"
                >
                  <option value="FEMALE">Nữ</option>
                  <option value="MALE">Nam</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-height">Chiều cao (cm)</Label>
                <Input
                  id="p-height"
                  type="number"
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
                  min={35}
                  max={130}
                  placeholder="Tùy chọn"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-size">Size áo dài</Label>
                <select
                  id="p-size"
                  value={aoDaiSize}
                  onChange={(e) => setAoDaiSize(e.target.value as (typeof AO_DAI_SIZES)[number])}
                  className="flex h-11 w-full rounded-xl border border-[#C8D5B9] bg-white px-3 text-sm text-[#3E4A42]"
                >
                  {AO_DAI_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-[#3E4A42]" />
            Quyền dữ liệu cá nhân (Nghị định 356/2025/NĐ-CP)
          </CardTitle>
          <CardDescription>
            Bạn có toàn quyền tải bản sao dữ liệu cá nhân hoặc yêu cầu xóa/ẩn danh tài khoản cùng
            toàn bộ ảnh đã tải lên.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a
            href="/api/me/export"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#B7C9B5] bg-white px-4 text-xs font-semibold text-[#3E4A42] transition-colors hover:bg-[#EEF3E8]"
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
              onClick={handleAnonymizeAccount}
            >
              {isDeletingAccount ? "Đang xóa..." : "Xóa & ẩn danh tài khoản"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Full-resolution Lightbox */}
      {lightboxIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-h-[90vh] max-w-xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Đóng"
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#3E4A42] shadow"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${userId}?index=${lightboxIndex}&size=full&v=${photoVersion}`}
              alt={`Ảnh cá nhân ${lightboxIndex + 1}`}
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-xl"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
