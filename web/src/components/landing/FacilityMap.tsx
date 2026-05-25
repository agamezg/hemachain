"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";

export interface FacilityMarker {
  roleKey: string;
  roleLabel: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
}

// Leaflet touches `window` at import time, so the actual map is client-only and
// lazy-loaded — it never runs during SSR.
const FacilityMapInner = dynamic(
  () => import("./FacilityMapInner").then((m) => m.FacilityMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <Spinner />
      </div>
    ),
  },
);

export function FacilityMap({ facilities }: { facilities: FacilityMarker[] }) {
  // `isolate` keeps Leaflet's internal high z-index panes from escaping above
  // the sticky site header.
  return (
    <div className="relative isolate z-0">
      <FacilityMapInner facilities={facilities} />
    </div>
  );
}
