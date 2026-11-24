import { eq } from "drizzle-orm";
import { getDb, type DbTransaction } from "@/server/db";
import { shows, type Show } from "@/server/db/schema";

export class ShowNotFoundError extends Error {
  constructor(showId: string) {
    super(`Show not found: ${showId}`);
    this.name = "ShowNotFoundError";
  }
}

/**
 * Lock the target `shows` row with `SELECT ... FOR UPDATE` inside a PostgreSQL transaction.
 * All 5 slot-mutating paths (approve, unapprove, staff cancel >= 24h, edit slots, mark NO_SHOW)
 * MUST execute through this helper to guarantee strict concurrency safety.
 */
export async function withLockedShow<T>(
  showId: string,
  callback: (tx: DbTransaction, lockedShow: Show) => Promise<T>,
): Promise<T> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [lockedShow] = await tx
      .select()
      .from(shows)
      .where(eq(shows.id, showId))
      .for("update");

    if (!lockedShow) {
      throw new ShowNotFoundError(showId);
    }

    return callback(tx, lockedShow);
  });
}
