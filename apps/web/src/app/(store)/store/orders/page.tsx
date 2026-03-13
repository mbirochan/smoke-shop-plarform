"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Clock, ChefHat, CheckCircle2, Truck, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "confirmed", label: "New" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  confirmed: { label: "New", className: "bg-blue-100 text-blue-800", icon: Clock },
  preparing: { label: "Preparing", className: "bg-amber-100 text-amber-800", icon: ChefHat },
  ready: { label: "Ready", className: "bg-green-100 text-green-800", icon: CheckCircle2 },
  out_for_delivery: { label: "Out for Delivery", className: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Delivered", className: "bg-gray-100 text-gray-800", icon: Package },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800", icon: XCircle },
};

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export default function StoreOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.storeOrder.list.useInfiniteQuery(
      { status: statusFilter, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View and manage incoming orders.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status];
              const BadgeIcon = badge?.icon ?? Package;
              return (
                <Link
                  key={order.id}
                  href={`/store/orders/${order.id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{order.orderNumber}</span>
                      {badge && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.customer?.fullName ?? "Customer"} &middot;{" "}
                      {order.items?.length ?? 0} item(s) &middot; ${order.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-lg font-semibold">${order.total}</div>
                </Link>
              );
            })}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full rounded-md border py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
