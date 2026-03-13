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
  Phone,
  Mail,
  User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const STATUS_FLOW = [
  { key: "confirmed", label: "Confirmed", icon: Clock },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: CheckCircle2 },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

const ACTIONS: Record<string, Array<{ status: string; label: string; variant: "primary" | "destructive" }>> = {
  confirmed: [
    { status: "preparing", label: "Start Preparing", variant: "primary" },
    { status: "cancelled", label: "Cancel Order", variant: "destructive" },
  ],
  preparing: [
    { status: "ready", label: "Mark Ready", variant: "primary" },
    { status: "cancelled", label: "Cancel Order", variant: "destructive" },
  ],
  ready: [
    { status: "out_for_delivery", label: "Dispatch Delivery", variant: "primary" },
    { status: "delivered", label: "Mark Picked Up", variant: "primary" },
    { status: "cancelled", label: "Cancel Order", variant: "destructive" },
  ],
  out_for_delivery: [
    { status: "delivered", label: "Mark Delivered", variant: "primary" },
  ],
};

export default function StoreOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: order, isLoading, refetch } = trpc.storeOrder.getById.useQuery({ id: orderId });
  const updateStatus = trpc.storeOrder.updateStatus.useMutation();

  async function handleStatusUpdate(newStatus: string) {
    setUpdating(newStatus);
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus as "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled" });
      await refetch();
    } finally {
      setUpdating(null);
    }
  }

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
        <Link href="/store/orders" className="mt-2 text-sm text-primary hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const actions = ACTIONS[order.status] ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/store/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        {isCancelled && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            <XCircle className="h-4 w-4" /> Cancelled
          </span>
        )}
      </div>

      {/* Status Progress */}
      {!isCancelled && (
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Order Progress</h2>
          <div className="mt-3 flex items-center gap-2">
            {STATUS_FLOW.map((step, i) => {
              const StepIcon = step.icon;
              const isComplete = i <= currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 ${
                        i <= currentStatusIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isComplete
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              disabled={updating !== null}
              className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                action.variant === "destructive"
                  ? "border border-destructive text-destructive hover:bg-destructive/10"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {updating === action.status ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </span>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      )}

      {/* Customer Info */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Customer</h2>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{order.customer?.fullName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{order.customer?.email ?? "—"}</span>
          </div>
          {order.customer?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Info */}
      <div className="mt-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Delivery</h2>
        <p className="mt-1 text-sm capitalize">{order.deliveryType}</p>
        {order.deliveryType === "delivery" && order.deliveryAddress != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            {(order.deliveryAddress as { line1: string }).line1},{" "}
            {(order.deliveryAddress as { city: string }).city},{" "}
            {(order.deliveryAddress as { state: string }).state}{" "}
            {(order.deliveryAddress as { zip: string }).zip}
          </p>
        )}
        {order.notes != null && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            Note: {String(order.notes)}
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

      {/* Payment Info */}
      <div className="mt-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Payment</h2>
        <div className="mt-1 text-sm">
          <span className="capitalize">{order.paymentMethod}</span> &middot;{" "}
          <span className="capitalize">{order.paymentStatus}</span>
        </div>
      </div>
    </div>
  );
}
