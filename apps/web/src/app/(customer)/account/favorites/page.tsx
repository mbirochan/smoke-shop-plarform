"use client";

import { Heart, Loader2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function FavoritesPage() {
  const { data: favorites, isLoading, refetch } = trpc.favorite.list.useQuery();
  const toggleFavorite = trpc.favorite.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Saved Products</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Products you&apos;ve saved for later.
      </p>

      {!favorites?.length ? (
        <div className="mt-8 flex flex-col items-center rounded-lg border py-12 text-center text-muted-foreground">
          <Heart className="h-12 w-12" />
          <p className="mt-3">No saved products yet</p>
          <Link
            href="/stores"
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Browse Stores
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {favorites.map((fav) => {
            const product = fav.product;
            if (!product) return null;
            const images = (product.images ?? []) as Array<{ url: string }>;
            const inStock = product.quantity > 0;

            return (
              <div key={fav.id} className="rounded-lg border p-3">
                <div className="flex gap-3">
                  {images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images[0].url}
                      alt={product.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/stores/${product.store?.slug ?? ""}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {product.store?.name}
                    </Link>
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm">${product.price}</p>
                    <span
                      className={`text-xs ${inStock ? "text-green-600" : "text-red-600"}`}
                    >
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => toggleFavorite.mutate({ productId: product.id })}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent"
                  >
                    <Heart className="h-3 w-3 fill-current" /> Remove
                  </button>
                  <button
                    disabled={!inStock}
                    className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3 w-3" /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
