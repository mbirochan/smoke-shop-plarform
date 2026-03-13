"use client";

import Link from "next/link";
import { MapPin, Clock } from "lucide-react";

interface StoreCardProps {
  store: {
    name: string;
    slug: string;
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    logo_url: string | null;
    distance_meters: number;
    operating_hours: unknown;
  };
}

function metersToMiles(m: number): string {
  return (m / 1609.34).toFixed(1);
}

function isOpenNow(hours: unknown): { open: boolean; label: string } {
  if (!hours || typeof hours !== "object") return { open: false, label: "Hours unavailable" };
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const day = days[now.getDay()];
  if (!day) return { open: false, label: "Closed" };
  const dayHours = (hours as Record<string, { open: string; close: string; closed: boolean }>)[day];
  if (!dayHours || dayHours.closed) return { open: false, label: "Closed today" };

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (currentTime >= dayHours.open && currentTime <= dayHours.close) {
    return { open: true, label: `Open · Closes at ${dayHours.close}` };
  }
  return { open: false, label: `Closed · Opens at ${dayHours.open}` };
}

export function StoreCard({ store }: StoreCardProps) {
  const status = isOpenNow(store.operating_hours);

  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      {store.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logo_url}
          alt={store.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">
          {store.name[0]}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{store.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {store.address_line1}, {store.city} · {metersToMiles(store.distance_meters)} mi
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          <span className={status.open ? "text-green-600" : "text-red-600"}>
            {status.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
