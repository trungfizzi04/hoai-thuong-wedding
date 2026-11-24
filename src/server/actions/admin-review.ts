"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/dal/auth";
import { registrations, shows, staffProfiles, users } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";
import { withLockedShow } from "@/server/services/show-lock";

export interface ReviewActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Admin 1-tap applicant review (APPROVE / WAITLIST / REJECT) with:
 * - Strict `withLockedShow(showId)` (`SELECT ... FOR UPDATE`) to prevent slot overbooking
 * - Explicit identity verification requirement for `PENDING_APPROVAL` staff
 * - Auto `OPEN` <-> `FULL` sync & WAITLIST queue protection when demoting an APPROVED staff
 */
export async function reviewRegistrationAction(input: {
  showId: string;
  registrationId: string;
  nextStatus: "APPROVED" | "WAITLIST" | "REJECTED";
  verifyIdentity?: boolean;
}): Promise<ReviewActionResult> {
  const admin = await requireAdmin();

  try {
    const result = await withLockedShow(input.showId, async (tx, lockedShow) => {
      const [row] = await tx
        .select({
          reg: registrations,
          user: users,
          profile: staffProfiles,
        })
        .from(registrations)
        .innerJoin(users, eq(registrations.userId, users.id))
        .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
        .where(
          and(eq(registrations.id, input.registrationId), eq(registrations.showId, input.showId)),
        )
        .limit(1);

      if (!row) {
        return { ok: false as const, error: "Không tìm thấy đơn đăng ký này." };
      }

      if (!row.profile) {
        return { ok: false as const, error: "Nhân sự chưa hoàn tất hồ sơ cá nhân." };
      }

      const applicantGender = row.profile.gender;
      const prevStatus = row.reg.status;
      const now = new Date();

      if (prevStatus === input.nextStatus) {
        return { ok: true as const, message: "Trạng thái không thay đổi." };
      }

      // Count current APPROVED by gender inside the locked show transaction
      const [counts] = await tx
        .select({
          approvedMale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'MALE')::int`,
          approvedFemale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'FEMALE')::int`,
        })
        .from(registrations)
        .innerJoin(staffProfiles, eq(staffProfiles.userId, registrations.userId))
        .where(eq(registrations.showId, input.showId));

      let approvedMale = counts?.approvedMale ?? 0;
      let approvedFemale = counts?.approvedFemale ?? 0;

      if (input.nextStatus === "APPROVED") {
        // Require explicit identity verification tick if user is still PENDING_APPROVAL
        if (row.user.status === "PENDING_APPROVAL") {
          if (!input.verifyIdentity) {
            return {
              ok: false as const,
              error:
                'Nhân sự mới chưa xác minh. Vui lòng tick ô "Đã xác minh danh tính" trước khi duyệt.',
            };
          }

          await tx
            .update(users)
            .set({ status: "ACTIVE" })
            .where(eq(users.id, row.user.id));

          await tx
            .update(staffProfiles)
            .set({ verifiedBy: admin.user.id, verifiedAt: now, updatedAt: now })
            .where(eq(staffProfiles.userId, row.user.id));

          await logAuditEvent(tx, {
            actorUserId: admin.user.id,
            action: "VERIFY_USER_ON_APPROVE",
            targetType: "USER",
            targetId: row.user.id,
            metadata: { showId: input.showId },
          });
        }

        if (applicantGender === "MALE") {
          if (approvedMale >= lockedShow.requiredMale) {
            return {
              ok: false as const,
              error: `Đã đủ ${lockedShow.requiredMale}/${lockedShow.requiredMale} slot Nam. Hãy chuyển bạn này sang Dự bị hoặc tăng số slot Nam.`,
            };
          }
          approvedMale += 1;
        } else {
          if (approvedFemale >= lockedShow.requiredFemale) {
            return {
              ok: false as const,
              error: `Đã đủ ${lockedShow.requiredFemale}/${lockedShow.requiredFemale} slot Nữ. Hãy chuyển bạn này sang Dự bị hoặc tăng số slot Nữ.`,
            };
          }
          approvedFemale += 1;
        }
      } else if (prevStatus === "APPROVED") {
        if (applicantGender === "MALE") approvedMale = Math.max(0, approvedMale - 1);
        else approvedFemale = Math.max(0, approvedFemale - 1);
      }

      // Update registration row
      await tx
        .update(registrations)
        .set({
          status: input.nextStatus,
          reviewedBy: admin.user.id,
          reviewedAt: now,
          isConfirmed: input.nextStatus === "APPROVED" ? row.reg.isConfirmed : false,
          confirmedAt: input.nextStatus === "APPROVED" ? row.reg.confirmedAt : null,
          updatedAt: now,
        })
        .where(eq(registrations.id, row.reg.id));

      // Sync show OPEN <-> FULL automatically when autoCloseWhenFull is true
      let nextShowStatus = lockedShow.status;
      if (lockedShow.autoCloseWhenFull && (nextShowStatus === "OPEN" || nextShowStatus === "FULL")) {
        const isNowFull =
          approvedMale >= lockedShow.requiredMale && approvedFemale >= lockedShow.requiredFemale;

        if (isNowFull) {
          nextShowStatus = "FULL";
        } else if (prevStatus === "APPROVED" && lockedShow.status === "FULL") {
          // Protect same-gender WAITLIST queue before reopening publicly
          const [wl] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(registrations)
            .innerJoin(staffProfiles, eq(staffProfiles.userId, registrations.userId))
            .where(
              and(
                eq(registrations.showId, input.showId),
                eq(registrations.status, "WAITLIST"),
                eq(staffProfiles.gender, applicantGender),
              ),
            );
          if ((wl?.count ?? 0) === 0) {
            nextShowStatus = "OPEN";
          }
        } else {
          nextShowStatus = "OPEN";
        }

        if (nextShowStatus !== lockedShow.status) {
          await tx
            .update(shows)
            .set({ status: nextShowStatus })
            .where(eq(shows.id, input.showId));
        }
      }

      await logAuditEvent(tx, {
        actorUserId: admin.user.id,
        action:
          input.nextStatus === "APPROVED"
            ? "APPROVE_REGISTRATION"
            : input.nextStatus === "WAITLIST"
              ? "WAITLIST_REGISTRATION"
              : "REJECT_REGISTRATION",
        targetType: "REGISTRATION",
        targetId: row.reg.id,
        metadata: {
          showId: input.showId,
          userId: row.user.id,
          from: prevStatus,
          to: input.nextStatus,
          nextShowStatus,
        },
      });

      const msgMap = {
        APPROVED: `Đã duyệt ${row.profile.fullName} vào đội hình!`,
        WAITLIST: `Đã chuyển ${row.profile.fullName} vào danh sách Dự bị.`,
        REJECTED: `Đã từ chối đơn của ${row.profile.fullName}.`,
      };

      return { ok: true as const, message: msgMap[input.nextStatus] };
    });

    if (result.ok) {
      revalidatePath(`/admin/shows/${input.showId}`);
      revalidatePath("/admin/shows");
      revalidatePath("/admin/staff");
      revalidatePath(`/shows/${input.showId}`);
      revalidatePath("/staff");
      revalidatePath("/staff/schedule");
    }

    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể cập nhật trạng thái duyệt.",
    };
  }
}
