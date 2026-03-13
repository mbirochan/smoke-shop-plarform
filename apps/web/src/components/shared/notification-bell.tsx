"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: countData } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: listData, refetch } = trpc.notification.list.useQuery(
    { limit: 10 },
    { enabled: open },
  );
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  const count = countData?.count ?? 0;
  const items = listData?.items ?? [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 hover:bg-accent"
        aria-label={count > 0 ? `Notifications (${count} unread)` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex gap-1">
                {count > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    <Check className="mr-1 inline h-3 w-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded p-1 hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No notifications
                </p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-2 border-b px-4 py-3 text-sm transition-colors last:border-0 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${!n.isRead ? "font-medium" : ""}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="truncate text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate({ id: n.id })}
                        className="mt-1 h-5 rounded px-1 text-xs text-muted-foreground hover:bg-accent"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t px-4 py-2">
              <Link
                href="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}
