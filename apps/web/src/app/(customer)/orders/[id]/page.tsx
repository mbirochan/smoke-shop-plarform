"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Loader2,
  MapPin,
  Phone,
  Store,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const STATUS_FLOW = [
  { key: "confirmed", label: "Confirmed", icon: Clock, description: "Your order has been confirmed" },
  { key: "preparing", label: "Preparing", icon: ChefHat, description: "The store is preparing your order" },
  { key: "ready", label: "Ready", icon: CheckCircle2, description: "Your order is ready" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: Package, description: "Your order has been delivered" },
];

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading } = trpc.checkout.getOrder.useQuery(
    { orderId },
    { refetchInterval: 30000 },
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/account" className="mt-2 text-sm text-primary hover:underline">
          Back to account
        </Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>

      <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      {/* Status Progress Bar */}
      {isCancelled ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Order Cancelled</span>
          </div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            This order has been cancelled. If you were charged, a refund will be processed.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Order Status</h2>
          <div className="mt-4 space-y-4">
            {STATUS_FLOW.map((step, i) => {
              const StepIcon = step.icon;
              const isComplete = i < currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              const isPending = i > currentStatusIndex;

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className={`mt-1 h-6 w-0.5 ${
                          isComplete ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className={isPending ? "opacity-40" : ""}>
                    <p
                      className={`text-sm font-medium ${
                        isCurrent ? "text-primary" : ""
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Store Info */}
      {order.store && (
        <div className="mt-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Store className="h-4 w-4" /> Store
          </h2>
          <p className="mt-1 text-sm">{order.store.name}</p>
          {order.store.addressLine1 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {order.store.addressLine1}, {order.store.city}, {order.store.state} {order.store.zip}
            </p>
          )}
          {order.store.phone && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> {order.store.phone}
            </p>
          )}
        </div>
      )}

      {/* Delivery Info */}
      <div className="mt-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">
          {order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
        </h2>
        {order.deliveryType === "delivery" && order.deliveryAddress != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            {(order.deliveryAddress as { line1: string }).line1},{" "}
            {(order.deliveryAddress as { city: string }).city},{" "}
            {(order.deliveryAddress as { state: string }).state}{" "}
            {(order.deliveryAddress as { zip: string }).zip}
          </p>
        )}
        {order.deliveryType === "pickup" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up at the store when your order is ready.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="mt-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Items</h2>
        <div className="mt-2 divide-y">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between py-2 text-sm">
              <span>
                {item.productName} &times; {item.quantity}
              </span>
              <span>${item.subtotal}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${order.subtotal}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>${order.taxAmount}</span>
          </div>
          {parseFloat(order.deliveryFee ?? "0") > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>${order.deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total</span>
            <span>${order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
