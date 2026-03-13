"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { UserMenu } from "@/components/shared/user-menu";
import { adminNavItems } from "@/config/navigation";
import { PLATFORM_NAME } from "@/lib/constants";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar-background transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-sm font-bold">{PLATFORM_NAME} Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={adminNavItems} />
        </div>
        <UserMenu />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm font-bold">{PLATFORM_NAME} Admin</span>
        </header>
        <main id="main-content" className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
