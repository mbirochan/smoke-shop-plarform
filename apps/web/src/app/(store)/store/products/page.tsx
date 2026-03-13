"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCurrentStore } from "@/hooks/use-current-store";

const STOCK_FILTERS = [
  { label: "All", value: "all" as const },
  { label: "In Stock", value: "in_stock" as const },
  { label: "Low Stock", value: "low_stock" as const },
  { label: "Out of Stock", value: "out_of_stock" as const },
];

export default function StoreProductsPage() {
  const { hasStore } = useCurrentStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const debounceTimer = useCallback(() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setDebouncedSearch(value), 300);
    };
  }, [])();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.storeProduct.list.useInfiniteQuery(
      { limit: 20, search: debouncedSearch || undefined, stockStatus: stockFilter },
      {
        enabled: hasStore,
        getNextPageParam: (last) => last.nextCursor,
      },
    );

  const utils = trpc.useUtils();

  const updateStockMutation = trpc.storeProduct.updateStock.useMutation({
    onSuccess: () => utils.storeProduct.list.invalidate(),
  });

  const bulkMutation = trpc.storeProduct.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.storeProduct.list.invalidate();
      setSelectedIds(new Set());
    },
  });

  const allProducts = data?.pages.flatMap((p) => p.items) ?? [];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === allProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allProducts.map((p) => p.id)));
    }
  }

  function exportCsv() {
    const header = "name,category,price,quantity,brand,sku,status\n";
    const rows = allProducts
      .map((p) =>
        [p.name, p.category?.name ?? "", p.price, p.quantity, p.brand ?? "", p.sku ?? "", p.isActive ? "active" : "inactive"].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasStore) {
    return <p className="text-muted-foreground">Complete store setup to manage products.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
          <Link
            href="/store/products/import"
            className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            Import CSV
          </Link>
          <Link
            href="/store/products/new"
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debounceTimer(e.target.value);
            }}
            placeholder="Search products..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex rounded-md border">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStockFilter(f.value)}
              className={`px-3 py-2 text-xs ${stockFilter === f.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-md border bg-muted/50 p-2">
          <span className="text-sm">{selectedIds.size} selected</span>
          <button
            onClick={() => bulkMutation.mutate({ productIds: [...selectedIds], isActive: true })}
            className="rounded border px-2 py-1 text-xs hover:bg-accent"
          >
            Activate
          </button>
          <button
            onClick={() => bulkMutation.mutate({ productIds: [...selectedIds], isActive: false })}
            className="rounded border px-2 py-1 text-xs hover:bg-accent"
          >
            Deactivate
          </button>
        </div>
      )}

      {/* Product table */}
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === allProducts.length && allProducts.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : allProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No products found. Add your first product to get started.
                </td>
              </tr>
            ) : (
              allProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selected={selectedIds.has(product.id)}
                  onToggle={() => toggleSelect(product.id)}
                  onStockUpdate={(qty) =>
                    updateStockMutation.mutate({ productId: product.id, quantity: qty })
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="mt-4 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <Loader2 className="inline h-4 w-4 animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  selected,
  onToggle,
  onStockUpdate,
}: {
  product: {
    id: string;
    name: string;
    price: string;
    quantity: number;
    isActive: boolean;
    images: unknown;
    category?: { name: string } | null;
  };
  selected: boolean;
  onToggle: () => void;
  onStockUpdate: (qty: number) => void;
}) {
  const [editingStock, setEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(String(product.quantity));
  const images = (product.images ?? []) as Array<{ url: string }>;

  return (
    <tr className="border-b hover:bg-muted/30">
      <td className="p-3">
        <input type="checkbox" checked={selected} onChange={onToggle} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0].url}
              alt={product.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No img
            </div>
          )}
          <Link href={`/store/products/${product.id}`} className="font-medium hover:underline">
            {product.name}
          </Link>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{product.category?.name ?? "—"}</td>
      <td className="p-3 text-right">${product.price}</td>
      <td className="p-3 text-right">
        {editingStock ? (
          <input
            type="number"
            min={0}
            value={stockValue}
            onChange={(e) => setStockValue(e.target.value)}
            onBlur={() => {
              const qty = parseInt(stockValue, 10);
              if (!isNaN(qty) && qty >= 0 && qty !== product.quantity) {
                onStockUpdate(qty);
              }
              setEditingStock(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingStock(false);
            }}
            className="w-20 rounded border bg-background px-2 py-1 text-right text-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setStockValue(String(product.quantity));
              setEditingStock(true);
            }}
            className="cursor-pointer rounded px-2 py-1 hover:bg-accent"
          >
            {product.quantity}
          </button>
        )}
      </td>
      <td className="p-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            product.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-3">
        <Link href={`/store/products/${product.id}`} className="text-xs text-primary hover:underline">
          Edit
        </Link>
      </td>
    </tr>
  );
}
