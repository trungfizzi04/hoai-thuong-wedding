import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { staffProfiles, type StaffPhotoItem } from "@/server/db/schema";
import {
  computeBufferSha256,
  deleteAuthenticatedStaffPhoto,
  isCloudinaryConfigured,
  MAX_PHOTO_BYTES,
  MAX_STAFF_PHOTOS,
  uploadAuthenticatedStaffPhoto,
} from "@/server/lib/cloudinary";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/staff/photos
 * - Supports adding a new photo (up to MAX_STAFF_PHOTOS = 4) OR replacing slot `replaceIndex` (0..3).
 * - Deduplicates via SHA-256 hash so identical photos are never duplicated on Cloudinary.
 * - Always deletes the replaced photo from Cloudinary after DB update succeeds.
 */
export async function POST(request: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });
  }
  if (!auth.profile) {
    return NextResponse.json({ error: "Bạn cần hoàn thành hồ sơ trước khi tải ảnh." }, { status: 400 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary chưa được cấu hình." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const photoFile = formData.get("photo");
    const replaceIndexRaw = formData.get("replaceIndex");

    if (!(photoFile instanceof File) || photoFile.size === 0) {
      return NextResponse.json({ error: "Vui lòng chọn tệp ảnh hợp lệ." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(photoFile.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ định dạng JPG, PNG hoặc WebP." },
        { status: 400 },
      );
    }
    if (photoFile.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Kích thước ảnh tối đa là 5 MB." }, { status: 400 });
    }

    const currentItems: StaffPhotoItem[] = [...(auth.profile.photoItems ?? [])];
    const replaceIndex =
      typeof replaceIndexRaw === "string" && replaceIndexRaw.trim() !== ""
        ? Number.parseInt(replaceIndexRaw, 10)
        : null;

    const isReplacing =
      replaceIndex !== null &&
      !Number.isNaN(replaceIndex) &&
      replaceIndex >= 0 &&
      replaceIndex < currentItems.length;

    if (!isReplacing && currentItems.length >= MAX_STAFF_PHOTOS) {
      return NextResponse.json(
        { error: `Mỗi tài khoản chỉ được lưu tối đa ${MAX_STAFF_PHOTOS} ảnh cá nhân.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const hash = computeBufferSha256(buffer);
    const duplicateIndex = currentItems.findIndex((item) => item.hash === hash);
    const db = getDb();

    // Case 1: Duplicate photo already exists in this staff's gallery
    if (duplicateIndex !== -1) {
      if (!isReplacing || duplicateIndex === replaceIndex) {
        return NextResponse.json({
          ok: true,
          deduplicated: true,
          message: "Ảnh này đã có sẵn trong hồ sơ của bạn (không tạo bản sao trùng lặp).",
          photoCount: currentItems.length,
        });
      }

      // Replacing another slot with an already-existing photo -> remove the replaced slot's old Cloudinary asset so no duplicates exist
      const removedOld = currentItems[replaceIndex];
      const nextItems = currentItems.filter((_, idx) => idx !== replaceIndex);
      await db
        .update(staffProfiles)
        .set({
          photoItems: nextItems,
          primaryPhotoPublicId: nextItems[0]?.publicId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(staffProfiles.userId, auth.user.id));

      if (removedOld) {
        await deleteAuthenticatedStaffPhoto(removedOld.publicId);
      }

      return NextResponse.json({
        ok: true,
        deduplicated: true,
        message: "Ảnh trùng với ảnh đã có; ảnh cũ ở ô này đã được dọn khỏi Cloudinary.",
        photoCount: nextItems.length,
      });
    }

    // Case 2: Fresh unique photo -> upload to Cloudinary first, then update DB, then delete old asset if replacing
    const { publicId } = await uploadAuthenticatedStaffPhoto(buffer, auth.user.id);
    const newItem: StaffPhotoItem = { publicId, hash };

    let oldPublicIdToDelete: string | null = null;
    const nextItems = [...currentItems];

    if (isReplacing && replaceIndex !== null) {
      oldPublicIdToDelete = nextItems[replaceIndex]?.publicId ?? null;
      nextItems[replaceIndex] = newItem;
    } else {
      nextItems.push(newItem);
    }

    await db
      .update(staffProfiles)
      .set({
        photoItems: nextItems,
        primaryPhotoPublicId: nextItems[0]?.publicId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(staffProfiles.userId, auth.user.id));

    if (oldPublicIdToDelete) {
      await deleteAuthenticatedStaffPhoto(oldPublicIdToDelete);
    }

    return NextResponse.json({
      ok: true,
      deduplicated: false,
      photoCount: nextItems.length,
      message: isReplacing ? "Đã thay thế ảnh và xóa ảnh cũ thành công." : "Đã tải ảnh lên thành công.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tải ảnh thất bại.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/photos?index=0..3
 */
export async function DELETE(request: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });
  }
  if (!auth.profile) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ." }, { status: 404 });
  }

  const url = new URL(request.url);
  const index = Number.parseInt(url.searchParams.get("index") ?? "-1", 10);
  const currentItems = [...(auth.profile.photoItems ?? [])];

  if (Number.isNaN(index) || index < 0 || index >= currentItems.length) {
    return NextResponse.json({ error: "Vị trí ảnh không hợp lệ." }, { status: 400 });
  }

  if (currentItems.length <= 1) {
    return NextResponse.json(
      { error: "Hồ sơ cần giữ tối thiểu 1 ảnh cá nhân. Hãy dùng nút 'Thay ảnh' để đổi sang ảnh khác." },
      { status: 400 },
    );
  }

  const [removed] = currentItems.splice(index, 1);
  const db = getDb();

  await db
    .update(staffProfiles)
    .set({
      photoItems: currentItems,
      primaryPhotoPublicId: currentItems[0]?.publicId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(staffProfiles.userId, auth.user.id));

  if (removed?.publicId) {
    await deleteAuthenticatedStaffPhoto(removed.publicId);
  }

  return NextResponse.json({
    ok: true,
    photoCount: currentItems.length,
    message: "Đã xóa ảnh khỏi hồ sơ và Cloudinary.",
  });
}

/**
 * PATCH /api/staff/photos  body: { primaryIndex: number }
 * Moves the chosen photo to slot 0 (primary photo shown first to Admin).
 */
export async function PATCH(request: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Bạn cần đăng nhập trước." }, { status: 401 });
  }
  if (!auth.profile) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { primaryIndex?: unknown } | null;
  const primaryIndex = typeof body?.primaryIndex === "number" ? body.primaryIndex : -1;
  const items = [...(auth.profile.photoItems ?? [])];

  if (!Number.isInteger(primaryIndex) || primaryIndex < 0 || primaryIndex >= items.length) {
    return NextResponse.json({ error: "Vị trí ảnh không hợp lệ." }, { status: 400 });
  }
  if (primaryIndex === 0) {
    return NextResponse.json({ ok: true, photoCount: items.length, message: "Ảnh này đã là ảnh chính." });
  }

  const [chosen] = items.splice(primaryIndex, 1);
  const nextItems = [chosen, ...items];

  await getDb()
    .update(staffProfiles)
    .set({
      photoItems: nextItems,
      primaryPhotoPublicId: nextItems[0]?.publicId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(staffProfiles.userId, auth.user.id));

  return NextResponse.json({
    ok: true,
    photoCount: nextItems.length,
    message: "Đã đặt làm ảnh chính.",
  });
}