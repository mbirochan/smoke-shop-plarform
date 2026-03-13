import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { orders, orderItems, products, users, stores, notifications } from "@/db";
import { checkoutSchema } from "@smoke-shop/validators";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit, checkoutRateLimit } from "@/lib/rate-limit";
import { generateOrderNumber, calculateTax, calculateDeliveryFee } from "../services/order";
import { invalidateStockCache } from "../services/inventory";

export const checkoutRouter = router({
  createOrder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().min(1),
          }),
        ).min(1),
        storeId: z.string().uuid(),
        checkout: checkoutSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 0. Rate limit
      const { success: rateLimitOk } = await checkRateLimit(
        `checkout:${userId}`,
        checkoutRateLimit,
      );
      if (!rateLimitOk) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many checkout attempts. Please try again later.",
        });
      }

      // 1. Check IDV status
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { idvStatus: true, idvVerifiedAt: true },
      });

      if (!user || user.idvStatus !== "verified") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Age verification required before checkout",
        });
      }

      // Check IDV not expired (365 days)
      if (user.idvVerifiedAt) {
        const daysSince =
          (Date.now() - user.idvVerifiedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 365) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Age verification expired. Please re-verify.",
          });
        }
      }

      // 2. Validate store is active
      const store = await ctx.db.query.stores.findFirst({
        where: and(eq(stores.id, input.storeId), eq(stores.isActive, true)),
      });
      if (!store) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Store not found or inactive" });
      }

      // 3. Fetch and validate all products + stock
      const productIds = input.items.map((i) => i.productId);
      const dbProducts = await ctx.db.query.products.findMany({
        where: and(
          inArray(products.id, productIds),
          eq(products.storeId, input.storeId),
          eq(products.isActive, true),
        ),
      });

      if (dbProducts.length !== input.items.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some products are unavailable",
        });
      }

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Validate stock
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product || product.quantity < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for ${product?.name ?? "product"}`,
          });
        }
      }

      // 4. Calculate totals server-side
      let subtotal = 0;
      const orderItemData: Array<{
        productId: string;
        productName: string;
        productPrice: string;
        quantity: number;
        subtotal: string;
      }> = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId)!;
        const itemSubtotal = parseFloat(product.price) * item.quantity;
        subtotal += itemSubtotal;

        orderItemData.push({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal.toFixed(2),
        });
      }

      const taxAmount = calculateTax(subtotal);
      const deliveryFee =
        input.checkout.deliveryType === "delivery" ? calculateDeliveryFee(3) : 0;
      const total = subtotal + taxAmount + deliveryFee;

      // 5. Generate order number
      const orderNumber = await generateOrderNumber();

      // 6. Create order + items in transaction
      const [order] = await ctx.db
        .insert(orders)
        .values({
          orderNumber,
          customerId: userId,
          storeId: input.storeId,
          status: "confirmed",
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: "card",
          paymentStatus: "authorized",
          paymentRef: input.checkout.paymentNonce,
          deliveryType: input.checkout.deliveryType,
          deliveryAddress: input.checkout.deliveryAddress ?? null,
          notes: input.checkout.notes,
        })
        .returning();

      if (!order) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create order" });
      }

      // Insert order items
      await ctx.db.insert(orderItems).values(
        orderItemData.map((item) => ({
          orderId: order.id,
          ...item,
        })),
      );

      // 7. Decrement stock
      for (const item of input.items) {
        const product = productMap.get(item.productId)!;
        const newQty = product.quantity - item.quantity;
        await ctx.db
          .update(products)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(products.id, item.productId));
        await invalidateStockCache(item.productId);
      }

      // 8. Notify store owner
      await ctx.db.insert(notifications).values({
        userId: store.ownerId,
        type: "new_order",
        title: `New order #${orderNumber}`,
        body: `${input.items.length} item(s) — $${total.toFixed(2)}`,
        data: { orderId: order.id, orderNumber },
      });

      // 9. Audit log
      await createAuditLog({
        userId,
        action: "order.created",
        resourceType: "order",
        resourceId: order.id,
        metadata: { orderNumber, total, itemCount: input.items.length },
      });

      return {
        orderId: order.id,
        orderNumber,
        total: total.toFixed(2),
      };
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.customerId, ctx.session.user.id),
        ),
        with: {
          items: true,
          store: { columns: { name: true, phone: true, addressLine1: true, city: true, state: true, zip: true } },
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return order;
    }),

  getMyOrders: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { lt, desc } = await import("drizzle-orm");
      const conditions = [eq(orders.customerId, ctx.session.user.id)];
      if (input.cursor) conditions.push(lt(orders.id, input.cursor));

      const items = await ctx.db.query.orders.findMany({
        where: and(...conditions),
        orderBy: [desc(orders.createdAt)],
        limit: input.limit + 1,
        with: {
          store: { columns: { name: true } },
          items: { columns: { productName: true, quantity: true, subtotal: true } },
        },
      });

      const hasMore = items.length > input.limit;
      const data = hasMore ? items.slice(0, input.limit) : items;
      return { items: data, nextCursor: hasMore ? data[data.length - 1]?.id : undefined };
    }),
});
