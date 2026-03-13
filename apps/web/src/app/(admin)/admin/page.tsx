"use client";

import { trpc } from "@/lib/trpc";

export default function AdminDashboardPage() {
  const { data: stats } = trpc.adminDashboard.stats.useQuery();
  const { data: activity } = trpc.adminDashboard.recentActivity.useQuery();

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Platform management overview.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Stores" value={stats?.stores.total ?? 0} />
        <StatCard label="Active Stores" value={stats?.stores.active ?? 0} />
        <StatCard label="Pending Approval" value={stats?.stores.pending ?? 0} />
        <StatCard label="Total Users" value={stats?.users.total ?? 0} />
        <StatCard label="Customers" value={stats?.users.customers ?? 0} />
        <StatCard label="Store Owners" value={stats?.users.storeOwners ?? 0} />
        <StatCard label="Total Orders" value={stats?.orders.total ?? 0} />
        <StatCard label="Revenue" value={`$${stats?.orders.revenue ?? 0}`} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 space-y-2">
          {activity && activity.length > 0 ? (
            activity.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <span className="font-medium">{log.userName ?? "System"}</span>
                  <span className="mx-1 text-muted-foreground">-</span>
                  <span className="text-muted-foreground">{formatAction(log.action)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
