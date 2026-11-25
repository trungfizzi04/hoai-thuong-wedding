"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { compressImageFile } from "@/lib/client-image";
import { AO_DAI_SIZES } from "@/lib/validations/auth";

interface OnboardingFormProps {
  defaultFullName: string;
  defaultPhone: string;
}

interface PickedPhoto {
  id: number;
  file: File;
  url: string;
}

const MAX_PHOTOS = 4;

export function OnboardingForm({ defaultFullName, defaultPhone }: OnboardingFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState(defaultFullName);
  const [contactPhone, setContactPhone] = useState(defaultPhone);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [heightCm, setHeightCm] = useState("162");
  const [aoDaiSize, setAoDaiSize] = useState<(typeof AO_DAI_SIZES)[number]>("M");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (raw.length === 0) return;
    setError(null);

    const slots = MAX_PHOTOS - photos.length;
    const picked = raw.slice(0, slots);
    if (raw.length > picked.length) {
      toast.info(`Chỉ chọn tối đa ${MAX_PHOTOS} ảnh, đã bỏ bớt ${raw.length - picked.length} ảnh.`);
    }

    setCompressing(true);
    const results = await Promise.all(
      picked.map(async (file) => {
        try {
          return await compressImageFile(file);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không thể xử lý ảnh này.");
          return null;
        }
      }),
    );
    setCompressing(false);

    const base = Date.now();
    setPhotos((prev) => [
      ...prev,
      ...results.flatMap((file, i) =>
        file ? [{ id: base + i, file, url: URL.createObjectURL(file) }] : [],
      ),
    ]);
  }

  function removePhoto(id: number) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function makePrimary(id: number) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      return target ? [target, ...prev.filter((p) => p.id !== id)] : prev;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (photos.length === 0) {
      setError("Vui lòng chọn ít nhất 1 ảnh cá nhân (chân dung hoặc toàn thân).");
      return;
    }
    if (!consentAccepted) {
      setError("Bạn cần tick đồng ý xử lý dữ liệu cá nhân trước khi hoàn tất.");
      return;
    }

    setSubmitting(true);
    try {
      setProgress("Đang lưu hồ sơ...");
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("contactPhone", contactPhone);
      fd.set("gender", gender);
      fd.set("heightCm", heightCm);
      fd.set("aoDaiSize", aoDaiSize);
      fd.set("consentAccepted", "true");
      fd.set("photo", photos[0].file);

      const res = await fetch("/api/staff/onboarding", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirectTo?: string };

      if (!res.ok || !data.ok) {
        setError(data.error || "Lưu hồ sơ thất bại.");
        setSubmitting(false);
        setProgress(null);
        return;
      }

      // Remaining photos go through the sequential photo endpoint (profile exists now).
      let failed = 0;
      for (let i = 1; i < photos.length; i += 1) {
        setProgress(`Đang tải ảnh ${i + 1}/${photos.length}...`);
        try {
          const pfd = new FormData();
          pfd.set("photo", photos[i].file);
          const pres = await fetch("/api/staff/photos", { method: "POST", body: pfd });
          if (!pres.ok) failed += 1;
        } catch {
          failed += 1;
        }
      }
      if (failed > 0) {
        toast.error(`${failed} ảnh chưa tải được. Bạn có thể thêm lại trong trang Hồ sơ.`);
      } else {
        toast.success("Hồ sơ đã hoàn tất!");
      }

      router.push(data.redirectTo || "/staff");
      router.refresh();
    } catch {
      setError("Lỗi kết nối mạng. Vui lòng thử lại.");
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-blush-strong bg-blush/60 p-3.5 text-sm text-ink-secondary"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">1. Họ và tên</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Văn A"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactPhone">2. Số điện thoại liên hệ (Zalo)</Label>
        <Input
          id="contactPhone"
          type="tel"
          inputMode="numeric"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="0901234567"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>3. Giới tính</Label>
          <div className="flex gap-2">
            <Chip active={gender === "FEMALE"} onClick={() => setGender("FEMALE")} className="flex-1">
              Nữ (nhà gái)
            </Chip>
            <Chip active={gender === "MALE"} onClick={() => setGender("MALE")} className="flex-1">
              Nam (nhà trai)
            </Chip>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="heightCm">4. Chiều cao (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            inputMode="numeric"
            min={140}
            max={210}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>5. Size áo dài</Label>
        <div className="flex flex-wrap gap-2">
          {AO_DAI_SIZES.map((s) => (
            <Chip key={s} active={aoDaiSize === s} onClick={() => setAoDaiSize(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>6. Ảnh cá nhân (chân dung / toàn thân — không phải avatar)</Label>
        <p className="text-xs text-ink-secondary">
          Chọn cùng lúc tối đa {MAX_PHOTOS} ảnh. Ảnh đầu tiên là ảnh chính cho Admin duyệt. Hệ thống tự
          nén nhẹ trước khi tải.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, index) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="relative aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-paper">
                    <Star className="h-3 w-3 fill-current" />
                    Ảnh chính
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between px-1.5 py-1">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(p.id)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-ink hover:bg-sage-soft"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Chính
                  </button>
                ) : (
                  <span className="px-2 text-[11px] text-ink-secondary">Đang là chính</span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Bỏ ảnh"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {photos.length < MAX_PHOTOS ? (
            <label
              htmlFor="photos"
              className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-sage-soft/50 p-3 text-center text-xs font-semibold text-ink transition-colors hover:bg-sage-soft"
            >
              <ImagePlus className="h-6 w-6" />
              <span>{compressing ? "Đang nén..." : "Chọn ảnh"}</span>
              <span className="text-[11px] font-normal text-ink-secondary">
                Chọn nhiều ảnh cùng lúc
              </span>
              <input
                id="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>
          ) : null}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line bg-paper p-3.5 text-xs leading-relaxed text-ink-secondary">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-ink"
          required
        />
        <span>
          Tôi đồng ý cho <strong>Hoài Thương Wedding</strong> thu thập và lưu trữ thông tin cá nhân
          (họ tên, SĐT, số đo, ảnh cá nhân) phục vụ điều phối show bưng quả theo{" "}
          <strong>Luật Bảo vệ dữ liệu cá nhân 2025 &amp; Nghị định 356/2025/NĐ-CP</strong>. Ảnh chỉ
          hiển thị nội bộ cho chính tôi và Quản trị viên; tôi có quyền xuất hoặc yêu cầu xóa dữ liệu
          bất cứ lúc nào.
        </span>
      </label>

      <Button type="submit" className="w-full" size="lg" disabled={submitting || compressing}>
        {submitting ? (progress ?? "Đang lưu hồ sơ...") : "Hoàn tất hồ sơ (1 lần duy nhất)"}
      </Button>
    </form>
  );
}
