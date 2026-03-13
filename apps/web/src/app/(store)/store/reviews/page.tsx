"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function StoreReviewsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    trpc.review.storeList.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );
  const replyMutation = trpc.review.reply.useMutation({
    onSuccess: () => refetch(),
  });

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const reviews = data?.pages.flatMap((p) => p.items) ?? [];

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return;
    await replyMutation.mutateAsync({ reviewId, reply: replyText.trim() });
    setReplyingTo(null);
    setReplyText("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Customer reviews for your store.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Star className="h-10 w-10" />
            <p className="mt-2">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-lg border p-4 ${!review.isVisible ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {review.customer?.fullName ?? "Customer"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      Order #{review.order?.orderNumber}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-2 text-sm">{review.comment}</p>
                )}

                {/* Store reply */}
                {review.storeReply ? (
                  <div className="mt-3 rounded-md bg-muted px-3 py-2">
                    <p className="text-xs font-medium">Your reply:</p>
                    <p className="text-sm">{review.storeReply}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      maxLength={500}
                      rows={2}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={replyMutation.isPending}
                        className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {replyMutation.isPending ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" /> Reply
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
