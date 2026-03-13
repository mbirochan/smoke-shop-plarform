"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Loader2, RotateCcw, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  confirmed: { text: "Confirmed", className: "text-blue-600" },
  preparing: { text: "Preparing", className: "text-amber-600" },
  ready: { text: "Ready", className: "text-green-600" },
  out_for_delivery: { text: "Out for Delivery", className: "text-purple-600" },
  delivered: { text: "Delivered", className: "text-gray-600" },
  cancelled: { text: "Cancelled", className: "text-red-600" },
};

const ACTIVE_STATUSES = ["confirmed", "preparing", "ready", "out_for_delivery"];
const COMPLETED_STATUSES = ["delivered"];

type FilterValue = (typeof STATUS_FILTERS)[number]["value"];

export default function OrderHistoryPage() {
  const [filter, setFilter] = useState<FilterValue>("all");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.checkout.getMyOrders.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const allOrders = data?.pages.flatMap((p) => p.items) ?? [];

  const orders = allOrders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE_STATUSES.includes(o.status);
    if (filter === "completed") return COMPLETED_STATUSES.includes(o.status);
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Order History</h1>

      <div className="mt-4 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Package className="h-10 w-10" />
            <p className="mt-2">No orders found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const statusInfo = STATUS_LABEL[order.status] ?? {
                text: order.status,
                className: "",
              };
              const isDelivered = order.status === "delivered";

              return (
                <div key={order.id} className="rounded-lg border p-4">
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between hover:underline"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">#{order.orderNumber}</span>
                      <span className={`text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <span className="text-sm font-medium">${order.total}</span>
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.store?.name} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.items?.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </p>

                  {isDelivered && (
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={`/orders/${order.id}/review`}
                        className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Star className="h-3 w-3" /> Leave Review
                      </Link>
                      <button className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent">
                        <RotateCcw className="h-3 w-3" /> Order Again
                      </button>
                    </div>
                  )}
                </div>
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
