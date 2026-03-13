"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function AdminStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);

  const { data: store, isLoading } = trpc.adminStore.getById.useQuery({ id: params.id });

  const approveMutation = trpc.adminStore.approve.useMutation({
    onSuccess: () => {
      utils.adminStore.getById.invalidate({ id: params.id });
    },
  });

  const suspendMutation = trpc.adminStore.suspend.useMutation({
    onSuccess: () => {
      utils.adminStore.getById.invalidate({ id: params.id });
      setShowSuspend(false);
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!store) return <p className="text-sm text-muted-foreground">Store not found.</p>;

  const isPending = !store.isActive && !store.isVerified;
  const isActive = store.isActive && store.isVerified;
  const isSuspended = !store.isActive && store.isVerified;

  return (
    <div>
      <button onClick={() => router.push("/admin/stores")} className="mb-4 text-sm text-muted-foreground hover:underline">
        &larr; Back to stores
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <div className="flex gap-2">
          {isPending && (
            <button
              onClick={() => approveMutation.mutate({ id: store.id })}
              disabled={approveMutation.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </button>
          )}
          {isActive && (
            <button
              onClick={() => setShowSuspend(!showSuspend)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Suspend
            </button>
          )}
          {isSuspended && (
            <button
              onClick={() => approveMutation.mutate({ id: store.id })}
              disabled={approveMutation.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Reactivate
            </button>
          )}
        </div>
      </div>

      {showSuspend && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-medium text-red-800">Suspend this store?</p>
          <input
            type="text"
            placeholder="Reason (optional)"
            className="mb-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => suspendMutation.mutate({ id: store.id, reason: suspendReason || undefined })}
              disabled={suspendMutation.isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Suspend
            </button>
            <button onClick={() => setShowSuspend(false)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Section title="Contact">
          <Field label="Email" value={store.email} />
          <Field label="Phone" value={store.phone} />
        </Section>

        <Section title="Location">
          <Field label="Address" value={`${store.addressLine1}${store.addressLine2 ? `, ${store.addressLine2}` : ""}`} />
          <Field label="City" value={`${store.city}, ${store.state} ${store.zip}`} />
        </Section>

        <Section title="License">
          <Field label="Number" value={store.licenseNumber} />
          <Field label="Expiry" value={store.licenseExpiry} />
        </Section>

        <Section title="Owner">
          <Field label="Name" value={store.owner?.fullName ?? "N/A"} />
          <Field label="Email" value={store.owner?.email ?? "N/A"} />
        </Section>

        <Section title="Status">
          <Field label="Active" value={store.isActive ? "Yes" : "No"} />
          <Field label="Verified" value={store.isVerified ? "Yes" : "No"} />
          <Field label="Created" value={store.createdAt ? new Date(store.createdAt).toLocaleString() : ""} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? "N/A"}</span>
    </div>
  );
}
