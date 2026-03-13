"use client";

import { trpc } from "@/lib/trpc";

export function useCurrentStore() {
  const { data: store, isLoading, error, refetch } = trpc.storeOwner.getMyStore.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 },
  );

  return {
    store: store ?? null,
    isLoading,
    error,
    refetch,
    hasStore: !!store,
    isPending: store?.isActive === false && store?.isVerified === false,
    isActive: store?.isActive === true,
    isSuspended: store?.isActive === false && store?.isVerified === true,
  };
}
