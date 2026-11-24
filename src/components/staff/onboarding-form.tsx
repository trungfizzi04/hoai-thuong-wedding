"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImageFile } from "@/lib/client-image";
import { AO_DAI_SIZES } from "@/lib/validations/auth";

interface OnboardingFormProps {
  defaultFullName: string;
  defaultPhone: string;
}

export function OnboardingForm({ defaultFullName, defaultPhone }: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [contactPhone, setContactPhone] = useState(defaultPhone);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [heightCm, setHeightCm] = useState("162");
  const [aoDaiSize, setAoDaiSize] = useState<(typeof AO_DAI_SIZES)[number]>("M");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setError(null);
    try {
      const compressed = await compressImageFile(raw);
      setPhotoFile(compressed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xử lý ảnh này.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!photoFile) {
      setError("Vui lòng chọn 1 ảnh cá nhân (chân dung hoặc toàn thân).");
      return;
    }
    if (!consentAccepted) {
      setError("Bạn cần tick đồng ý xử lý dữ liệu cá nhân trước khi hoàn tất.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("contactPhone", contactPhone);
      fd.set("gender", gender);
      fd.set("heightCm", heightCm);
      fd.set("aoDaiSize", aoDaiSize);
      fd.set("consentAccepted", "true");
      fd.set("photo", photoFile);

      const res = await fetch("/api/staff/onboarding", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirectTo?: string };

      if (!res.ok || !data.ok) {
        setError(data.error || "Lưu hồ sơ thất bại.");
        setSubmitting(false);
        return;
      }

      router.push(data.redirectTo || "/staff");
      router.refresh();
    } catch {
      setError("Lỗi kết nối mạng. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-3.5 text-sm text-[#4A4242]"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="gender">3. Giới tính</Label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
            className="flex h-11 w-full rounded-xl border border-[#C8D5B9] bg-white px-3 text-sm text-[#3E4A42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7C9B5]"
          >
            <option value="FEMALE">Nữ (nhà gái)</option>
            <option value="MALE">Nam (nhà trai)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="heightCm">4. Chiều cao (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            min={140}
            max={210}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aoDaiSize">5. Size áo dài</Label>
        <select
          id="aoDaiSize"
          value={aoDaiSize}
          onChange={(e) => setAoDaiSize(e.target.value as (typeof AO_DAI_SIZES)[number])}
          className="flex h-11 w-full rounded-xl border border-[#C8D5B9] bg-white px-3 text-sm text-[#3E4A42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7C9B5]"
        >
          {AO_DAI_SIZES.map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">6. Ảnh cá nhân (chân dung / toàn thân — không phải avatar)</Label>
        <p className="text-xs text-[#4A4242]/80">
          Hệ thống tự nén nhẹ WebP sắc nét. Sau khi vào trang Hồ sơ bạn có thể tải thêm tối đa 4
          ảnh.
        </p>
        <label
          htmlFor="photo"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B7C9B5] bg-[#EEF3E8]/50 p-5 text-center transition-colors hover:bg-[#EEF3E8]"
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Xem trước ảnh cá nhân"
              className="max-h-56 rounded-xl object-contain shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#4A4242]">
              <Upload className="h-6 w-6 text-[#3E4A42]" />
              <span className="text-sm font-medium text-[#3E4A42]">Bấm để chọn ảnh từ điện thoại</span>
              <span className="text-xs">JPG, PNG, WebP (tự nén gọn trước khi tải)</span>
            </div>
          )}
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-[#C8D5B9] bg-[#FAF9F5] p-3.5 text-xs leading-relaxed text-[#4A4242]">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#3E4A42]"
          required
        />
        <span>
          Tôi đồng ý cho <strong>Hoài Thương Wedding</strong> thu thập và lưu trữ thông tin cá nhân
          (họ tên, SĐT, số đo, ảnh cá nhân) phục vụ điều phối show bưng quả theo{" "}
          <strong>Luật Bảo vệ dữ liệu cá nhân 2025 &amp; Nghị định 356/2025/NĐ-CP</strong>. Ảnh chỉ
          hiển thị nội bộ cho chính tôi và Quản trị viên; tôi có quyền xuất hoặc yêu cầu xóa dữ
          liệu bất cứ lúc nào.
        </span>
      </label>

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "Đang nén & lưu hồ sơ..." : "Hoàn tất hồ sơ (1 lần duy nhất)"}
      </Button>
    </form>
  );
}
