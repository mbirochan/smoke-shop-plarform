import { z } from "zod";

export const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const replyReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reply: z.string().min(1).max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
