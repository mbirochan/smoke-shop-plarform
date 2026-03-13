import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { stores, categories } from "@/db";
import { PLATFORM_NAME } from "@/lib/constants";
import { StorePageClient } from "./store-page-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), eq(stores.isActive, true)),
  });

  if (!store) {
    return { title: "Store Not Found" };
  }

  return {
    title: `${store.name} | ${PLATFORM_NAME}`,
    description:
      store.description ??
      `Shop ${store.name} in ${store.city}, ${store.state}. Licensed tobacco and vape products with local delivery.`,
    openGraph: {
      title: store.name,
      description: store.description ?? `Licensed smoke shop in ${store.city}, ${store.state}`,
      images: store.bannerUrl ? [{ url: store.bannerUrl }] : undefined,
    },
  };
}

export default async function StorePublicPage({ params }: Props) {
  const { slug } = await params;
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.slug, slug), eq(stores.isActive, true)),
  });

  if (!store) {
    notFound();
  }

  const allCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.sortOrder)],
  });

  return (
    <StorePageClient
      store={{
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        phone: store.phone,
        addressLine1: store.addressLine1,
        addressLine2: store.addressLine2,
        city: store.city,
        state: store.state,
        zip: store.zip,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        operatingHours: store.operatingHours as Record<string, { open: string; close: string; closed: boolean }> | null,
      }}
      categories={allCategories}
    />
  );
}
