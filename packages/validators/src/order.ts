import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  storeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const deliveryAddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

export const checkoutSchema = z.object({
  deliveryType: z.enum(["pickup", "delivery"]),
  deliveryAddress: deliveryAddressSchema.optional(),
  paymentNonce: z.string().min(1, "Payment information is required"),
  paymentDescriptor: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
