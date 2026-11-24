import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { registrations, shows, staffProfiles } from "@/server/db/schema";

export interface ShowSlotCounts {
  approvedMale: number;
  approvedFemale: number;
  pendingCount: number;
  waitlistCount: number;
}

async function getShowCountsMap(showIds: string[]): Promise<Map<string, ShowSlotCounts>> {
  const map = new Map<string, ShowSlotCounts>();
  if (showIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({
      showId: registrations.showId,
      approvedMale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'MALE')::int`,
      approvedFemale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'FEMALE')::int`,
      pendingCount: sql<number>`count(*) filter (where ${registrations.status} = 'PENDING')::int`,
      waitlistCount: sql<number>`count(*) filter (where ${registrations.status} = 'WAITLIST')::int`,
    })
    .from(registrations)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, registrations.userId))
    .where(inArray(registrations.showId, showIds))
    .groupBy(registrations.showId);

  for (const r of rows) {
    map.set(r.showId, {
      approvedMale: r.approvedMale,
      approvedFemale: r.approvedFemale,
      pendingCount: r.pendingCount,
      waitlistCount: r.waitlistCount,
    });
  }
  return map;
}

const EMPTY_COUNTS: ShowSlotCounts = {
  approvedMale: 0,
  approvedFemale: 0,
  pendingCount: 0,
  waitlistCount: 0,
};

export async function getAdminShowsWithCounts() {
  const db = getDb();
  const list = await db.select().from(shows).orderBy(asc(shows.gatherAt));
  const countsMap = await getShowCountsMap(list.map((s) => s.id));

  return list.map((show) => ({
    ...show,
    counts: countsMap.get(show.id) ?? EMPTY_COUNTS,
  }));
}

export async function getPublicShowById(showId: string) {
  const db = getDb();
  const [show] = await db
    .select({
      id: shows.id,
      title: shows.title,
      gatherAt: shows.gatherAt,
      endAt: shows.endAt,
      address: shows.address,
      district: shows.district,
      requiredMale: shows.requiredMale,
      requiredFemale: shows.requiredFemale,
      wagePerPerson: shows.wagePerPerson,
      allowanceNote: shows.allowanceNote,
      dressCode: shows.dressCode,
      status: shows.status,
      notes: shows.notes,
    })
    .from(shows)
    .where(eq(shows.id, showId))
    .limit(1);

  if (!show) return null;

  const countsMap = await getShowCountsMap([show.id]);
  return {
    ...show,
    counts: countsMap.get(show.id) ?? EMPTY_COUNTS,
  };
}

export async function getStaffFeedShows(userId: string) {
  const db = getDb();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const list = await db
    .select({
      id: shows.id,
      title: shows.title,
      gatherAt: shows.gatherAt,
      endAt: shows.endAt,
      address: shows.address,
      district: shows.district,
      requiredMale: shows.requiredMale,
      requiredFemale: shows.requiredFemale,
      wagePerPerson: shows.wagePerPerson,
      allowanceNote: shows.allowanceNote,
      dressCode: shows.dressCode,
      status: shows.status,
      notes: shows.notes,
    })
    .from(shows)
    .where(and(inArray(shows.status, ["OPEN", "FULL"]), gte(shows.gatherAt, cutoff)))
    .orderBy(asc(shows.gatherAt));

  const showIds = list.map((s) => s.id);
  const countsMap = await getShowCountsMap(showIds);

  const myRegs =
    showIds.length > 0
      ? await db
          .select({
            showId: registrations.showId,
            status: registrations.status,
          })
          .from(registrations)
          .where(and(eq(registrations.userId, userId), inArray(registrations.showId, showIds)))
      : [];

  const myRegMap = new Map(myRegs.map((r) => [r.showId, r.status]));

  return list.map((show) => ({
    ...show,
    counts: countsMap.get(show.id) ?? EMPTY_COUNTS,
    myRegistrationStatus: myRegMap.get(show.id) ?? null,
  }));
}

export async function getStaffMySchedule(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      registrationId: registrations.id,
      registrationStatus: registrations.status,
      isConfirmed: registrations.isConfirmed,
      confirmedAt: registrations.confirmedAt,
      cancelReason: registrations.cancelReason,
      createdAt: registrations.createdAt,
      show: {
        id: shows.id,
        title: shows.title,
        gatherAt: shows.gatherAt,
        endAt: shows.endAt,
        address: shows.address,
        district: shows.district,
        wagePerPerson: shows.wagePerPerson,
        allowanceNote: shows.allowanceNote,
        dressCode: shows.dressCode,
        status: shows.status,
        zaloGroupUrl: shows.zaloGroupUrl,
      },
    })
    .from(registrations)
    .innerJoin(shows, eq(registrations.showId, shows.id))
    .where(eq(registrations.userId, userId))
    .orderBy(desc(shows.gatherAt));

  const nowMs = Date.now();
  return rows.map((r) => {
    const hoursUntil = (r.show.gatherAt.getTime() - nowMs) / (1000 * 60 * 60);
    const isPendingOrWaitlist =
      r.registrationStatus === "PENDING" || r.registrationStatus === "WAITLIST";
    const isApproved = r.registrationStatus === "APPROVED";

    return {
      ...r,
      canSelfCancel: isPendingOrWaitlist || (isApproved && hoursUntil >= 24),
      lockedWithin24h: isApproved && hoursUntil < 24 && hoursUntil > -4,
    };
  });
}
