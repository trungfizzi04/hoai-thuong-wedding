import { and, eq, gt, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  exchangeZaloCode,
  getZaloUserInfo,
  resolveAppOrigin,
} from "@/lib/zalo";
import {
  createDbSession,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/server/dal/auth";
import { getDb } from "@/server/db";
import { inviteTokens, staffProfiles, users } from "@/server/db/schema";
import { logAuditEvent } from "@/server/services/audit";

function clearTempOAuthCookies(response: NextResponse) {
  response.cookies.delete("zalo_code_verifier");
  response.cookies.delete("zalo_state");
  response.cookies.delete("zalo_auth_mode");
  response.cookies.delete("zalo_invite_token");
  response.cookies.delete("zalo_auth_next");
}

function redirectWithError(
  origin: string,
  targetPath: string,
  code: string,
  description?: string,
) {
  const url = new URL(targetPath, origin);
  url.searchParams.set("error", code);
  if (description) {
    url.searchParams.set("error_description", description);
  }
  const response = NextResponse.redirect(url);
  clearTempOAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);
  const inviteRawToken = request.cookies.get("zalo_invite_token")?.value ?? null;
  const nextPath = request.cookies.get("zalo_auth_next")?.value ?? null;
  const fallbackErrorPath = "/login";

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description") ?? undefined;

  if (error || !code) {
    return redirectWithError(
      origin,
      fallbackErrorPath,
      error || "MISSING_CODE",
      errorDescription || "Người dùng đã hủy hoặc Zalo không trả về authorization code.",
    );
  }

  const cookieState = request.cookies.get("zalo_state")?.value;
  const codeVerifier = request.cookies.get("zalo_code_verifier")?.value;

  if (!state || !cookieState || state !== cookieState) {
    return redirectWithError(
      origin,
      fallbackErrorPath,
      "STATE_MISMATCH",
      "Phiên xác thực không khớp hoặc đã hết hạn. Vui lòng thử lại.",
    );
  }

  if (!codeVerifier) {
    return redirectWithError(
      origin,
      fallbackErrorPath,
      "MISSING_VERIFIER",
      "Thiếu mã PKCE trong cookie. Vui lòng thử đăng nhập lại.",
    );
  }

  const appId = process.env.ZALO_APP_ID?.trim();
  const secretKey = process.env.ZALO_APP_SECRET?.trim();

  if (!appId || !secretKey) {
    return redirectWithError(
      origin,
      fallbackErrorPath,
      "CONFIG_MISSING",
      "Thiếu ZALO_APP_ID hoặc ZALO_APP_SECRET trên server.",
    );
  }

  try {
    const tokenData = await exchangeZaloCode({
      code,
      appId,
      secretKey,
      codeVerifier,
    });

    if (!tokenData.access_token) {
      return redirectWithError(
        origin,
        fallbackErrorPath,
        String(tokenData.error ?? tokenData.error_name ?? "TOKEN_EXCHANGE_FAILED"),
        tokenData.error_description || tokenData.message || "Không đổi được Zalo access_token.",
      );
    }

    const profile = await getZaloUserInfo(tokenData.access_token);

    if (profile.error !== 0 || !profile.id) {
      return redirectWithError(
        origin,
        fallbackErrorPath,
        `PROFILE_ERROR_${profile.error}`,
        profile.message || "Không lấy được thông tin từ /v2.0/me.",
      );
    }

    const isSecure = origin.startsWith("https://");

    const db = getDb();
    const zaloId = profile.id;
    const zaloName = profile.name ?? null;
    const zaloAvatarUrl = profile.picture?.data?.url ?? null;
    const zaloIsSensitive = typeof profile.is_sensitive === "boolean" ? profile.is_sensitive : null;
    const zaloRawProfile: Record<string, unknown> = { ...profile };

    // 1. Check if this Zalo account is already linked
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.zaloId, zaloId))
      .limit(1);

    let targetUser = existingUser;

    if (targetUser) {
      if (targetUser.status === "SUSPENDED") {
        return redirectWithError(
          origin,
          "/login",
          "ACCOUNT_SUSPENDED",
          "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.",
        );
      }

      const [updated] = await db
        .update(users)
        .set({ zaloName, zaloAvatarUrl, zaloIsSensitive, zaloRawProfile })
        .where(eq(users.id, targetUser.id))
        .returning();
      if (updated) targetUser = updated;
    } else if (inviteRawToken) {
      // 2. Link Zalo to an Admin-invited user via one-time token (ACTIVE immediately)
      const tokenHash = hashSessionToken(inviteRawToken);
      const now = new Date();

      const [inviteRow] = await db
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

      if (!inviteRow) {
        return redirectWithError(
          origin,
          "/login",
          "INVALID_INVITE",
          "Link kích hoạt đã hết hạn hoặc đã được sử dụng. Hãy nhắn Admin cấp link mới.",
        );
      }

      const activatedUser = await db.transaction(async (tx) => {
        const [u] = await tx
          .update(users)
          .set({
            zaloId,
            zaloName,
            zaloAvatarUrl,
            zaloIsSensitive,
            zaloRawProfile,
            status: "ACTIVE",
          })
          .where(eq(users.id, inviteRow.userId))
          .returning();

        await tx
          .update(inviteTokens)
          .set({ usedAt: now })
          .where(eq(inviteTokens.id, inviteRow.id));

        if (u) {
          await logAuditEvent(tx, {
            actorUserId: u.id,
            action: "ACTIVATE_INVITE_ZALO",
            targetType: "USER",
            targetId: u.id,
            metadata: { zaloId },
          });
        }
        return u;
      });

      if (!activatedUser) {
        return redirectWithError(origin, "/login", "ACTIVATE_FAILED", "Không thể kích hoạt tài khoản.");
      }
      targetUser = activatedUser;
    } else {
      // 3. Self sign-up via Zalo from shared group -> PENDING_APPROVAL
      const [created] = await db
        .insert(users)
        .values({
          zaloId,
          zaloName,
          zaloAvatarUrl,
          zaloIsSensitive,
          zaloRawProfile,
          role: "STAFF",
          status: "PENDING_APPROVAL",
        })
        .returning();

      if (!created) {
        return redirectWithError(origin, "/login", "CREATE_USER_FAILED", "Không thể tạo tài khoản.");
      }

      await logAuditEvent(db, {
        actorUserId: created.id,
        action: "SELF_SIGNUP_ZALO",
        targetType: "USER",
        targetId: created.id,
        metadata: { zaloId },
      });

      targetUser = created;
    }

    // Create DB-backed session cookie
    const { rawToken, expiresAt } = await createDbSession(targetUser.id);

    let destination = "/staff";
    if (targetUser.role === "ADMIN") {
      destination = nextPath?.startsWith("/admin") ? nextPath : "/admin";
    } else {
      const [existingProfile] = await db
        .select({ id: staffProfiles.id })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, targetUser.id))
        .limit(1);

      if (!existingProfile) {
        destination = "/onboarding";
      } else if (nextPath && nextPath.startsWith("/")) {
        destination = nextPath;
      }
    }

    const response = NextResponse.redirect(new URL(destination, origin));
    response.cookies.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    clearTempOAuthCookies(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi gọi Zalo API.";
    return redirectWithError(origin, fallbackErrorPath, "ZALO_REQUEST_FAILED", message);
  }
}
