import "dotenv/config";
import { getDb, getPool } from "./index";
import { shows } from "./schema";
import { withLockedShow } from "../services/show-lock";

/**
 * Concurrency test: prove `SELECT ... FROM shows WHERE id = $1 FOR UPDATE`
 * properly serializes 2 concurrent transactions on Neon Pooled (`DATABASE_URL`).
 */
async function runLockTest() {
  const db = getDb();
  const [sampleShow] = await db.select().from(shows).limit(1);

  if (!sampleShow) {
    throw new Error("No show found in DB. Run `pnpm db:seed` first.");
  }

  console.log(`Testing FOR UPDATE row lock on show ${sampleShow.id} via Neon Pooled...`);

  const events: string[] = [];
  const start = Date.now();
  const elapsed = () => `${Date.now() - start}ms`;

  const tx1 = withLockedShow(sampleShow.id, async (_tx, locked) => {
    events.push(`TX1 acquired lock on "${locked.title}" at ${elapsed()}`);
    await new Promise((resolve) => setTimeout(resolve, 600));
    events.push(`TX1 releasing lock at ${elapsed()}`);
    return "TX1_DONE";
  });

  // Start TX2 100ms after TX1 so TX1 is guaranteed to hold the row lock first.
  const tx2 = new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      withLockedShow(sampleShow.id, async () => {
        events.push(`TX2 acquired lock at ${elapsed()}`);
        events.push(`TX2 releasing lock at ${elapsed()}`);
        return "TX2_DONE";
      })
        .then(resolve)
        .catch(reject);
    }, 100);
  });

  const results = await Promise.all([tx1, tx2]);

  console.log("Execution timeline:");
  for (const line of events) {
    console.log("  -", line);
  }

  const tx1ReleaseIdx = events.findIndex((e) => e.startsWith("TX1 releasing"));
  const tx2AcquireIdx = events.findIndex((e) => e.startsWith("TX2 acquired"));

  if (tx1ReleaseIdx === -1 || tx2AcquireIdx === -1 || tx2AcquireIdx < tx1ReleaseIdx) {
    throw new Error("LOCK TEST FAILED: TX2 acquired lock before TX1 released it!");
  }

  console.log("PASS: TX2 waited strictly until TX1 released the FOR UPDATE row lock!", results);
  await getPool().end();
}

runLockTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
