import { z } from "zod";

export const AO_DAI_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"] as const;
export const GENDERS = ["MALE", "FEMALE"] as const;

export const vietnamPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9,10}$/, "Số điện thoại phải bắt đầu bằng số 0 và gồm 10–11 chữ số.");

export const loginPasswordSchema = z.object({
  phone: vietnamPhoneSchema,
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự.").max(100),
});

export const activateInvitePasswordSchema = z
  .object({
    token: z.string().min(10, "Mã kích hoạt không hợp lệ."),
    password: z.string().min(6, "Mật khẩu / mã PIN phải có ít nhất 6 ký tự.").max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"],
  });

export const createInvitedStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự.").max(80),
  phone: vietnamPhoneSchema,
});

export const onboardingFieldsSchema = z.object({
  fullName: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự.").max(80),
  contactPhone: vietnamPhoneSchema,
  gender: z.enum(GENDERS, { message: "Vui lòng chọn giới tính." }),
  heightCm: z.coerce
    .number()
    .int("Chiều cao phải là số nguyên.")
    .min(140, "Chiều cao tối thiểu 140 cm.")
    .max(210, "Chiều cao tối đa 210 cm."),
  aoDaiSize: z.enum(AO_DAI_SIZES, { message: "Vui lòng chọn size áo dài." }),
  consentAccepted: z.literal(true, {
    message: "Bạn cần đồng ý điều khoản xử lý dữ liệu cá nhân theo NĐ 356/2025/NĐ-CP.",
  }),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự.").max(80),
  contactPhone: vietnamPhoneSchema,
  gender: z.enum(GENDERS, { message: "Vui lòng chọn giới tính." }),
  heightCm: z.coerce
    .number()
    .int("Chiều cao phải là số nguyên.")
    .min(140, "Chiều cao tối thiểu 140 cm.")
    .max(210, "Chiều cao tối đa 210 cm."),
  weightKg: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Cân nặng phải là số nguyên.")
        .min(35, "Cân nặng tối thiểu 35 kg.")
        .max(130, "Cân nặng tối đa 130 kg."),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  aoDaiSize: z.enum(AO_DAI_SIZES, { message: "Vui lòng chọn size áo dài." }),
});

export type LoginPasswordInput = z.infer<typeof loginPasswordSchema>;
export type CreateInvitedStaffInput = z.infer<typeof createInvitedStaffSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
