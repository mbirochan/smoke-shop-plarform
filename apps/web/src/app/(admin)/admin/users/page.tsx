"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

type RoleFilter = "all" | "customer" | "store_owner" | "store_staff" | "platform_admin";

export default function AdminUsersPage() {
  const [role, setRole] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.adminUser.list.useQuery({
    role,
    search: search || undefined,
    limit: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search users..."
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="store_owner">Store Owners</option>
          <option value="store_staff">Store Staff</option>
          <option value="platform_admin">Admins</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : data?.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">IDV Status</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                      {user.fullName}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{user.idvStatus}</td>
                  <td className="py-3 text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
