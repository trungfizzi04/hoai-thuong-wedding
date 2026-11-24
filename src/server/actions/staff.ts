"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateProfileSchema } from "@/lib/validations/auth";
import {
  clearSessionCookie,
  requireUser,
  revokeAllUserSessions,
} from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { staffProfiles, users } from "@/server/db/schema";
import { deleteAuthenticatedStaffPhoto } from "@/server/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit";

export interface ProfileActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function updateMyProfileAction(input: {
  fullName: string;
  contactPhone: string;
  gender: "MALE" | "FEMALE";
  heightCm: number | string;
  weightKg?: number | string;
  aoDaiSize: "S" | "M" | "L" | "XL" | "XXL" | "3XL";
}): Promise<ProfileActionResult> {
  const auth = await requireUser();
  if (!auth.profile) {
    return { ok: false, error: "Bạn cần hoàn thành hồ sơ ban đầu trước." };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." };
  }

  const db = getDb();
  await db
    .update(staffProfiles)
    .set({
      fullName: parsed.data.fullName,
      contactPhone: parsed.data.contactPhone,
      gender: parsed.data.gender,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      aoDaiSize: parsed.data.aoDaiSize,
      updatedAt: new Date(),
    })
    .where(eq(staffProfiles.userId, auth.user.id));

  await logAuditEvent(db, {
    actorUserId: auth.user.id,
    action: "UPDATE_PROFILE",
    targetType: "USER",
    targetId: auth.user.id,
    metadata: {
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      aoDaiSize: parsed.data.aoDaiSize,
    },
  });

  revalidatePath("/staff");
  revalidatePath("/staff/profile");

  return { ok: true, message: "Đã cập nhật hồ sơ cá nhân thành công." };
}

/**
 * Anonymize & delete personal data per Decree 356/2025/ND-CP:
 * - Permanently deletes all personal photos (up to 4) on Cloudinary
 * - Revokes all active sessions immediately
 * - Anonymizes PII on `users` & `staff_profiles` while keeping anonymized payment/registration records for accounting
 */
export async function anonymizeMyAccountAction() {
  const auth = await requireUser();
  if (auth.user.role === "ADMIN") {
    throw new Error("Tài khoản Quản trị viên không thể tự xóa tại đây.");
  }

  const publicIds = (auth.profile?.photoItems ?? []).map((p) => p.publicId);
  if (
    auth.profile?.primaryPhotoPublicId &&
    !publicIds.includes(auth.profile.primaryPhotoPublicId)
  ) {
    publicIds.push(auth.profile.primaryPhotoPublicId);
  }

  for (const publicId of publicIds) {
    await deleteAuthenticatedStaffPhoto(publicId);
  }

  const db = getDb();
  const anonymizedSuffix = auth.user.id.slice(0, 8);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        loginPhone: null,
        passwordHash: null,
        zaloId: null,
        zaloName: null,
        zaloAvatarUrl: null,
        zaloIsSensitive: null,
        zaloRawProfile: null,
        status: "SUSPENDED",
      })
      .where(eq(users.id, auth.user.id));

    if (auth.profile) {
      await tx
        .update(staffProfiles)
        .set({
          fullName: `Nhân sự đã xóa #${anonymizedSuffix}`,
          contactPhone: "0000000000",
          primaryPhotoPublicId: null,
          photoItems: [],
          weightKg: null,
          encryptedBankInfo: null,
          updatedAt: new Date(),
        })
        .where(eq(staffProfiles.userId, auth.user.id));
    }

    await logAuditEvent(tx, {
      actorUserId: auth.user.id,
      action: "ANONYMIZE_ACCOUNT",
      targetType: "USER",
      targetId: auth.user.id,
      metadata: { deletedPhotosCount: publicIds.length },
    });
  });

  await revokeAllUserSessions(auth.user.id);
  await clearSessionCookie();
  redirect("/login?deleted=1");
}
