import { z } from "zod";
import { eq, and, desc, lt } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { notifications } from "@/db";
import { getUnreadCount } from "../services/notifications";
import { cacheDel } from "@/lib/redis";

export const notificationRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return { count: await getUnreadCount(ctx.session.user.id) };
  }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(notifications.userId, ctx.session.user.id)];
      if (input.cursor) conditions.push(lt(notifications.id, input.cursor));

      const items = await ctx.db.query.notifications.findMany({
        where: and(...conditions),
        orderBy: [desc(notifications.createdAt)],
        limit: input.limit + 1,
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      return { items: data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(eq(notifications.id, input.id), eq(notifications.userId, ctx.session.user.id)),
        );
      await cacheDel(`notifications:unread:${ctx.session.user.id}`);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.session.user.id),
          eq(notifications.isRead, false),
        ),
      );
    await cacheDel(`notifications:unread:${ctx.session.user.id}`);
    return { success: true };
  }),
});
