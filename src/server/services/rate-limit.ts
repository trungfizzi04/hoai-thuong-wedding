import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { loginAttempts } from "@/server/db/schema";

const MAX_PAIR_FAILURES = 5;
const GLOBAL_DELAY_THRESHOLD = 10;
const GLOBAL_WINDOW_MS = 15 * 60 * 1000;

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  delayMs: number;
}

/**
 * 2-tier login rate limit on `login_attempts`:
 * - Tier 1: Per (identifier, ipAddress) pair -> temporary lockout with exponential backoff (5m -> 15m -> 60m) after 5 fails.
 * - Tier 2: Global failures for `identifier` across all IPs in last 15 min -> progressive delay (1–3s) to slow distributed brute-force without locking out the legitimate user.
 */
export async function checkLoginRateLimit(
  identifier: string,
  ipAddress: string,
): Promise<RateLimitCheckResult> {
  const db = getDb();
  const now = new Date();

  const [pairRow] = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.identifier, identifier), eq(loginAttempts.ipAddress, ipAddress)))
    .limit(1);

  if (pairRow?.lockedUntil && pairRow.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((pairRow.lockedUntil.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds, delayMs: 0 };
  }

  const windowStart = new Date(now.getTime() - GLOBAL_WINDOW_MS);
  const [agg] = await db
    .select({
      totalFails: sql<number>`coalesce(sum(${loginAttempts.failCount}), 0)::int`,
    })
    .from(loginAttempts)
    .where(
      and(eq(loginAttempts.identifier, identifier), gt(loginAttempts.updatedAt, windowStart)),
    );

  const totalFails = agg?.totalFails ?? 0;
  let delayMs = 0;
  if (totalFails >= GLOBAL_DELAY_THRESHOLD) {
    delayMs = Math.min(3000, 1000 + (totalFails - GLOBAL_DELAY_THRESHOLD) * 250);
  }

  return { allowed: true, delayMs };
}

export async function recordFailedLogin(identifier: string, ipAddress: string): Promise<void> {
  const db = getDb();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.identifier, identifier), eq(loginAttempts.ipAddress, ipAddress)))
    .limit(1);

  const nextCount = (existing?.failCount ?? 0) + 1;
  let lockedUntil: Date | null = null;

  if (nextCount >= MAX_PAIR_FAILURES) {
    const step = nextCount - MAX_PAIR_FAILURES;
    const lockMinutes = step === 0 ? 5 : step === 1 ? 15 : 60;
    lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);
  }

  await db
    .insert(loginAttempts)
    .values({
      identifier,
      ipAddress,
      failCount: nextCount,
      lockedUntil,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [loginAttempts.identifier, loginAttempts.ipAddress],
      set: {
        failCount: nextCount,
        lockedUntil,
        updatedAt: now,
      },
    });
}

export async function clearFailedLogin(identifier: string, ipAddress: string): Promise<void> {
  const db = getDb();
  await db
    .update(loginAttempts)
    .set({ failCount: 0, lockedUntil: null, updatedAt: new Date() })
    .where(and(eq(loginAttempts.identifier, identifier), eq(loginAttempts.ipAddress, ipAddress)));
}
