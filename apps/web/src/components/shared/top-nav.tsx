"use client";

import Link from "next/link";
import { User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { signOut } from "next-auth/react";
import { PLATFORM_NAME } from "@/lib/constants";
import { customerNavItems } from "@/config/navigation";
import { CartButton } from "@/components/customer/cart-drawer";
import { NotificationBell } from "@/components/shared/notification-bell";

export function TopNav() {
  const { isAuthenticated } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          {PLATFORM_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {customerNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/account"
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                aria-label="My account"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:inline-block"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t px-4 py-3 md:hidden">
          {customerNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
