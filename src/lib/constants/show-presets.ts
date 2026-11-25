export interface ShiftPreset {
  id: string;
  label: string;
  start: string;
  end: string;
}

export const SHIFT_PRESETS: ShiftPreset[] = [
  { id: "early", label: "Sáng sớm 06:00–10:00", start: "06:00", end: "10:00" },
  { id: "morning", label: "Sáng 06:30–10:30", start: "06:30", end: "10:30" },
  { id: "late-morning", label: "Sáng 07:00–11:00", start: "07:00", end: "11:00" },
  { id: "afternoon", label: "Chiều 13:30–17:30", start: "13:30", end: "17:30" },
];

export const TRAY_COUNTS = [5, 6, 7, 9] as const;

export type TraySide = "groom" | "bride" | "both";

export const TRAY_SIDES: { id: TraySide; label: string }[] = [
  { id: "groom", label: "Nhà trai (Nam)" },
  { id: "bride", label: "Nhà gái (Nữ)" },
  { id: "both", label: "Cả 2 bên (Nam + Nữ)" },
];

/** Maps tray count + side to Male/Female slots. */
export function slotsForFormation(trays: number, side: TraySide): { male: number; female: number } {
  if (side === "groom") return { male: trays, female: 0 };
  if (side === "bride") return { male: 0, female: trays };
  return { male: trays, female: trays };
}

export const WAGE_PRESETS = [250000, 300000, 350000, 400000, 500000] as const;

export const ALLOWANCE_PRESETS = ["Bao ăn sáng", "Nước suối", "Xăng xe 30k", "Gửi xe", "Hỗ trợ makeup"] as const;

export const DEFAULT_DRESS_CODE = "Áo dài truyền thống (shop phát), giày tây/cao gót gọn gàng";

export const DRESS_CODE_PRESETS = [
  DEFAULT_DRESS_CODE,
  "Áo dài đỏ truyền thống",
  "Áo dài hồng phấn pastel",
  "Áo dài trắng kem",
  "Áo dài xanh sage",
  "Áo dài vàng đồng",
] as const;

export const CUSTOM_DRESS_CODE_VALUE = "__custom__";
