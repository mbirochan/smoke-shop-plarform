import { db } from "./db";
import { auditLogs } from "@/db";
import { logger } from "./logger";

interface AuditLogInput {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await db.insert(auditLogs).values({
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress,
    });
  } catch (error) {
    logger.error("Failed to create audit log", { error, input });
  }
}
