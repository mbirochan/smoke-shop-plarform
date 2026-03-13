import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { users, referrals } from "@/db";
import { createAuditLog } from "@/lib/audit";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

export const referralRouter = router({
  // Get or create my referral code
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { referralCode: true, accountBalance: true },
    });

    if (user?.referralCode) {
      return { code: user.referralCode, balance: user.accountBalance ?? "0" };
    }

    // Generate a new unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateReferralCode();
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.referralCode, code),
        columns: { id: true },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    await ctx.db
      .update(users)
      .set({ referralCode: code, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { code, balance: user?.accountBalance ?? "0" };
  }),

  // Get referral history
  history: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const items = await ctx.db.query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
      with: {
        referred: { columns: { fullName: true, createdAt: true } },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      limit: 50,
    });

    // Mask referred user names
    const masked = items.map((r) => {
      const parts = r.referred?.fullName?.split(" ") ?? [];
      const displayName =
        parts.length > 1
          ? `${parts[0]} ${parts[parts.length - 1]?.[0]}.`
          : parts[0] ?? "User";
      return {
        id: r.id,
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
        referredName: displayName,
      };
    });

    return masked;
  }),

  // Validate referral code (used during registration)
  validate: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(6) }))
    .query(async ({ ctx, input }) => {
      const referrer = await ctx.db.query.users.findFirst({
        where: eq(users.referralCode, input.code.toUpperCase()),
        columns: { id: true },
      });
      return { valid: !!referrer && referrer.id !== ctx.session.user.id };
    }),

  // Process referral reward (called after first completed order)
  processReward: protectedProcedure
    .input(z.object({ referralId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const referral = await ctx.db.query.referrals.findFirst({
        where: and(eq(referrals.id, input.referralId), eq(referrals.status, "completed")),
      });

      if (!referral) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral not found" });
      }

      const rewardAmount = "5.00";

      // Credit both users
      await ctx.db
        .update(users)
        .set({
          accountBalance: sql`COALESCE(${users.accountBalance}, '0')::numeric + ${rewardAmount}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referral.referrerId));

      await ctx.db
        .update(users)
        .set({
          accountBalance: sql`COALESCE(${users.accountBalance}, '0')::numeric + ${rewardAmount}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referral.referredId));

      await ctx.db
        .update(referrals)
        .set({ status: "rewarded", rewardAmount })
        .where(eq(referrals.id, input.referralId));

      await createAuditLog({
        userId: referral.referrerId,
        action: "referral.rewarded",
        resourceType: "referral",
        resourceId: input.referralId,
        metadata: { referredId: referral.referredId, amount: rewardAmount },
      });

      return { success: true };
    }),
});
