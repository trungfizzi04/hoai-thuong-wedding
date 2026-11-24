"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { registrations, shows, staffProfiles } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";
import { withLockedShow } from "@/server/services/show-lock";

const CANCEL_CUTOFF_HOURS = 24;

export interface RegistrationActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * 1-tap show registration for Staff (both ACTIVE and PENDING_APPROVAL with completed profile):
 * - Validates show is OPEN and recruits the staff's gender
 * - Does NOT hard-block overlapping shows (Admin sees red conflict + 60m buffer alert in Phase 3)
 * - Uses UPSERT on UNIQUE(show_id, user_id) so a staff who previously cancelled can re-register cleanly
 */
export async function registerForShowAction(showId: string): Promise<RegistrationActionResult> {
  const auth = await requireUser();
  if (auth.user.role !== "STAFF") {
    return { ok: false, error: "Chỉ tài khoản Nhân sự mới có thể đăng ký nhận show." };
  }
  if (!auth.profile) {
    return { ok: false, error: "Bạn cần hoàn tất hồ sơ cá nhân trước khi đăng ký show." };
  }

  const db = getDb();
  const [show] = await db.select().from(shows).where(eq(shows.id, showId)).limit(1);

  if (!show) {
    return { ok: false, error: "Không tìm thấy show này." };
  }
  if (show.status !== "OPEN") {
    return { ok: false, error: "Show này đã đủ người hoặc đã đóng tuyển." };
  }

  const staffGender = auth.profile.gender;
  if (staffGender === "MALE" && show.requiredMale <= 0) {
    return { ok: false, error: "Show này hiện chỉ tuyển đội hình Nữ." };
  }
  if (staffGender === "FEMALE" && show.requiredFemale <= 0) {
    return { ok: false, error: "Show này hiện chỉ tuyển đội hình Nam." };
  }

  const [existing] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.showId, showId), eq(registrations.userId, auth.user.id)))
    .limit(1);

  if (existing && (existing.status === "PENDING" || existing.status === "APPROVED" || existing.status === "WAITLIST")) {
    return { ok: false, error: "Bạn đã đăng ký show này rồi." };
  }

  const now = new Date();
  const [upserted] = await db
    .insert(registrations)
    .values({
      showId,
      userId: auth.user.id,
      status: "PENDING",
      isConfirmed: false,
      confirmedAt: null,
      cancelledBy: null,
      cancelledAt: null,
      cancelReason: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [registrations.showId, registrations.userId],
      set: {
        status: "PENDING",
        isConfirmed: false,
        confirmedAt: null,
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        updatedAt: now,
      },
    })
    .returning();

  if (upserted) {
    await logAuditEvent(db, {
      actorUserId: auth.user.id,
      action: existing ? "RE_REGISTER_SHOW" : "REGISTER_SHOW",
      targetType: "REGISTRATION",
      targetId: upserted.id,
      metadata: { showId, gender: staffGender },
    });
  }

  revalidatePath("/staff");
  revalidatePath("/staff/schedule");
  revalidatePath(`/shows/${showId}`);
  revalidatePath("/admin/shows");

  return {
    ok: true,
    message: "Đã đăng ký nhận show thành công! Đơn của bạn đang chờ Admin duyệt.",
  };
}

/**
 * Staff self-cancellation with 24h cutoff & WAITLIST protection:
 * - PENDING / WAITLIST: free to cancel anytime
 * - APPROVED: allowed only >= 24h before `gatherAt`, inside `withLockedShow(showId)`
 *   - If show is FULL & same-gender WAITLIST has candidates -> keep FULL so newcomers cannot cut in line
 *   - Only reopen to OPEN when same-gender WAITLIST is empty
 */
export async function cancelMyRegistrationAction(
  showId: string,
  reason?: string,
): Promise<RegistrationActionResult> {
  const auth = await requireUser();
  if (!auth.profile) {
    return { ok: false, error: "Không tìm thấy hồ sơ nhân sự." };
  }

  const staffGender = auth.profile.gender;
  const cleanReason = reason?.trim().slice(0, 250) || null;

  try {
    const result = await withLockedShow(showId, async (tx, lockedShow) => {
      const [reg] = await tx
        .select()
        .from(registrations)
        .where(and(eq(registrations.showId, showId), eq(registrations.userId, auth.user.id)))
        .limit(1);

      if (!reg) {
        return { ok: false as const, error: "Bạn chưa đăng ký show này." };
      }

      if (reg.status === "CANCELLED" || reg.status === "REJECTED") {
        return { ok: false as const, error: "Đơn đăng ký này đã được hủy trước đó." };
      }

      const now = new Date();
      const wasApproved = reg.status === "APPROVED";

      if (wasApproved) {
        const hoursUntilGather =
          (lockedShow.gatherAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilGather < CANCEL_CUTOFF_HOURS) {
          return {
            ok: false as const,
            error:
              "Show sắp diễn ra trong vòng 24 giờ tới. Bạn không thể tự hủy — vui lòng nhắn trực tiếp Admin trên Zalo ngay!",
          };
        }
      }

      await tx
        .update(registrations)
        .set({
          status: "CANCELLED",
          isConfirmed: false,
          confirmedAt: null,
          cancelledBy: auth.user.id,
          cancelledAt: now,
          cancelReason: cleanReason,
          updatedAt: now,
        })
        .where(eq(registrations.id, reg.id));

      let reopenedToOpen = false;
      let waitlistPreserved = false;

      if (wasApproved && lockedShow.status === "FULL" && lockedShow.autoCloseWhenFull) {
        const [waitlistAgg] = await tx
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(registrations)
          .innerJoin(staffProfiles, eq(staffProfiles.userId, registrations.userId))
          .where(
            and(
              eq(registrations.showId, showId),
              eq(registrations.status, "WAITLIST"),
              eq(staffProfiles.gender, staffGender),
            ),
          );

        const sameGenderWaitlistCount = waitlistAgg?.count ?? 0;

        if (sameGenderWaitlistCount > 0) {
          // Keep show FULL to protect WAITLIST queue order; Admin will promote from WAITLIST
          waitlistPreserved = true;
        } else {
          await tx.update(shows).set({ status: "OPEN" }).where(eq(shows.id, showId));
          reopenedToOpen = true;
        }
      }

      await logAuditEvent(tx, {
        actorUserId: auth.user.id,
        action: wasApproved ? "STAFF_CANCEL_APPROVED" : "STAFF_CANCEL_REGISTRATION",
        targetType: "REGISTRATION",
        targetId: reg.id,
        metadata: {
          showId,
          previousStatus: reg.status,
          cancelReason: cleanReason,
          reopenedToOpen,
          waitlistPreserved,
        },
      });

      return {
        ok: true as const,
        message: "Đã hủy đăng ký show thành công.",
      };
    });

    if (result.ok) {
      revalidatePath("/staff");
      revalidatePath("/staff/schedule");
      revalidatePath(`/shows/${showId}`);
      revalidatePath("/admin/shows");
    }

    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể hủy đăng ký.",
    };
  }
}

/**
 * Staff 1-tap attendance confirmation (Confirm đi show) for APPROVED registrations.
 */
export async function confirmMyAttendanceAction(
  showId: string,
): Promise<RegistrationActionResult> {
  const auth = await requireUser();
  const db = getDb();

  const [reg] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.showId, showId), eq(registrations.userId, auth.user.id)))
    .limit(1);

  if (!reg) {
    return { ok: false, error: "Không tìm thấy đơn đăng ký của bạn cho show này." };
  }
  if (reg.status !== "APPROVED") {
    return { ok: false, error: "Chỉ nhân sự đã được duyệt mới cần xác nhận tham gia." };
  }
  if (reg.isConfirmed) {
    return { ok: true, message: "Bạn đã xác nhận tham gia show này rồi." };
  }

  const now = new Date();
  await db
    .update(registrations)
    .set({
      isConfirmed: true,
      confirmedAt: now,
      updatedAt: now,
    })
    .where(eq(registrations.id, reg.id));

  await logAuditEvent(db, {
    actorUserId: auth.user.id,
    action: "STAFF_CONFIRM_ATTENDANCE",
    targetType: "REGISTRATION",
    targetId: reg.id,
    metadata: { showId },
  });

  revalidatePath("/staff/schedule");
  revalidatePath(`/admin/shows/${showId}`);

  return { ok: true, message: "Đã xác nhận chắc chắn tham gia show! Hẹn gặp bạn đúng giờ nhé." };
}
