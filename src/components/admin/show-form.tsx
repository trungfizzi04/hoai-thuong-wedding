"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPicker } from "@/components/ui/location-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/components/ui/toast";
import {
  ALLOWANCE_PRESETS,
  CUSTOM_DRESS_CODE_VALUE,
  DEFAULT_DRESS_CODE,
  DRESS_CODE_PRESETS,
  SHIFT_PRESETS,
  slotsForFormation,
  TRAY_COUNTS,
  TRAY_SIDES,
  WAGE_PRESETS,
  type TraySide,
} from "@/lib/constants/show-presets";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";
import { buildRecruitShareMessage, parseVietnamDateTimeLocal } from "@/lib/validations/show";
import { createShowAction, updateShowAction } from "@/server/actions/admin-shows";

export interface ShowFormInitialData {
  id?: string;
  title: string;
  gatherAtLocal: string;
  endAtLocal: string;
  address: string;
  district: string;
  requiredMale: number;
  requiredFemale: number;
  wagePerPerson: number;
  allowanceNote: string;
  dressCode: string;
  zaloGroupUrl: string;
  autoCloseWhenFull: boolean;
  notes: string;
  clientName: string;
  clientPhone: string;
  totalRevenue: string;
}

const textareaClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong";

function Section({ index, title, hint, children }: { index: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-ink">
          <span className="mr-2 text-ink-secondary">{index}.</span>
          {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-ink-secondary">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function toggleListItem(list: string, item: string): string {
  const items = list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const next = items.includes(item) ? items.filter((i) => i !== item) : [...items, item];
  return next.join(", ");
}

export function ShowForm({ initialData }: { initialData?: ShowFormInitialData }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [date, setDate] = useState(initialData?.gatherAtLocal.slice(0, 10) ?? "");
  const [startTime, setStartTime] = useState(initialData?.gatherAtLocal.slice(11, 16) ?? "");
  const [endDate, setEndDate] = useState(initialData?.endAtLocal.slice(0, 10) ?? "");
  const [endTime, setEndTime] = useState(initialData?.endAtLocal.slice(11, 16) ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [district, setDistrict] = useState(initialData?.district ?? "");
  const [requiredMale, setRequiredMale] = useState(String(initialData?.requiredMale ?? 6));
  const [requiredFemale, setRequiredFemale] = useState(String(initialData?.requiredFemale ?? 0));
  const [trayCount, setTrayCount] = useState<number | null>(null);
  const [traySide, setTraySide] = useState<TraySide>("groom");
  const [wagePerPerson, setWagePerPerson] = useState(String(initialData?.wagePerPerson ?? 350000));
  const [allowanceNote, setAllowanceNote] = useState(initialData?.allowanceNote ?? "");
  const [dressCode, setDressCode] = useState(initialData?.dressCode ?? DEFAULT_DRESS_CODE);
  const [zaloGroupUrl, setZaloGroupUrl] = useState(initialData?.zaloGroupUrl ?? "");
  const [autoCloseWhenFull, setAutoCloseWhenFull] = useState(initialData?.autoCloseWhenFull ?? true);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [clientName, setClientName] = useState(initialData?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone ?? "");
  const [totalRevenue, setTotalRevenue] = useState(initialData?.totalRevenue ?? "");

  const [error, setError] = useState<string | null>(null);
  const [districtMissing, setDistrictMissing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const gatherAtLocal = date && startTime ? `${date}T${startTime}` : "";
  const endAtLocal = endDate && endTime ? `${endDate}T${endTime}` : "";

  const maleNum = Number(requiredMale) || 0;
  const femaleNum = Number(requiredFemale) || 0;
  const wageNum = Number(wagePerPerson) || 0;
  const totalStaff = maleNum + femaleNum;
  const estPayroll = totalStaff * wageNum;
  const revNum = totalRevenue ? Number(totalRevenue) : null;
  const estProfit = revNum !== null && !Number.isNaN(revNum) ? revNum - estPayroll : null;

  const dressOptions = useMemo(
    () => [
      ...DRESS_CODE_PRESETS.map((d) => ({ value: d, label: d })),
      { value: CUSTOM_DRESS_CODE_VALUE, label: "Khác (nhập tay)..." },
    ],
    [],
  );
  const dressSelectValue = (DRESS_CODE_PRESETS as readonly string[]).includes(dressCode)
    ? dressCode
    : CUSTOM_DRESS_CODE_VALUE;

  function applyFormation(trays: number, side: TraySide) {
    setTrayCount(trays);
    setTraySide(side);
    const { male, female } = slotsForFormation(trays, side);
    setRequiredMale(String(male));
    setRequiredFemale(String(female));
  }

  function onDateChange(value: string) {
    setDate(value);
    setEndDate(value);
  }

  const gatherDate = gatherAtLocal ? parseVietnamDateTimeLocal(gatherAtLocal) : null;
  const previewValid = gatherDate !== null && !Number.isNaN(gatherDate.getTime());
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const zaloPreview =
    previewValid && gatherDate
      ? buildRecruitShareMessage({
          id: "(mã show sau khi tạo)",
          title: title || "Tên show",
          gatherAt: gatherDate,
          district: district || "Khu vực",
          requiredMale: maleNum,
          requiredFemale: femaleNum,
          approvedMale: 0,
          approvedFemale: 0,
          wagePerPerson: wageNum,
          allowanceNote: allowanceNote || null,
          dressCode: dressCode || "—",
          origin: appOrigin || "https://…",
        })
      : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (district.trim().length < 2) {
      setDistrictMissing(true);
      const msg = "Vui lòng chọn đầy đủ Tỉnh/TP & Phường/Xã (hoặc nhập tay khu vực).";
      setError(msg);
      toast.error(msg);
      document.getElementById("show-location-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setDistrictMissing(false);

    const payload = {
      title,
      gatherAtLocal,
      endAtLocal,
      address,
      district,
      requiredMale: Number(requiredMale),
      requiredFemale: Number(requiredFemale),
      wagePerPerson: Number(wagePerPerson),
      allowanceNote,
      dressCode,
      zaloGroupUrl,
      autoCloseWhenFull,
      notes,
      clientName,
      clientPhone,
      totalRevenue: totalRevenue.trim() === "" ? "" : Number(totalRevenue),
    };

    startTransition(async () => {
      const res =
        isEdit && initialData?.id
          ? await updateShowAction(initialData.id, payload)
          : await createShowAction(payload);

      if (!res.ok) {
        const message = res.error || "Không thể lưu thông tin show.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success(isEdit ? "Đã lưu thay đổi show." : "Đã tạo show và mở tuyển.");
      router.push("/admin/shows");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        {error ? (
          <div role="alert" className="rounded-xl border border-blush-strong bg-blush/60 p-4 text-sm text-ink">
            {error}
          </div>
        ) : null}

        <Section index={1} title="Thời gian & địa điểm" hint="Giờ theo múi giờ Việt Nam (GMT+7).">
          <Field label="Tên show bưng quả" htmlFor="s-title">
            <Input
              id="s-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đám hỏi nhà trai — 6 tráp (Quận 7)"
              required
            />
          </Field>

          <div className="space-y-3">
            <Field label="Ngày diễn ra" htmlFor="s-date">
              <Input id="s-date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Chọn nhanh ca giờ</p>
              <div className="flex flex-wrap gap-2">
                {SHIFT_PRESETS.map((s) => (
                  <Chip
                    key={s.id}
                    active={startTime === s.start && endTime === s.end}
                    onClick={() => {
                      setStartTime(s.start);
                      setEndTime(s.end);
                    }}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Giờ có mặt" htmlFor="s-start">
                <Input id="s-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </Field>
              <Field label="Giờ kết thúc dự kiến" htmlFor="s-endtime">
                <Input id="s-endtime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </Field>
            </div>
          </div>

          <Field label="Địa chỉ tập trung (số nhà, đường)" htmlFor="s-address">
            <Input
              id="s-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Huệ"
              required
            />
          </Field>
          <div
            id="show-location-picker"
            className={
              districtMissing
                ? "space-y-1.5 rounded-xl border border-blush-strong bg-blush/20 p-3"
                : "space-y-1.5"
            }
          >
            <Label>Khu vực (Tỉnh / Quận / Phường)</Label>
            <LocationPicker
              value={district}
              onChange={(v) => {
                setDistrict(v);
                if (v.trim().length >= 2) setDistrictMissing(false);
              }}
            />
            {districtMissing ? (
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Vui lòng chọn xong Phường/Xã (hoặc chuyển sang Nhập tay).
              </p>
            ) : null}
          </div>
        </Section>

        <Section index={2} title="Đội hình & trang phục">
          <div className="space-y-3">
            <p className="text-sm font-medium">Chọn nhanh số tráp</p>
            <div className="flex flex-wrap gap-2">
              {TRAY_COUNTS.map((n) => (
                <Chip key={n} active={trayCount === n} onClick={() => applyFormation(n, traySide)}>
                  {n} tráp
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAY_SIDES.map((s) => (
                <Chip
                  key={s.id}
                  active={traySide === s.id}
                  onClick={() => (trayCount ? applyFormation(trayCount, s.id) : setTraySide(s.id))}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slot Nam" htmlFor="s-male">
              <Input id="s-male" type="number" inputMode="numeric" min={0} max={50} value={requiredMale} onChange={(e) => setRequiredMale(e.target.value)} required />
            </Field>
            <Field label="Slot Nữ" htmlFor="s-female">
              <Input id="s-female" type="number" inputMode="numeric" min={0} max={50} value={requiredFemale} onChange={(e) => setRequiredFemale(e.target.value)} required />
            </Field>
          </div>

          <Field label="Yêu cầu trang phục" htmlFor="s-dress">
            <SearchableSelect
              id="s-dress"
              options={dressOptions}
              value={dressSelectValue}
              onChange={(v) => setDressCode(v === CUSTOM_DRESS_CODE_VALUE ? "" : v)}
              searchPlaceholder="Tìm trang phục..."
            />
          </Field>
          {dressSelectValue === CUSTOM_DRESS_CODE_VALUE ? (
            <Input value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Nhập yêu cầu trang phục" required />
          ) : null}

          <Field label="Ghi chú thêm (chiều cao, giờ giấc...)" htmlFor="s-notes">
            <textarea
              id="s-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nam cao từ 1m70, Nữ từ 1m58, đúng giờ có mặt thay áo dài."
              className={textareaClass}
            />
          </Field>
        </Section>

        <Section index={3} title="Cát-xê & phụ cấp">
          <div className="space-y-3">
            <p className="text-sm font-medium">Cát-xê / người</p>
            <div className="flex flex-wrap gap-2">
              {WAGE_PRESETS.map((w) => (
                <Chip key={w} active={wageNum === w} onClick={() => setWagePerPerson(String(w))}>
                  {w / 1000}k
                </Chip>
              ))}
            </div>
            <Input type="number" inputMode="numeric" min={50000} step={10000} value={wagePerPerson} onChange={(e) => setWagePerPerson(e.target.value)} required aria-label="Cát-xê / người (VNĐ)" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Phụ cấp (bấm để bật / tắt)</p>
            <div className="flex flex-wrap gap-2">
              {ALLOWANCE_PRESETS.map((a) => (
                <Chip
                  key={a}
                  active={allowanceNote.split(",").map((s) => s.trim()).includes(a)}
                  onClick={() => setAllowanceNote((cur) => toggleListItem(cur, a))}
                >
                  {a}
                </Chip>
              ))}
            </div>
            <Input value={allowanceNote} onChange={(e) => setAllowanceNote(e.target.value)} placeholder="Hoặc tự nhập phụ cấp khác" maxLength={200} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={autoCloseWhenFull} onChange={(e) => setAutoCloseWhenFull(e.target.checked)} className="h-4 w-4 accent-ink" />
            Tự động chuyển sang Đủ người (FULL) khi duyệt đủ slot
          </label>
        </Section>

        <Section index={4} title="Zalo & khách hàng" hint="Link Zalo chỉ hiện cho nhân sự đã duyệt. Thông tin khách và doanh thu chỉ Admin thấy.">
          <Field label="Link group Zalo riêng của show (tùy chọn)" htmlFor="s-zalo">
            <Input id="s-zalo" type="url" value={zaloGroupUrl} onChange={(e) => setZaloGroupUrl(e.target.value)} placeholder="https://zalo.me/g/..." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tên cô dâu / chú rể" htmlFor="s-client">
              <Input id="s-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Chỉ Admin thấy" />
            </Field>
            <Field label="SĐT khách hàng" htmlFor="s-client-phone">
              <Input id="s-client-phone" inputMode="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Chỉ Admin thấy" />
            </Field>
            <Field label="Doanh thu show (VNĐ)" htmlFor="s-rev">
              <Input id="s-rev" type="number" inputMode="numeric" min={0} step={50000} value={totalRevenue} onChange={(e) => setTotalRevenue(e.target.value)} placeholder="Để tính lợi nhuận" />
            </Field>
          </div>
        </Section>

        <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo show & mở tuyển"}
          </Button>
          <Link
            href="/admin/shows"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-ink hover:bg-sage-soft"
          >
            Hủy
          </Link>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-secondary">Xem trước thẻ show</p>
          <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">{title || "Tên show"}</h3>
          <p className="mt-2 text-lg font-bold tabular-nums text-ink">
            {previewValid && gatherDate ? formatVietnamDateTime(gatherDate) : "Chưa chọn giờ"}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-secondary">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {district || "Chưa chọn khu vực"}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users className="h-4 w-4" />
              Nam {maleNum} · Nữ {femaleNum}
            </span>
            <strong className="text-base tabular-nums">{formatVnd(wageNum)}</strong>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-sage-soft p-5 text-sm">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-secondary">Dự toán</p>
          <p className="mt-2 tabular-nums">
            Chi cát-xê ({totalStaff} người): <strong>{formatVnd(estPayroll)}</strong>
          </p>
          {estProfit !== null ? (
            <p className="mt-1 tabular-nums">
              Lợi nhuận dự kiến:{" "}
              <strong className={estProfit >= 0 ? "" : "text-rose-700 dark:text-rose-300"}>{formatVnd(estProfit)}</strong>
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-secondary">Tin tuyển gửi Zalo</p>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink">
            {zaloPreview ?? "Chọn ngày và giờ để xem bản tin."}
          </pre>
        </div>
      </aside>
    </form>
  );
}
