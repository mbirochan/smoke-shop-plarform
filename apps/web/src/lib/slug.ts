import { sql } from "drizzle-orm";
import { db } from "./db";
import { stores } from "@/db";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function generateUniqueStoreSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name);

  const existing = await db
    .select({ slug: stores.slug })
    .from(stores)
    .where(sql`${stores.slug} = ${baseSlug} OR ${stores.slug} LIKE ${baseSlug + "-%"}`);

  if (existing.length === 0) return baseSlug;

  const slugs = new Set(existing.map((r) => r.slug));
  let counter = 2;
  while (slugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}
