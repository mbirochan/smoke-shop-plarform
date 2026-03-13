import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { users } from "@/db";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const idvRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      columns: { idvStatus: true, idvVerifiedAt: true },
    });

    if (!user) return { status: "none" as const, expired: false };

    let expired = false;
    if (user.idvStatus === "verified" && user.idvVerifiedAt) {
      const daysSince =
        (Date.now() - user.idvVerifiedAt.getTime()) / (1000 * 60 * 60 * 24);
      expired = daysSince > 365;
    }

    return {
      status: user.idvStatus,
      expired,
      verifiedAt: user.idvVerifiedAt,
    };
  }),

  createSession: protectedProcedure.mutation(async ({ ctx }) => {
    // In production, this calls Veriff API to create a verification session
    // For development, we return a mock session URL
    const veriffApiKey = process.env.VERIFF_API_KEY;
    const veriffBaseUrl = process.env.VERIFF_BASE_URL ?? "https://stationapi.veriff.com";

    if (!veriffApiKey) {
      // Development mode: return mock
      logger.warn("Veriff not configured — returning mock session");
      return {
        sessionId: `mock-${Date.now()}`,
        sessionUrl: `/account/verification/mock`,
      };
    }

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      columns: { fullName: true },
    });

    const nameParts = (user?.fullName ?? "").split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const response = await fetch(`${veriffBaseUrl}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-CLIENT": veriffApiKey,
      },
      body: JSON.stringify({
        verification: {
          callback: `${process.env.NEXTAUTH_URL}/api/webhooks/veriff`,
          person: { firstName, lastName },
          vendorData: ctx.session.user.id,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create Veriff session");
    }

    const data = await response.json();

    await ctx.db
      .update(users)
      .set({ idvStatus: "pending", updatedAt: new Date() })
      .where(eq(users.id, ctx.session.user.id));

    await createAuditLog({
      userId: ctx.session.user.id,
      action: "idv.session_created",
      resourceType: "user",
      resourceId: ctx.session.user.id,
      metadata: { sessionId: data.verification?.id },
    });

    return {
      sessionId: data.verification?.id,
      sessionUrl: data.verification?.url,
    };
  }),

  // Dev-only: mock verification complete
  mockVerify: protectedProcedure.mutation(async ({ ctx }) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Mock verification not available in production");
    }

    await ctx.db
      .update(users)
      .set({
        idvStatus: "verified",
        idvVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.session.user.id));

    await createAuditLog({
      userId: ctx.session.user.id,
      action: "idv.mock_verified",
      resourceType: "user",
      resourceId: ctx.session.user.id,
    });

    return { status: "verified" as const };
  }),
});
