import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hmac-signature");
  const secret = process.env.VERIFF_WEBHOOK_SECRET;

  // Verify webhook signature
  if (secret && signature) {
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSig) {
      logger.warn("Invalid Veriff webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);
  const { verification } = payload;

  if (!verification?.vendorData || !verification?.status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = verification.vendorData;
  const status = verification.status;
  const sessionId = verification.id;

  let idvStatus: "verified" | "rejected" = "rejected";
  if (status === "approved") {
    idvStatus = "verified";
  }

  await db
    .update(users)
    .set({
      idvStatus,
      idvVerifiedAt: idvStatus === "verified" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await createAuditLog({
    userId,
    action: `idv.${idvStatus}`,
    resourceType: "user",
    resourceId: userId,
    metadata: { sessionId, veriffStatus: status },
  });

  logger.info("Veriff webhook processed", { userId, status: idvStatus, sessionId });

  return NextResponse.json({ received: true });
}
