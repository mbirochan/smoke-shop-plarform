"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VerificationPage() {
  const { data: idvStatus, isLoading, refetch } = trpc.idv.getStatus.useQuery();
  const createSession = trpc.idv.createSession.useMutation();
  const mockVerify = trpc.idv.mockVerify.useMutation();
  const [starting, setStarting] = useState(false);
  const [mocking, setMocking] = useState(false);

  async function handleStartVerification() {
    setStarting(true);
    try {
      const result = await createSession.mutateAsync();
      if (result.sessionUrl) {
        if (result.sessionUrl.startsWith("/")) {
          // Mock: navigate within app
          window.location.href = result.sessionUrl;
        } else {
          // Production: redirect to Veriff
          window.location.href = result.sessionUrl;
        }
      }
    } catch {
      setStarting(false);
    }
  }

  async function handleMockVerify() {
    setMocking(true);
    try {
      await mockVerify.mutateAsync();
      await refetch();
    } finally {
      setMocking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = idvStatus?.status ?? "none";
  const expired = idvStatus?.expired ?? false;
  const verified = status === "verified" && !expired;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Age Verification</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Texas law requires age verification for tobacco and vape purchases.
      </p>

      <div className="mt-6 rounded-lg border p-6">
        {verified ? (
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-3 text-lg font-semibold text-green-600">Verified</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your identity has been verified. You can make purchases.
            </p>
            {idvStatus?.verifiedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Verified on{" "}
                {new Date(idvStatus.verifiedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        ) : status === "pending" ? (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber-500" />
            <h2 className="mt-3 text-lg font-semibold text-amber-600">
              Verification In Progress
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;re reviewing your verification. This usually takes a few minutes.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Check Status
            </button>
          </div>
        ) : status === "rejected" ? (
          <div className="text-center">
            <ShieldX className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-3 text-lg font-semibold text-red-600">
              Verification Failed
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your verification was not approved. You can try again or contact support.
            </p>
            <button
              onClick={handleStartVerification}
              disabled={starting}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                </span>
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        ) : expired ? (
          <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-3 text-lg font-semibold text-amber-600">
              Verification Expired
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your verification has expired. Please re-verify to continue making purchases.
            </p>
            <button
              onClick={handleStartVerification}
              disabled={starting}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                </span>
              ) : (
                "Re-Verify My Age"
              )}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-3 text-lg font-semibold">Not Yet Verified</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete a one-time age verification to start purchasing. It takes about 60
              seconds.
            </p>
            <button
              onClick={handleStartVerification}
              disabled={starting}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Verify My Age
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dev-only mock verification */}
      {process.env.NODE_ENV !== "production" && !verified && (
        <div className="mt-4 rounded-lg border border-dashed border-amber-400 p-4">
          <p className="text-xs font-medium text-amber-600">Development Only</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Skip Veriff and mock-verify your account for testing.
          </p>
          <button
            onClick={handleMockVerify}
            disabled={mocking}
            className="mt-2 rounded-md border border-amber-400 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {mocking ? "Verifying..." : "Mock Verify (Dev)"}
          </button>
        </div>
      )}
    </div>
  );
}
