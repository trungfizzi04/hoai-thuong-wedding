import { asc, eq } from "drizzle-orm";
import { AO_DAI_SIZES } from "@/lib/validations/auth";
import { getDb } from "@/server/db";
import { registrations, shows, staffProfiles, users } from "@/server/db/schema";

export type SizeBreakdown = Record<(typeof AO_DAI_SIZES)[number], number>;

function createEmptySizeBreakdown(): SizeBreakdown {
  return { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0 };
}

export async function getAdminShowDetail(showId: string) {
  const db = getDb();
  const [show] = await db.select().from(shows).where(eq(shows.id, showId)).limit(1);
  if (!show) return null;

  const rows = await db
    .select({
      registration: registrations,
      user: {
        id: users.id,
        zaloName: users.zaloName,
        zaloAvatarUrl: users.zaloAvatarUrl,
        loginPhone: users.loginPhone,
        status: users.status,
      },
      profile: staffProfiles,
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(eq(registrations.showId, showId))
    .orderBy(asc(registrations.createdAt));

  let approvedMale = 0;
  let approvedFemale = 0;
  let unconfirmedApprovedCount = 0;
  let waitlistMale = 0;
  let waitlistFemale = 0;
  const maleSizes = createEmptySizeBreakdown();
  const femaleSizes = createEmptySizeBreakdown();

  for (const r of rows) {
    const gender = r.profile?.gender;
    if (r.registration.status === "APPROVED") {
      if (!r.registration.isConfirmed) unconfirmedApprovedCount += 1;
      if (gender === "MALE") {
        approvedMale += 1;
        if (r.profile?.aoDaiSize) {
          maleSizes[r.profile.aoDaiSize] += 1;
        }
      } else if (gender === "FEMALE") {
        approvedFemale += 1;
        if (r.profile?.aoDaiSize) {
          femaleSizes[r.profile.aoDaiSize] += 1;
        }
      }
    } else if (r.registration.status === "WAITLIST") {
      if (gender === "MALE") waitlistMale += 1;
      else if (gender === "FEMALE") waitlistFemale += 1;
    }
  }

  return {
    show,
    applicants: rows,
    summary: {
      approvedMale,
      approvedFemale,
      unconfirmedApprovedCount,
      waitlistMale,
      waitlistFemale,
      maleSizes,
      femaleSizes,
    },
  };
}
