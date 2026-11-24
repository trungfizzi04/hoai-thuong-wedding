"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createInvitedStaffSchema } from "@/lib/validations/auth";
import {
  generateOpaqueToken,
  hashSessionToken,
  requireAdmin,
  revokeAllUserSessions,
} from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { inviteTokens, staffProfiles, users } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";

const INVITE_TTL_HOURS = 72;

export interface CreateInviteResult {
  ok: boolean;
  error?: string;
  inviteUrl?: string;
  inviteMessage?: string;
}

function buildInviteShareData(fullName: string, rawToken: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;
  const inviteMessage = `Chào ${fullName}, Hoài Thương Wedding gửi bạn link kích hoạt tài khoản nhân sự bưng quả (dùng 1 lần, hiệu lực 72 giờ):\n${inviteUrl}\nBạn bấm link để liên kết Zalo (hoặc đặt mật khẩu) và điền nhanh hồ sơ nhé!`;
  return { inviteUrl, inviteMessage };
}

export async function createInvitedStaffAction(input: {
  fullName: string;
  phone: string;
}): Promise<CreateInviteResult> {
  const admin = await requireAdmin();
  const parsed = createInvitedStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginPhone, parsed.data.phone))
    .limit(1);

  if (existing) {
    return {
      ok: false,
      error: "Số điện thoại này đã tồn tại tài khoản đăng nhập. Hãy kiểm tra danh sách nhân sự.",
    };
  }

  const rawToken = generateOpaqueToken(24);
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  const createdUser = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        loginPhone: parsed.data.phone,
        zaloName: parsed.data.fullName,
        role: "STAFF",
        status: "INVITED",
      })
      .returning();

    if (!newUser) throw new Error("Không thể tạo hồ sơ khung.");

    await tx.insert(inviteTokens).values({
      userId: newUser.id,
      tokenHash,
      expiresAt,
    });

    await logAuditEvent(tx, {
      actorUserId: admin.user.id,
      action: "CREATE_INVITED_STAFF",
      targetType: "USER",
      targetId: newUser.id,
      metadata: { fullName: parsed.data.fullName, phone: parsed.data.phone },
    });

    return newUser;
  });

  revalidatePath("/admin/staff");
  const { inviteUrl, inviteMessage } = buildInviteShareData(parsed.data.fullName, rawToken);

  return {
    ok: true,
    inviteUrl,
    inviteMessage,
    ...(createdUser ? {} : {}),
  };
}

export async function regenerateInviteLinkAction(userId: string): Promise<CreateInviteResult> {
  const admin = await requireAdmin();
  const db = getDb();

  const [target] = await db
    .select({
      id: users.id,
      zaloName: users.zaloName,
      loginPhone: users.loginPhone,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    return { ok: false, error: "Không tìm thấy nhân sự." };
  }

  const rawToken = generateOpaqueToken(24);
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx.insert(inviteTokens).values({
      userId: target.id,
      tokenHash,
      expiresAt,
    });

    await logAuditEvent(tx, {
      actorUserId: admin.user.id,
      action: "REGENERATE_INVITE_TOKEN",
      targetType: "USER",
      targetId: target.id,
    });
  });

  revalidatePath("/admin/staff");
  const { inviteUrl, inviteMessage } = buildInviteShareData(
    target.zaloName || target.loginPhone || "bạn",
    rawToken,
  );
  return { ok: true, inviteUrl, inviteMessage };
}

export async function verifyStaffAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.update(users).set({ status: "ACTIVE" }).where(eq(users.id, userId));
    await tx
      .update(staffProfiles)
      .set({ verifiedBy: admin.user.id, verifiedAt: now, updatedAt: now })
      .where(eq(staffProfiles.userId, userId));

    await logAuditEvent(tx, {
      actorUserId: admin.user.id,
      action: "VERIFY_USER",
      targetType: "USER",
      targetId: userId,
    });
  });

  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function toggleSuspendStaffAction(
  userId: string,
  suspend: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (userId === admin.user.id) {
    return { ok: false, error: "Không thể tự khóa tài khoản Quản trị viên của chính mình." };
  }

  const db = getDb();
  const nextStatus = suspend ? "SUSPENDED" : "ACTIVE";

  await db.transaction(async (tx) => {
    await tx.update(users).set({ status: nextStatus }).where(eq(users.id, userId));
    await logAuditEvent(tx, {
      actorUserId: admin.user.id,
      action: suspend ? "SUSPEND_USER" : "UNSUSPEND_USER",
      targetType: "USER",
      targetId: userId,
    });
  });

  if (suspend) {
    await revokeAllUserSessions(userId);
  }

  revalidatePath("/admin/staff");
  return { ok: true };
}
