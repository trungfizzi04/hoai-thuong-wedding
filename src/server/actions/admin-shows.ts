"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  parseVietnamDateTimeLocal,
  showFormSchema,
  type ShowFormValues,
} from "@/lib/validations/show";
import { requireAdmin } from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { registrations, shows, staffProfiles } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";
import { withLockedShow } from "@/server/services/show-lock";

export interface ShowActionResult {
  ok: boolean;
  error?: string;
  showId?: string;
}

export async function createShowAction(input: ShowFormValues): Promise<ShowActionResult> {
  const admin = await requireAdmin();
  const parsed = showFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin show chưa hợp lệ." };
  }

  const gatherAt = parseVietnamDateTimeLocal(parsed.data.gatherAtLocal);
  const endAt = parseVietnamDateTimeLocal(parsed.data.endAtLocal);
  const db = getDb();

  const [created] = await db
    .insert(shows)
    .values({
      title: parsed.data.title,
      gatherAt,
      endAt,
      address: parsed.data.address,
      district: parsed.data.district,
      requiredMale: parsed.data.requiredMale,
      requiredFemale: parsed.data.requiredFemale,
      wagePerPerson: parsed.data.wagePerPerson,
      allowanceNote: parsed.data.allowanceNote,
      dressCode: parsed.data.dressCode,
      zaloGroupUrl: parsed.data.zaloGroupUrl,
      autoCloseWhenFull: parsed.data.autoCloseWhenFull,
      notes: parsed.data.notes,
      clientName: parsed.data.clientName,
      clientPhone: parsed.data.clientPhone,
      totalRevenue: parsed.data.totalRevenue,
      status: "OPEN",
    })
    .returning();

  if (!created) {
    return { ok: false, error: "Không thể tạo show mới." };
  }

  await logAuditEvent(db, {
    actorUserId: admin.user.id,
    action: "CREATE_SHOW",
    targetType: "SHOW",
    targetId: created.id,
    metadata: {
      title: created.title,
      requiredMale: created.requiredMale,
      requiredFemale: created.requiredFemale,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/shows");
  revalidatePath("/staff");

  return { ok: true, showId: created.id };
}

/**
 * Update Show inside `withLockedShow(showId)`:
 * - Blocks reducing `requiredMale` / `requiredFemale` below currently APPROVED counts
 * - Auto-syncs `OPEN` <-> `FULL` when `autoCloseWhenFull` is enabled
 */
export async function updateShowAction(
  showId: string,
  input: ShowFormValues,
): Promise<ShowActionResult> {
  const admin = await requireAdmin();
  const parsed = showFormSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin show chưa hợp lệ." };
  }

  const gatherAt = parseVietnamDateTimeLocal(parsed.data.gatherAtLocal);
  const endAt = parseVietnamDateTimeLocal(parsed.data.endAtLocal);

  try {
    const result = await withLockedShow(showId, async (tx, lockedShow) => {
      const [counts] = await tx
        .select({
          approvedMale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'MALE')::int`,
          approvedFemale: sql<number>`count(*) filter (where ${registrations.status} = 'APPROVED' and ${staffProfiles.gender} = 'FEMALE')::int`,
        })
        .from(registrations)
        .leftJoin(staffProfiles, eq(staffProfiles.userId, registrations.userId))
        .where(eq(registrations.showId, showId));

      const approvedMale = counts?.approvedMale ?? 0;
      const approvedFemale = counts?.approvedFemale ?? 0;

      if (parsed.data.requiredMale < approvedMale) {
        return {
          ok: false as const,
          error: `Không thể giảm slot Nam xuống ${parsed.data.requiredMale} vì đã duyệt ${approvedMale} bạn Nam.`,
        };
      }
      if (parsed.data.requiredFemale < approvedFemale) {
        return {
          ok: false as const,
          error: `Không thể giảm slot Nữ xuống ${parsed.data.requiredFemale} vì đã duyệt ${approvedFemale} bạn Nữ.`,
        };
      }

      let nextStatus = lockedShow.status;
      if (parsed.data.autoCloseWhenFull && (nextStatus === "OPEN" || nextStatus === "FULL")) {
        const isFull =
          approvedMale >= parsed.data.requiredMale && approvedFemale >= parsed.data.requiredFemale;
        nextStatus = isFull ? "FULL" : "OPEN";
      }

      await tx
        .update(shows)
        .set({
          title: parsed.data.title,
          gatherAt,
          endAt,
          address: parsed.data.address,
          district: parsed.data.district,
          requiredMale: parsed.data.requiredMale,
          requiredFemale: parsed.data.requiredFemale,
          wagePerPerson: parsed.data.wagePerPerson,
          allowanceNote: parsed.data.allowanceNote,
          dressCode: parsed.data.dressCode,
          zaloGroupUrl: parsed.data.zaloGroupUrl,
          autoCloseWhenFull: parsed.data.autoCloseWhenFull,
          notes: parsed.data.notes,
          clientName: parsed.data.clientName,
          clientPhone: parsed.data.clientPhone,
          totalRevenue: parsed.data.totalRevenue,
          status: nextStatus,
        })
        .where(eq(shows.id, showId));

      await logAuditEvent(tx, {
        actorUserId: admin.user.id,
        action:
          lockedShow.requiredMale !== parsed.data.requiredMale ||
          lockedShow.requiredFemale !== parsed.data.requiredFemale
            ? "EDIT_SLOTS"
            : "UPDATE_SHOW",
        targetType: "SHOW",
        targetId: showId,
        metadata: {
          prevSlots: { male: lockedShow.requiredMale, female: lockedShow.requiredFemale },
          nextSlots: { male: parsed.data.requiredMale, female: parsed.data.requiredFemale },
          nextStatus,
        },
      });

      return { ok: true as const, showId };
    });

    if (result.ok) {
      revalidatePath("/admin");
      revalidatePath("/admin/shows");
      revalidatePath(`/shows/${showId}`);
      revalidatePath("/staff");
    }

    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể cập nhật show.",
    };
  }
}

export async function updateShowStatusAction(
  showId: string,
  nextStatus: "OPEN" | "FULL" | "CLOSED" | "COMPLETED" | "CANCELLED",
): Promise<ShowActionResult> {
  const admin = await requireAdmin();

  try {
    await withLockedShow(showId, async (tx, lockedShow) => {
      await tx.update(shows).set({ status: nextStatus }).where(eq(shows.id, showId));

      await logAuditEvent(tx, {
        actorUserId: admin.user.id,
        action: "CHANGE_SHOW_STATUS",
        targetType: "SHOW",
        targetId: showId,
        metadata: { from: lockedShow.status, to: nextStatus },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/shows");
    revalidatePath(`/shows/${showId}`);
    revalidatePath("/staff");
    return { ok: true, showId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể đổi trạng thái show.",
    };
  }
}
