import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, notifications } from "@/db";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import { createAuditLog } from "@/lib/audit";

function stockKey(productId: string) {
  return `stock:${productId}`;
}

export async function getStock(productId: string): Promise<number> {
  const cached = await cacheGet<number>(stockKey(productId));
  if (cached !== null) return cached;

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { quantity: true },
  });
  const qty = product?.quantity ?? 0;
  await cacheSet(stockKey(productId), qty, 3600);
  return qty;
}

export async function updateStock(
  productId: string,
  newQuantity: number,
  userId: string,
): Promise<void> {
  await db
    .update(products)
    .set({ quantity: newQuantity, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await cacheSet(stockKey(productId), newQuantity, 3600);

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { name: true, lowStockThreshold: true, storeId: true },
    with: { store: { columns: { ownerId: true } } },
  });

  if (product && newQuantity <= product.lowStockThreshold) {
    await db.insert(notifications).values({
      userId: product.store.ownerId,
      type: "low_stock",
      title: `Low stock: ${product.name}`,
      body: `Only ${newQuantity} left in stock`,
      data: { productId },
    });
  }

  await createAuditLog({
    userId,
    action: "product.stock_updated",
    resourceType: "product",
    resourceId: productId,
    metadata: { newQuantity },
  });
}

export async function invalidateStockCache(productId: string): Promise<void> {
  await cacheDel(stockKey(productId));
}
