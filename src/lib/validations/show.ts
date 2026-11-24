import { z } from "zod";
import { formatVietnamDateTime, formatVnd } from "@/lib/utils";

/**
 * Convert HTML `datetime-local` string ("YYYY-MM-DDTHH:mm") interpreted as Asia/Ho_Chi_Minh (+07:00) into a Date.
 */
export function parseVietnamDateTimeLocal(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) return new Date(NaN);
  // If already includes timezone offset or Z, parse directly
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  return new Date(`${trimmed}:00+07:00`);
}

/**
 * Format a Date into "YYYY-MM-DDTHH:mm" in Asia/Ho_Chi_Minh for HTML `datetime-local` inputs.
 */
export function toVietnamDateTimeLocalInput(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export const showFormSchema = z
  .object({
    title: z.string().trim().min(4, "Tên show tối thiểu 4 ký tự.").max(120),
    gatherAtLocal: z.string().min(10, "Vui lòng chọn giờ có mặt."),
    endAtLocal: z.string().min(10, "Vui lòng chọn giờ kết thúc dự kiến."),
    address: z.string().trim().min(4, "Vui lòng nhập địa chỉ cụ thể.").max(200),
    district: z.string().trim().min(2, "Vui lòng nhập quận/huyện/thành phố.").max(80),
    requiredMale: z.coerce.number().int().min(0, "Số Nam không âm.").max(50),
    requiredFemale: z.coerce.number().int().min(0, "Số Nữ không âm.").max(50),
    wagePerPerson: z.coerce
      .number()
      .int("Cát-xê phải là số nguyên.")
      .min(50000, "Cát-xê tối thiểu 50.000đ.")
      .max(10000000),
    allowanceNote: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : null)),
    dressCode: z.string().trim().min(2, "Vui lòng nhập yêu cầu trang phục.").max(200),
    zaloGroupUrl: z
      .string()
      .trim()
      .max(300)
      .optional()
      .refine((v) => !v || /^https?:\/\//i.test(v), "Link group Zalo phải bắt đầu bằng https://")
      .transform((v) => (v ? v : null)),
    autoCloseWhenFull: z.boolean().default(true),
    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : null)),
    clientName: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v ? v : null)),
    clientPhone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => (v ? v : null)),
    totalRevenue: z
      .union([z.literal(""), z.coerce.number().int().min(0).max(500000000)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .refine((d) => d.requiredMale + d.requiredFemale > 0, {
    message: "Show cần tuyển ít nhất 1 nhân sự (Nam hoặc Nữ).",
    path: ["requiredMale"],
  })
  .refine(
    (d) => {
      const start = parseVietnamDateTimeLocal(d.gatherAtLocal);
      const end = parseVietnamDateTimeLocal(d.endAtLocal);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
    },
    {
      message: "Giờ kết thúc phải sau giờ có mặt.",
      path: ["endAtLocal"],
    },
  );

export type ShowFormValues = z.input<typeof showFormSchema>;

export function buildRecruitShareMessage(params: {
  id: string;
  title: string;
  gatherAt: Date | string;
  district: string;
  requiredMale: number;
  requiredFemale: number;
  approvedMale: number;
  approvedFemale: number;
  wagePerPerson: number;
  allowanceNote: string | null;
  dressCode: string;
  origin: string;
}): string {
  const remainMale = Math.max(0, params.requiredMale - params.approvedMale);
  const remainFemale = Math.max(0, params.requiredFemale - params.approvedFemale);
  const slotParts: string[] = [];
  if (params.requiredMale > 0) slotParts.push(`Nam: còn ${remainMale}/${params.requiredMale}`);
  if (params.requiredFemale > 0) slotParts.push(`Nữ: còn ${remainFemale}/${params.requiredFemale}`);

  const lines = [
    `🌸 TUYỂN BƯNG QUẢ — ${params.title}`,
    `⏰ Có mặt: ${formatVietnamDateTime(params.gatherAt)}`,
    `📍 Khu vực: ${params.district}`,
    `👥 Đội hình: ${slotParts.join(" | ")}`,
    `💰 Cát-xê: ${formatVnd(params.wagePerPerson)}/người${params.allowanceNote ? ` (${params.allowanceNote})` : ""}`,
    `👘 Trang phục: ${params.dressCode}`,
    ``,
    `👉 Bấm link đăng ký 1 chạm (không cần nhắn lại ảnh/size áo):`,
    `${params.origin.replace(/\/+$/, "")}/shows/${params.id}`,
  ];

  return lines.join("\n");
}
