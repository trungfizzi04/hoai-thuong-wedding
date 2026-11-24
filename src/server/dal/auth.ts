import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/server/db";
import { sessions, staffProfiles, users, type StaffProfile, type User } from "@/server/db/schema";

export const SESSION_COOKIE_NAME = "htw_session";
const DEFAULT_SESSION_DAYS = 60;

export class UnauthorizedError extends Error {
  constructor(message = "Bạn cần đăng nhập để thực hiện thao tác này.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthenticatedUser {
  user: User;
  profile: StaffProfile | null;
  sessionId: string;
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Create a DB-backed session and return the raw opaque token to set in an HttpOnly cookie.
 */
export async function createDbSession(userId: string, days = DEFAULT_SESSION_DAYS) {
  const db = getDb();
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const [created] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash,
      expiresAt,
    })
    .returning();

  return { rawToken, expiresAt, session: created };
}

export async function setSessionCookie(rawToken: string, expiresAt: Date) {
  const cookieStore = await cookies();
  const isSecure =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"));

  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function revokeSessionByRawToken(rawToken: string) {
  const db = getDb();
  const tokenHash = hashSessionToken(rawToken);
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)));
}

export async function revokeAllUserSessions(userId: string) {
  const db = getDb();
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * Verify current request session directly against PostgreSQL (`sessions` + `users.status`).
 * Never trust cookies or proxy.ts alone.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .select({
      sessionId: sessions.id,
      user: users,
      profile: staffProfiles,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (row.user.status === "SUSPENDED") return null;

  return {
    sessionId: row.sessionId,
    user: row.user,
    profile: row.profile ?? null,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const auth = await getCurrentUser();
  if (!auth) {
    throw new UnauthorizedError();
  }
  return auth;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const auth = await requireUser();
  if (auth.user.role !== "ADMIN" || auth.user.status !== "ACTIVE") {
    throw new ForbiddenError("Chỉ Quản trị viên mới có quyền thực hiện thao tác này.");
  }
  return auth;
}
