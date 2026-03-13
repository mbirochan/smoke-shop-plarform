"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { trpc } from "@/lib/trpc";

type DeliveryType = "pickup" | "delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, storeId, storeName, getSubtotal, clearCart } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "TX",
    zip: "",
  });
  const [notes, setNotes] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const taxRate = 0.0825;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const deliveryFee = deliveryType === "delivery" ? 4.99 : 0;
  const total = subtotal + tax + deliveryFee;

  const { data: idvStatus } = trpc.idv.getStatus.useQuery();
  const createOrder = trpc.checkout.createOrder.useMutation();

  const idvVerified = idvStatus?.status === "verified" && !idvStatus?.expired;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Your cart is empty</p>
        <Link
          href="/stores"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Browse Stores
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!idvVerified) {
      setError("Age verification required before checkout.");
      return;
    }

    if (!storeId) {
      setError("No store selected.");
      return;
    }

    // Basic card validation
    if (!cardNumber || !cardExpiry || !cardCvc) {
      setError("Please fill in all payment fields.");
      return;
    }

    if (deliveryType === "delivery") {
      if (!address.line1 || !address.city || !address.zip) {
        setError("Please fill in the delivery address.");
        return;
      }
    }

    setSubmitting(true);

    try {
      // In production, Accept.js would tokenize the card here.
      // For dev, we use a mock nonce.
      const paymentNonce = `mock-nonce-${Date.now()}`;

      const result = await createOrder.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        storeId,
        checkout: {
          deliveryType,
          deliveryAddress: deliveryType === "delivery" ? address : undefined,
          paymentNonce,
          notes: notes || undefined,
        },
      });

      clearCart();
      router.push(`/orders/${result.orderId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to place order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/stores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shopping
      </Link>

      <h1 className="text-2xl font-bold">Checkout</h1>
      {storeName && (
        <p className="mt-1 text-sm text-muted-foreground">
          Order from {storeName}
        </p>
      )}

      {!idvVerified && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Age Verification Required
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Texas law requires age verification for tobacco and vape purchases.
                This is a one-time verification that takes about 60 seconds.
              </p>
              <Link
                href="/account/verification"
                className="mt-2 inline-block rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Verify My Age
              </Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Order Summary */}
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="mt-3 divide-y">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    No img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (8.25%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {deliveryType === "delivery" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-1 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Delivery Method */}
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Delivery Method
          </h2>
          <div className="mt-3 flex gap-3">
            <label
              className={`flex-1 cursor-pointer rounded-md border p-3 text-center text-sm transition-colors ${
                deliveryType === "pickup"
                  ? "border-primary bg-primary/5 font-medium"
                  : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="deliveryType"
                value="pickup"
                checked={deliveryType === "pickup"}
                onChange={() => setDeliveryType("pickup")}
                className="sr-only"
              />
              Pickup (Free)
            </label>
            <label
              className={`flex-1 cursor-pointer rounded-md border p-3 text-center text-sm transition-colors ${
                deliveryType === "delivery"
                  ? "border-primary bg-primary/5 font-medium"
                  : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="deliveryType"
                value="delivery"
                checked={deliveryType === "delivery"}
                onChange={() => setDeliveryType("delivery")}
                className="sr-only"
              />
              Delivery ($4.99)
            </label>
          </div>

          {deliveryType === "delivery" && (
            <div className="mt-4 space-y-3">
              <input
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                placeholder="Address line 1"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                placeholder="Address line 2 (optional)"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })
                  }
                  placeholder="State"
                  maxLength={2}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={address.zip}
                  onChange={(e) =>
                    setAddress({ ...address, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
                  }
                  placeholder="ZIP"
                  maxLength={5}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
          )}
        </section>

        {/* Order Notes */}
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">Order Notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            maxLength={500}
            rows={2}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </section>

        {/* Payment */}
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Card info is tokenized securely. We never see your card details.
          </p>
          <div className="mt-3 space-y-3">
            <input
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16)
                    .replace(/(\d{4})/g, "$1 ")
                    .trim(),
                )
              }
              placeholder="Card number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              autoComplete="cc-number"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                value={cardExpiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                  setCardExpiry(val);
                }}
                placeholder="MM/YY"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                autoComplete="cc-exp"
              />
              <input
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="CVC"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                autoComplete="cc-csc"
              />
              <input
                value={billingZip}
                onChange={(e) =>
                  setBillingZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                placeholder="Billing ZIP"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                autoComplete="postal-code"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !idvVerified}
          className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </span>
          ) : (
            `Place Order — $${total.toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  );
}
