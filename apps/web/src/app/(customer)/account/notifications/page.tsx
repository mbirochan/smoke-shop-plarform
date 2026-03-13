"use client";

import { Bell, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function NotificationsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.notification.list.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );
  const markRead = trpc.notification.markRead.useMutation();
  const markAllRead = trpc.notification.markAllRead.useMutation();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Check className="mr-1 inline h-3 w-3" /> Mark all read
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10" />
            <p className="mt-2">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  !n.isRead ? "bg-primary/5 border-primary/20" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-medium" : ""}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate({ id: n.id })}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full rounded-md border py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
