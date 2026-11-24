"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVnd } from "@/lib/utils";
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

export function ShowForm({ initialData }: { initialData?: ShowFormInitialData }) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [gatherAtLocal, setGatherAtLocal] = useState(initialData?.gatherAtLocal ?? "");
  const [endAtLocal, setEndAtLocal] = useState(initialData?.endAtLocal ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [district, setDistrict] = useState(initialData?.district ?? "");
  const [requiredMale, setRequiredMale] = useState(String(initialData?.requiredMale ?? 6));
  const [requiredFemale, setRequiredFemale] = useState(String(initialData?.requiredFemale ?? 0));
  const [wagePerPerson, setWagePerPerson] = useState(String(initialData?.wagePerPerson ?? 350000));
  const [allowanceNote, setAllowanceNote] = useState(initialData?.allowanceNote ?? "");
  const [dressCode, setDressCode] = useState(
    initialData?.dressCode ?? "Áo dài truyền thống (shop phát), giày tây/cao gót gọn gàng",
  );
  const [zaloGroupUrl, setZaloGroupUrl] = useState(initialData?.zaloGroupUrl ?? "");
  const [autoCloseWhenFull, setAutoCloseWhenFull] = useState(
    initialData?.autoCloseWhenFull ?? true,
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [clientName, setClientName] = useState(initialData?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone ?? "");
  const [totalRevenue, setTotalRevenue] = useState(initialData?.totalRevenue ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalStaff = (Number(requiredMale) || 0) + (Number(requiredFemale) || 0);
  const estPayroll = totalStaff * (Number(wagePerPerson) || 0);
  const revNum = totalRevenue ? Number(totalRevenue) : null;
  const estProfit = revNum !== null && !Number.isNaN(revNum) ? revNum - estPayroll : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

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
        setError(res.error || "Không thể lưu thông tin show.");
        return;
      }

      router.push("/admin/shows");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[#E8B4B8] bg-[#F4D6D6]/60 p-4 text-sm text-[#4A4242]"
        >
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Thông tin tuyển dụng (Hiển thị công khai cho nhân sự)</CardTitle>
          <CardDescription>
            Giờ có mặt &amp; kết thúc tính theo giờ Việt Nam (GMT+7).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-title">Tên show bưng quả</Label>
            <Input
              id="s-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đám hỏi nhà trai — 6 tráp (Quận Hải Châu)"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-gather">Giờ có mặt</Label>
              <Input
                id="s-gather"
                type="datetime-local"
                value={gatherAtLocal}
                onChange={(e) => setGatherAtLocal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-end">Giờ kết thúc dự kiến</Label>
              <Input
                id="s-end"
                type="datetime-local"
                value={endAtLocal}
                onChange={(e) => setEndAtLocal(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-address">Địa chỉ tập trung</Label>
              <Input
                id="s-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, phường/xã"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-district">Quận / Huyện / Thành phố</Label>
              <Input
                id="s-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Ví dụ: Quận Hải Châu, Đà Nẵng"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-male">Slot Nam cần tuyển</Label>
              <Input
                id="s-male"
                type="number"
                min={0}
                max={50}
                value={requiredMale}
                onChange={(e) => setRequiredMale(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-female">Slot Nữ cần tuyển</Label>
              <Input
                id="s-female"
                type="number"
                min={0}
                max={50}
                value={requiredFemale}
                onChange={(e) => setRequiredFemale(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <Label htmlFor="s-wage">Cát-xê / người (VNĐ)</Label>
              <Input
                id="s-wage"
                type="number"
                min={50000}
                step={10000}
                value={wagePerPerson}
                onChange={(e) => setWagePerPerson(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-allowance">Phụ cấp (tùy chọn)</Label>
              <Input
                id="s-allowance"
                value={allowanceNote}
                onChange={(e) => setAllowanceNote(e.target.value)}
                placeholder="VD: Bao ăn sáng, hỗ trợ xăng 30k"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-dress">Yêu cầu trang phục</Label>
              <Input
                id="s-dress"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-notes">Ghi chú yêu cầu thêm (chiều cao, giờ giấc...)</Label>
            <textarea
              id="s-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nam cao từ 1m70, Nữ từ 1m58, đúng giờ có mặt thay áo dài."
              className="w-full rounded-xl border border-[#C8D5B9] bg-white px-3.5 py-2.5 text-sm text-[#3E4A42] placeholder:text-[#4A4242]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7C9B5]"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-[#3E4A42]">
            <input
              type="checkbox"
              checked={autoCloseWhenFull}
              onChange={(e) => setAutoCloseWhenFull(e.target.checked)}
              className="h-4 w-4 accent-[#3E4A42]"
            />
            Tự động chuyển trạng thái Đủ người (FULL) khi đã duyệt đủ slot Nam &amp; Nữ
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Cầu nối Zalo &amp; Thông tin Khách hàng (Bảo mật)</CardTitle>
          <CardDescription>
            Link group Zalo chỉ hiện cho nhân sự đã được duyệt. Thông tin cô dâu/chú rể &amp; doanh
            thu chỉ Admin thấy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-zalo">Link group Zalo riêng của show (tùy chọn)</Label>
            <Input
              id="s-zalo"
              type="url"
              value={zaloGroupUrl}
              onChange={(e) => setZaloGroupUrl(e.target.value)}
              placeholder="https://zalo.me/g/..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-client">Tên cô dâu / chú rể</Label>
              <Input
                id="s-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Chỉ Admin thấy"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-client-phone">SĐT khách hàng</Label>
              <Input
                id="s-client-phone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Chỉ Admin thấy"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-rev">Tổng doanh thu show (VNĐ)</Label>
              <Input
                id="s-rev"
                type="number"
                min={0}
                step={50000}
                value={totalRevenue}
                onChange={(e) => setTotalRevenue(e.target.value)}
                placeholder="Để tính lợi nhuận"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EEF3E8] p-4 text-xs text-[#3E4A42]">
            <span>
              Tổng chi cát-xê dự kiến ({totalStaff} người): <strong>{formatVnd(estPayroll)}</strong>
            </span>
            {estProfit !== null ? (
              <span>
                Lợi nhuận dự kiến:{" "}
                <strong className={estProfit >= 0 ? "text-[#3E4A42]" : "text-rose-700"}>
                  {formatVnd(estProfit)}
                </strong>
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi Show" : "Tạo Show & Mở tuyển ngay"}
        </Button>
        <Link
          href="/admin/shows"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#B7C9B5] bg-white px-5 text-sm font-semibold text-[#3E4A42] hover:bg-[#EEF3E8]"
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
