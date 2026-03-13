"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface StorePin {
  id: string;
  name: string;
  slug: string;
  address_line1: string;
  city: string;
  state: string;
  distance_meters: number;
  logo_url: string | null;
  operating_hours: unknown;
  lng: number;
  lat: number;
}

interface StoreMapProps {
  stores: StorePin[];
  center: { lat: number; lng: number };
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
}

function metersToMiles(m: number): string {
  return (m / 1609.34).toFixed(1);
}

function isOpenNow(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return false;
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const day = days[now.getDay()];
  if (!day) return false;
  const dayHours = (hours as Record<string, { open: string; close: string; closed: boolean }>)[day];
  if (!dayHours || dayHours.closed) return false;

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

export function StoreMap({ stores, center, onBoundsChange }: StoreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMoveEnd = useCallback(() => {
    if (!map.current || !onBoundsChange) return;
    const bounds = map.current.getBounds();
    if (!bounds) return;
    onBoundsChange({
      ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
    });
  }, [onBoundsChange]);

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.on("moveend", handleMoveEnd);

    return () => {
      map.current?.remove();
    };
  }, [token, center.lat, center.lng, handleMoveEnd]);

  // Update markers when stores change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stores.forEach((store) => {
      const open = isOpenNow(store.operating_hours);
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: system-ui; max-width: 200px;">
          <strong>${store.name}</strong>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            ${store.address_line1}, ${store.city}
          </p>
          <p style="margin: 4px 0; font-size: 12px;">
            ${metersToMiles(store.distance_meters)} mi away
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: ${open ? "#16a34a" : "#dc2626"};">
            ${open ? "Open Now" : "Closed"}
          </p>
          <a href="/stores/${store.slug}" style="font-size: 12px; color: #2563eb;">View Store</a>
        </div>
      `);

      const el = document.createElement("div");
      el.className = "store-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = open ? "#16a34a" : "#dc2626";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [stores]);

  if (!token) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted">
        <p className="text-sm text-muted-foreground">
          Map requires NEXT_PUBLIC_MAPBOX_TOKEN to be configured.
        </p>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-[400px] w-full rounded-lg" />;
}
