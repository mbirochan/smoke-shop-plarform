"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function verify() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token }),
      });

      setStatus(res.ok ? "success" : "error");
    }

    verify();
  }, [params.token]);

  if (status === "loading") {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <h2 className="mb-2 text-xl font-semibold">Verification failed</h2>
        <p className="text-sm text-muted-foreground">
          The link may have expired or is invalid.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-muted-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
      <h2 className="mb-2 text-xl font-semibold">Email verified</h2>
      <p className="text-sm text-muted-foreground">Your email has been verified. You can now sign in.</p>
      <Link
        href="/login"
        className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Sign in
      </Link>
    </div>
  );
}
