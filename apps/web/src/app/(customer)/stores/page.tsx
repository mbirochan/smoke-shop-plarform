"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Map, List, Search, Locate } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StoreCard } from "@/components/customer/store-card";

const StoreMap = dynamic(
  () => import("@/components/customer/store-map").then((m) => m.StoreMap),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-lg bg-muted" /> },
);

const DEFAULT_COORDS = { lat: 29.7604, lng: -95.3698 }; // Houston, TX

export default function StoresPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => setLocating(false),
        { timeout: 5000 },
      );
    }
  }, []);

  const { data: stores, isLoading } = trpc.customerStore.nearby.useQuery({
    lat: coords.lat,
    lng: coords.lng,
    radiusMiles: radius,
    limit: 20,
  });

  const storeList = (stores ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    logo_url: string | null;
    operating_hours: unknown;
    distance_meters: number;
  }>;

  const filteredStores = searchQuery
    ? storeList.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : storeList;

  const mapStores = filteredStores.map((s) => ({
    ...s,
    lng: coords.lng,
    lat: coords.lat,
  }));

  function requestLocation() {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => setLocating(false),
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Find Stores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse licensed smoke shops near you.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by store name or city..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          <Locate className="h-4 w-4" />
          {locating ? "Locating..." : "My Location"}
        </button>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
          <option value={25}>25 miles</option>
          <option value={50}>50 miles</option>
        </select>
        <div className="flex rounded-md border">
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1 px-3 py-2 text-sm ${
              view === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            <Map className="h-4 w-4" /> Map
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 px-3 py-2 text-sm ${
              view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading stores...
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <p>No stores found nearby.</p>
              <p className="mt-1 text-xs">Try increasing the search radius.</p>
            </div>
          </div>
        ) : (
          <>
            {view === "map" && <StoreMap stores={mapStores} center={coords} />}
            <div className={view === "map" ? "mt-4" : ""}>
              <p className="text-sm text-muted-foreground">
                {filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""} found
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
