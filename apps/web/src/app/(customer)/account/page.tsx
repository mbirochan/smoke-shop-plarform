"use client";

import Link from "next/link";
import { ShieldCheck, ShieldAlert, ShieldX, Package, Loader2, ChevronRight, Heart, Users, Bell, ClipboardList } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  confirmed: { text: "Confirmed", className: "text-blue-600" },
  preparing: { text: "Preparing", className: "text-amber-600" },
  ready: { text: "Ready", className: "text-green-600" },
  out_for_delivery: { text: "Out for Delivery", className: "text-purple-600" },
  delivered: { text: "Delivered", className: "text-gray-600" },
  cancelled: { text: "Cancelled", className: "text-red-600" },
};

export default function AccountPage() {
  const { data: idvStatus } = trpc.idv.getStatus.useQuery();
  const { data: ordersData, isLoading: ordersLoading } =
    trpc.checkout.getMyOrders.useQuery({ limit: 10 });

  const idvVerified = idvStatus?.status === "verified" && !idvStatus?.expired;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Quick Links */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link href="/account/orders" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
          <ClipboardList className="h-4 w-4 text-muted-foreground" /> Orders
        </Link>
        <Link href="/account/favorites" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
          <Heart className="h-4 w-4 text-muted-foreground" /> Favorites
        </Link>
        <Link href="/account/referrals" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
          <Users className="h-4 w-4 text-muted-foreground" /> Referrals
        </Link>
        <Link href="/account/notifications" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent">
          <Bell className="h-4 w-4 text-muted-foreground" /> Notifications
        </Link>
      </div>

      {/* IDV Status Card */}
      <div className="mt-6 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {idvVerified ? (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            ) : idvStatus?.status === "rejected" ? (
              <ShieldX className="h-6 w-6 text-red-600" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p className="font-medium">Age Verification</p>
              <p className="text-sm text-muted-foreground">
                {idvVerified
                  ? "Verified"
                  : idvStatus?.expired
                    ? "Expired — re-verification needed"
                    : idvStatus?.status === "pending"
                      ? "Verification in progress"
                      : idvStatus?.status === "rejected"
                        ? "Verification failed"
                        : "Not yet verified"}
              </p>
            </div>
          </div>
          <Link
            href="/account/verification"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {idvVerified ? "View" : "Verify"}
          </Link>
        </div>
      </div>

      {/* Order History */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Order History</h2>

        {ordersLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !ordersData?.items.length ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No orders yet</p>
            <Link
              href="/stores"
              className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Browse Stores
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {ordersData.items.map((order) => {
              const statusInfo = STATUS_LABEL[order.status] ?? {
                text: order.status,
                className: "",
              };
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">#{order.orderNumber}</span>
                      <span className={`text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.store?.name} &middot;{" "}
                      {order.items?.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${order.total}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
