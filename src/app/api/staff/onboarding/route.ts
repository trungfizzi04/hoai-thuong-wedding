import { NextResponse } from "next/server";
import { onboardingFieldsSchema } from "@/lib/validations/auth";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { staffProfiles, type StaffPhotoItem } from "@/server/db/schema";
import {
  computeBufferSha256,
  deleteAuthenticatedStaffPhoto,
  isCloudinaryConfigured,
  MAX_PHOTO_BYTES,
  uploadAuthenticatedStaffPhoto,
} from "@/server/lib/cloudinary";
import { logAuditEvent } from "@/server/services/audit";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const parsed = onboardingFieldsSchema.safeParse({
      fullName: formData.get("fullName"),
      contactPhone: formData.get("contactPhone"),
      gender: formData.get("gender"),
      heightCm: formData.get("heightCm"),
      aoDaiSize: formData.get("aoDaiSize"),
      consentAccepted: formData.get("consentAccepted") === "true",
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Thông tin hồ sơ chưa hợp lệ.";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const photoFile = formData.get("photo");
    let nextPhotoItems: StaffPhotoItem[] = auth.profile?.photoItems ?? [];

    if (photoFile instanceof File && photoFile.size > 0) {
      if (!ALLOWED_MIME_TYPES.has(photoFile.type)) {
        return NextResponse.json(
          { error: "Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP." },
          { status: 400 },
        );
      }
      if (photoFile.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "Ảnh quá lớn (tối đa 5 MB). Vui lòng chọn ảnh nhẹ hơn." },
          { status: 400 },
        );
      }
      if (!isCloudinaryConfigured()) {
        return NextResponse.json(
          { error: "Hệ thống lưu trữ ảnh Cloudinary chưa được cấu hình." },
          { status: 503 },
        );
      }

      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const hash = computeBufferSha256(buffer);
      const alreadyExists = nextPhotoItems.some((item) => item.hash === hash);

      if (!alreadyExists) {
        const { publicId } = await uploadAuthenticatedStaffPhoto(buffer, auth.user.id);
        const previousFirst = nextPhotoItems[0];
        if (previousFirst) {
          nextPhotoItems = [{ publicId, hash }, ...nextPhotoItems.slice(1)];
          await deleteAuthenticatedStaffPhoto(previousFirst.publicId);
        } else {
          nextPhotoItems = [{ publicId, hash }];
        }
      }
    } else if (nextPhotoItems.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng tải lên ít nhất 1 ảnh cá nhân (chân dung hoặc toàn thân)." },
        { status: 400 },
      );
    }

    const db = getDb();
    const now = new Date();
    const primaryPhotoPublicId = nextPhotoItems[0]?.publicId ?? null;

    await db
      .insert(staffProfiles)
      .values({
        userId: auth.user.id,
        fullName: parsed.data.fullName,
        contactPhone: parsed.data.contactPhone,
        gender: parsed.data.gender,
        heightCm: parsed.data.heightCm,
        aoDaiSize: parsed.data.aoDaiSize,
        primaryPhotoPublicId,
        photoItems: nextPhotoItems,
        consentAcceptedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: staffProfiles.userId,
        set: {
          fullName: parsed.data.fullName,
          contactPhone: parsed.data.contactPhone,
          gender: parsed.data.gender,
          heightCm: parsed.data.heightCm,
          aoDaiSize: parsed.data.aoDaiSize,
          primaryPhotoPublicId,
          photoItems: nextPhotoItems,
          consentAcceptedAt: now,
          updatedAt: now,
        },
      });

    await logAuditEvent(db, {
      actorUserId: auth.user.id,
      action: "COMPLETE_ONBOARDING",
      targetType: "USER",
      targetId: auth.user.id,
      metadata: {
        gender: parsed.data.gender,
        aoDaiSize: parsed.data.aoDaiSize,
        photoCount: nextPhotoItems.length,
      },
    });

    return NextResponse.json({ ok: true, redirectTo: "/staff" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không thể lưu hồ sơ. Vui lòng thử lại.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
