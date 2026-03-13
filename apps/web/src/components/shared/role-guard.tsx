"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { redirect } from "next/navigation";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  if (role && !allowedRoles.includes(role)) {
    redirect("/");
  }

  return <>{children}</>;
}
