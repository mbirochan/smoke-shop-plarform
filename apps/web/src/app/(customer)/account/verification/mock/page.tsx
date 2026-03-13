"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function MockVerificationPage() {
  const router = useRouter();
  const mockVerify = trpc.idv.mockVerify.useMutation();
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    try {
      await mockVerify.mutateAsync();
      setDone(true);
      setTimeout(() => router.push("/checkout"), 1500);
    } catch {
      setVerifying(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <ShieldCheck className="mx-auto h-16 w-16 text-amber-500" />
      <h1 className="mt-4 text-xl font-bold">Mock Age Verification</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is a development-only mock of the Veriff verification flow. In
        production, you would be redirected to Veriff&apos;s hosted page to
        upload your ID.
      </p>

      {done ? (
        <div className="mt-6">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-600" />
          <p className="mt-2 font-medium text-green-600">Verified! Redirecting to checkout...</p>
        </div>
      ) : (
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {verifying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </span>
          ) : (
            "Simulate Successful Verification"
          )}
        </button>
      )}
    </div>
  );
}
