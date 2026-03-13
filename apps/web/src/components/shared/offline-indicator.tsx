"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    // Check initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 shadow-lg dark:border-amber-800 dark:bg-amber-950"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
        You are offline. Some features may not work.
      </span>
    </div>
  );
}
