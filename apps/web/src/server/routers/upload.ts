import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  getPresignedUploadUrl,
  generateUploadKey,
} from "@/lib/upload";

const uploadBuckets = ["store-logos", "store-banners", "license-docs", "product-images"] as const;

export const uploadRouter = router({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        bucket: z.enum(uploadBuckets),
        filename: z.string().min(1),
        contentType: z.string().min(1),
        entityId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entityType =
        input.bucket === "product-images" ? "products" : "stores";
      const entityId = input.entityId ?? ctx.session.user.id;
      const key = generateUploadKey(entityType, entityId, input.filename);

      const result = await getPresignedUploadUrl({
        bucket: input.bucket,
        key,
        contentType: input.contentType,
      });

      return result;
    }),
});
