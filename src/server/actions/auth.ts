"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  activateInvitePasswordSchema,
  adminLoginSchema,
  loginPasswordSchema,
} from "@/lib/validations/auth";
import {
  clearSessionCookie,
  createDbSession,
  hashSessionToken,
  revokeSessionByRawToken,
  SESSION_COOKIE_NAME,
  setSessionCookie,
} from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { inviteTokens, staffProfiles, users } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";
import {
  checkLoginRateLimit,
  clearFailedLogin,
  recordFailedLogin,
} from "@/server/services/rate-limit";

export interface ActionResult {
  ok: boolean;
  error?: string;
  redirectTo?: string;
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

export async function loginAdminAction(input: {
  username: string;
  password: string;
  nextPath?: string;
}): Promise<ActionResult> {
  const parsed = adminLoginSchema.safeParse({
    username: input.username,
    password: input.password,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." };
  }

  const username = parsed.data.username.toLowerCase();
  const { password } = parsed.data;
  const ipAddress = await getClientIp();
  const rateKey = `admin:${username}`;

  const rateLimit = await checkLoginRateLimit(rateKey, ipAddress);
  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil((rateLimit.retryAfterSeconds ?? 60) / 60));
    return {
      ok: false,
      error: `Nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`,
    };
  }

  if (rateLimit.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs));
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !user.passwordHash || user.role !== "ADMIN") {
    await recordFailedLogin(rateKey, ipAddress);
    return { ok: false, error: "Tên đăng nhập hoặc mật khẩu Quản trị không đúng." };
  }

  if (user.status !== "ACTIVE") {
    return { ok: false, error: "Tài khoản Quản trị đang bị khóa." };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    await recordFailedLogin(rateKey, ipAddress);
    return { ok: false, error: "Tên đăng nhập hoặc mật khẩu Quản trị không đúng." };
  }

  await clearFailedLogin(rateKey, ipAddress);
  const { rawToken, expiresAt } = await createDbSession(user.id);
  await setSessionCookie(rawToken, expiresAt);

  const target =
    input.nextPath && input.nextPath.startsWith("/admin") && input.nextPath !== "/admin/login"
      ? input.nextPath
      : "/admin";
  return { ok: true, redirectTo: target };
}

export async function loginWithPasswordAction(input: {
  phone: string;
  password: string;
  nextPath?: string;
}): Promise<ActionResult> {
  const parsed = loginPasswordSchema.safeParse({
    phone: input.phone,
    password: input.password,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." };
  }

  const { phone, password } = parsed.data;
  const ipAddress = await getClientIp();

  const rateLimit = await checkLoginRateLimit(phone, ipAddress);
  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil((rateLimit.retryAfterSeconds ?? 60) / 60));
    return {
      ok: false,
      error: `Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`,
    };
  }

  if (rateLimit.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs));
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginPhone, phone))
    .limit(1);

  if (!user || !user.passwordHash) {
    await recordFailedLogin(phone, ipAddress);
    return { ok: false, error: "Số điện thoại hoặc mật khẩu không đúng." };
  }

  if (user.status === "SUSPENDED") {
    return {
      ok: false,
      error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.",
    };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    await recordFailedLogin(phone, ipAddress);
    return { ok: false, error: "Số điện thoại hoặc mật khẩu không đúng." };
  }

  await clearFailedLogin(phone, ipAddress);
  const { rawToken, expiresAt } = await createDbSession(user.id);
  await setSessionCookie(rawToken, expiresAt);

  if (user.role === "ADMIN") {
    const target =
      input.nextPath && input.nextPath.startsWith("/admin") ? input.nextPath : "/admin";
    return { ok: true, redirectTo: target };
  }

  const [profile] = await db
    .select({ id: staffProfiles.id })
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return { ok: true, redirectTo: "/onboarding" };
  }

  const target =
    input.nextPath && input.nextPath.startsWith("/") && !input.nextPath.startsWith("//")
      ? input.nextPath
      : "/staff";
  return { ok: true, redirectTo: target };
}

export async function activateInviteWithPasswordAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = activateInvitePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." };
  }

  const db = getDb();
  const tokenHash = hashSessionToken(parsed.data.token);
  const now = new Date();

  const [invite] = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.tokenHash, tokenHash),
        isNull(inviteTokens.usedAt),
        gt(inviteTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!invite) {
    return {
      ok: false,
      error: "Link kích hoạt không hợp lệ, đã sử dụng hoặc đã hết hạn (72 giờ).",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, status: "ACTIVE" })
      .where(eq(users.id, invite.userId));

    await tx
      .update(inviteTokens)
      .set({ usedAt: now })
      .where(eq(inviteTokens.id, invite.id));

    await logAuditEvent(tx, {
      actorUserId: invite.userId,
      action: "ACTIVATE_INVITE_PASSWORD",
      targetType: "USER",
      targetId: invite.userId,
    });
  });

  const { rawToken, expiresAt } = await createDbSession(invite.userId);
  await setSessionCookie(rawToken, expiresAt);

  return { ok: true, redirectTo: "/onboarding" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    await revokeSessionByRawToken(rawToken);
  }
  await clearSessionCookie();
  redirect("/login");
}
