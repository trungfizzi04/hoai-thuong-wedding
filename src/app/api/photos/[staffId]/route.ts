import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { staffProfiles } from "@/server/db/schema";
import {
  buildSignedAuthenticatedPhotoUrl,
  isCloudinaryConfigured,
  MAX_STAFF_PHOTOS,
} from "@/server/lib/cloudinary";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ staffId: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { staffId } = await context.params;
  if (!UUID_REGEX.test(staffId)) {
    return NextResponse.json({ error: "INVALID_STAFF_ID" }, { status: 400 });
  }

  const isAdmin = auth.user.role === "ADMIN" && auth.user.status === "ACTIVE";
  const isOwner = auth.user.id === staffId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const indexParam = Number.parseInt(request.nextUrl.searchParams.get("index") ?? "0", 10);
  const index =
    Number.isNaN(indexParam) || indexParam < 0 || indexParam >= MAX_STAFF_PHOTOS ? 0 : indexParam;
  const sizeParam = request.nextUrl.searchParams.get("size");
  const size: "thumb" | "full" = sizeParam === "thumb" ? "thumb" : "full";

  const db = getDb();
  const [profile] = await db
    .select({
      primaryPhotoPublicId: staffProfiles.primaryPhotoPublicId,
      photoItems: staffProfiles.photoItems,
    })
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, staffId))
    .limit(1);

  const publicId =
    profile?.photoItems?.[index]?.publicId ??
    (index === 0 ? profile?.primaryPhotoPublicId : null) ??
    null;

  if (!publicId) {
    return NextResponse.json({ error: "PHOTO_NOT_FOUND" }, { status: 404 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const signedUrl = buildSignedAuthenticatedPhotoUrl(publicId, size);
    const upstream = await fetch(signedUrl, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "UPSTREAM_PHOTO_ERROR" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "image/webp";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "PHOTO_FETCH_FAILED" }, { status: 502 });
  }
}
