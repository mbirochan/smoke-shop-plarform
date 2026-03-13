"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

type StoreStatus = "all" | "active" | "pending" | "suspended";

export default function AdminStoresPage() {
  const [status, setStatus] = useState<StoreStatus>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.adminStore.list.useQuery({
    status,
    search: search || undefined,
    limit: 20,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stores</h1>
        <Link
          href="/admin/stores/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Store
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search stores..."
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["all", "active", "pending", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : data?.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stores found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Store</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((store) => (
                  <tr key={store.id} className="border-b">
                    <td className="py-3">
                      <Link href={`/admin/stores/${store.id}`} className="font-medium hover:underline">
                        {store.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{store.ownerName}</td>
                    <td className="py-3 text-muted-foreground">
                      {store.city}, {store.state}
                    </td>
                    <td className="py-3">
                      <StatusBadge isActive={store.isActive} isVerified={store.isVerified} />
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ isActive, isVerified }: { isActive: boolean; isVerified: boolean }) {
  if (isActive && isVerified) {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Active</span>;
  }
  if (!isActive && !isVerified) {
    return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Pending</span>;
  }
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Suspended</span>;
}
