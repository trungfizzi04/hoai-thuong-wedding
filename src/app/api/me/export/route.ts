import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { registrations, shows } from "@/server/db/schema";

/**
 * GET /api/me/export — Personal Data Export (JSON) per Decree 356/2025/ND-CP.
 */
export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getDb();
  const userRegistrations = await db
    .select({
      registrationId: registrations.id,
      status: registrations.status,
      isConfirmed: registrations.isConfirmed,
      paymentStatus: registrations.paymentStatus,
      createdAt: registrations.createdAt,
      showTitle: shows.title,
      gatherAt: shows.gatherAt,
      district: shows.district,
      wagePerPerson: shows.wagePerPerson,
    })
    .from(registrations)
    .innerJoin(shows, eq(registrations.showId, shows.id))
    .where(eq(registrations.userId, auth.user.id));

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    legalBasis: "Luật Bảo vệ dữ liệu cá nhân 2025 & Nghị định 356/2025/NĐ-CP",
    account: {
      id: auth.user.id,
      loginPhone: auth.user.loginPhone,
      zaloId: auth.user.zaloId,
      zaloName: auth.user.zaloName,
      role: auth.user.role,
      status: auth.user.status,
      createdAt: auth.user.createdAt,
    },
    profile: auth.profile
      ? {
          fullName: auth.profile.fullName,
          contactPhone: auth.profile.contactPhone,
          gender: auth.profile.gender,
          heightCm: auth.profile.heightCm,
          weightKg: auth.profile.weightKg,
          aoDaiSize: auth.profile.aoDaiSize,
          photoCount: auth.profile.photoItems.length,
          reputationScore: auth.profile.reputationScore,
          consentAcceptedAt: auth.profile.consentAcceptedAt,
          updatedAt: auth.profile.updatedAt,
        }
      : null,
    registrations: userRegistrations,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="hoai-thuong-wedding-data-${auth.user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
