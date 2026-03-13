"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { useCurrentStore } from "@/hooks/use-current-store";
import { trpc } from "@/lib/trpc";

export default function StoreDashboardPage() {
  const router = useRouter();
  const { store, isLoading, hasStore, isPending, isActive, isSuspended } =
    useCurrentStore();

  const { data: summary } = trpc.storeAnalytics.summary.useQuery(undefined, {
    enabled: isActive,
  });
  const { data: topProducts } = trpc.storeAnalytics.topProducts.useQuery(undefined, {
    enabled: isActive,
  });
  const { data: recentReviews } = trpc.storeAnalytics.recentReviews.useQuery(undefined, {
    enabled: isActive,
  });
  const { data: lowStock } = trpc.storeAnalytics.lowStockProducts.useQuery(undefined, {
    enabled: isActive,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold">Welcome, Store Owner</h1>
        <p className="mt-2 text-muted-foreground">
          You haven&apos;t set up your store yet. Complete the onboarding wizard
          to get started.
        </p>
        <button
          onClick={() => router.push("/store/onboarding")}
          className="mt-6 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Start Onboarding
        </button>
      </div>
    );
  }

  return (
    <div>
      {isPending && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Pending Review
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your store is being reviewed by our team. You&apos;ll be notified
              once it&apos;s approved.
            </p>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">
              Store Suspended
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Your store has been suspended. Please contact support for more
              information.
            </p>
          </div>
        </div>
      )}

      {isActive && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Store Active
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your store is live and visible to customers.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold">{store?.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Store Dashboard</p>

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-sm">Active Products</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{summary?.activeProducts ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">Pending Orders</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{summary?.pendingOrders ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Today&apos;s Revenue</span>
          </div>
          <p className="mt-1 text-2xl font-bold">
            ${parseFloat(summary?.today.revenue ?? "0").toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary?.today.count ?? 0} orders
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Low Stock Items</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{summary?.lowStockProducts ?? 0}</p>
        </div>
      </div>

      {/* Revenue Summary + Top Products */}
      {isActive && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" /> Revenue Summary
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-medium">
                  ${parseFloat(summary?.week.revenue ?? "0").toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({summary?.week.count ?? 0} orders)
                  </span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-medium">
                  ${parseFloat(summary?.month.revenue ?? "0").toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({summary?.month.count ?? 0} orders)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Top Products</h3>
            {topProducts?.length ? (
              <div className="mt-3 space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate text-muted-foreground">{p.productName}</span>
                    <span className="font-medium">
                      {p.totalQty} sold &middot; ${parseFloat(p.totalRevenue).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No sales data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {isActive && lowStock && lowStock.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 p-4 dark:border-amber-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" /> Low Stock Alerts
          </h3>
          <div className="mt-2 space-y-1">
            {lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>
                  {p.name}
                  {p.sku && (
                    <span className="ml-1 text-xs text-muted-foreground">({p.sku})</span>
                  )}
                </span>
                <span className="font-medium text-amber-600">{p.quantity} left</span>
              </div>
            ))}
          </div>
          <Link
            href="/store/products"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Manage products
          </Link>
        </div>
      )}

      {/* Recent Reviews */}
      {isActive && recentReviews && recentReviews.length > 0 && (
        <div className="mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4" /> Recent Reviews
            </h3>
            <Link
              href="/store/reviews"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-2 space-y-2">
            {recentReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-2 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${
                        s <= r.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="flex-1 truncate text-muted-foreground">
                  {r.comment ?? "No comment"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isActive && (
        <div className="mt-8 rounded-lg border bg-muted/50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Limited Functionality</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Product management and orders will be available once your store
                is approved and active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
