import { type DbOrTx } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export interface LogAuditEventParams {
  actorUserId: string | null;
  action: string;
  targetType: "SHOW" | "REGISTRATION" | "USER";
  targetId: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(dbOrTx: DbOrTx, params: LogAuditEventParams) {
  await dbOrTx.insert(auditLogs).values({
    actorUserId: params.actorUserId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata ?? {},
  });
}
