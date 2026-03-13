"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  operatingHours: Record<string, { open: string; close: string; closed: boolean }> | null;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface StorePageClientProps {
  store: StoreInfo;
  categories: CategoryInfo[];
}

function getOpenStatus(hours: StoreInfo["operatingHours"]): { open: boolean; label: string } {
  if (!hours) return { open: false, label: "Hours unavailable" };
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const day = days[now.getDay()];
  if (!day || !hours[day]) return { open: false, label: "Closed" };
  const h = hours[day];
  if (h.closed) return { open: false, label: "Closed today" };
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (time >= h.open && time <= h.close) return { open: true, label: `Open · Closes at ${h.close}` };
  return { open: false, label: `Closed · Opens at ${h.open}` };
}

const STOCK_BADGES = {
  in_stock: { label: "In Stock", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  low_stock: { label: "Low Stock", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function StorePageClient({ store, categories }: StorePageClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "newest">("name");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.customerStore.getProducts.useInfiniteQuery(
      {
        storeId: store.id,
        categoryId: selectedCategory,
        search: search || undefined,
        sortBy,
        limit: 20,
      },
      { getNextPageParam: (last) => last.nextCursor },
    );

  const products = data?.pages.flatMap((p) => p.items) ?? [];
  const status = getOpenStatus(store.operatingHours);

  // Only show categories that have a parentId (subcategories) plus top-level
  const topCategories = categories.filter((c) => !c.parentId);

  return (
    <div>
      {/* Banner */}
      {store.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.bannerUrl}
          alt={`${store.name} banner`}
          className="h-48 w-full rounded-lg object-cover md:h-64"
        />
      ) : (
        <div className="h-48 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 md:h-64" />
      )}

      {/* Store header */}
      <div className="mt-4 flex flex-wrap items-start gap-4">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logoUrl}
            alt={store.name}
            className="-mt-12 h-24 w-24 rounded-xl border-4 border-background object-cover"
          />
        ) : (
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-xl border-4 border-background bg-muted text-2xl font-bold">
            {store.name[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                status.open
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {status.open ? "Open" : "Closed"}
            </span>
          </div>
          {store.description && (
            <p className="mt-1 text-sm text-muted-foreground">{store.description}</p>
          )}
        </div>
      </div>

      {/* Info bar */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {store.addressLine1}, {store.city}, {store.state} {store.zip}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-4 w-4" />
          {store.phone}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {status.label}
        </span>
      </div>

      {/* Category tabs + search + sort */}
      <div className="sticky top-0 z-10 mt-6 space-y-3 bg-background pb-3 pt-3">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
            }`}
          >
            All
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "border hover:bg-accent"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="name">Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="h-40 rounded bg-muted" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No products found.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const images = (product.images ?? []) as Array<{ url: string }>;
              const badge = STOCK_BADGES[product.stockStatus];
              return (
                <div key={product.id} className="rounded-lg border p-4">
                  {images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images[0].url}
                      alt={product.name}
                      className="h-40 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <h3 className="mt-3 font-medium leading-tight">{product.name}</h3>
                  {product.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.category.name}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold">${product.price}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  {product.compareAtPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${product.compareAtPrice}
                    </span>
                  )}
                  <button
                    disabled
                    className="mt-3 w-full rounded-md border py-2 text-sm text-muted-foreground"
                    title="Coming soon"
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-md border px-6 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
