import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export interface TRPCContext {
  db: typeof db;
  session: Session | null;
}

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await auth();
  return { db, session };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  if (ctx.session.user.role !== "platform_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});

export const storeProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const role = ctx.session.user.role;
  if (role !== "store_owner" && role !== "store_staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Store access required" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});
