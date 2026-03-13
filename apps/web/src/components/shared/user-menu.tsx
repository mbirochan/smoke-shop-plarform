"use client";

import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { user, role } = useCurrentUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 border-t px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{role}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
