"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const ROLES = ["customer", "store_owner", "store_staff", "platform_admin"] as const;

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: user, isLoading } = trpc.adminUser.getById.useQuery({ id: params.id });
  const [selectedRole, setSelectedRole] = useState<string>("");

  const updateRoleMutation = trpc.adminUser.updateRole.useMutation({
    onSuccess: () => utils.adminUser.getById.invalidate({ id: params.id }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!user) return <p className="text-sm text-muted-foreground">User not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.push("/admin/users")} className="mb-4 text-sm text-muted-foreground hover:underline">
        &larr; Back to users
      </button>

      <h1 className="text-2xl font-bold">{user.fullName}</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">User Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{user.role.replace("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IDV Status</span><span>{user.idvStatus}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{user.phone ?? "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email Verified</span><span>{user.emailVerified ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{user.createdAt ? new Date(user.createdAt).toLocaleString() : ""}</span></div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Change Role</h3>
          <div className="flex gap-2">
            <select
              value={selectedRole || user.role}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedRole && selectedRole !== user.role) {
                  updateRoleMutation.mutate({
                    id: user.id,
                    role: selectedRole as (typeof ROLES)[number],
                  });
                }
              }}
              disabled={!selectedRole || selectedRole === user.role || updateRoleMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
