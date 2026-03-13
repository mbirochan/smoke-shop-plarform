"use client";

import { Copy, Check, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: "Pending", className: "text-amber-600" },
  completed: { text: "Completed", className: "text-blue-600" },
  rewarded: { text: "Rewarded", className: "text-green-600" },
};

export default function ReferralsPage() {
  const { data: codeData, isLoading } = trpc.referral.getMyCode.useQuery();
  const { data: history } = trpc.referral.history.useQuery();
  const [copied, setCopied] = useState(false);

  const referralLink = codeData?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${codeData.code}`
    : "";

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Referrals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends and both get $5 credit after their first order.
      </p>

      {/* Referral Code */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Your Referral Code</h2>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest">
            {codeData?.code ?? "..."}
          </code>
          <button
            onClick={() => codeData?.code && copyToClipboard(codeData.code)}
            className="rounded-md border p-2.5 hover:bg-accent"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Shareable link</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 rounded-md border bg-muted px-3 py-1.5 text-xs"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Account Balance */}
      <div className="mt-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Account Balance</h2>
        <p className="mt-1 text-2xl font-bold">
          ${parseFloat(codeData?.balance ?? "0").toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          Applied automatically at checkout
        </p>
      </div>

      {/* Referral History */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Referral History</h2>
        {!history?.length ? (
          <div className="mt-4 flex flex-col items-center rounded-lg border py-8 text-center text-muted-foreground">
            <Users className="h-10 w-10" />
            <p className="mt-2">No referrals yet</p>
            <p className="text-xs">Share your code to get started</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {history.map((r) => {
              const statusInfo = STATUS_LABEL[r.status] ?? { text: r.status, className: "" };
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{r.referredName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                    {r.rewardAmount && (
                      <p className="text-xs text-green-600">+${r.rewardAmount}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
