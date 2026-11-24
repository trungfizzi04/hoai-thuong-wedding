import { NextResponse } from "next/server";
import { getPool } from "@/server/db";

export async function GET() {
  let database: "ok" | "unconfigured" | "error" = "unconfigured";

  if (process.env.DATABASE_URL) {
    try {
      const pool = getPool();
      await pool.query("SELECT 1");
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const statusCode = database === "error" ? 503 : 200;

  return NextResponse.json(
    {
      status: database === "error" ? "degraded" : "ok",
      service: "hoai-thuong-wedding",
      database,
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
