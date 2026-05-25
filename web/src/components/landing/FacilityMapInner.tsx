"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { shortAddress } from "@/lib/eth";
import type { FacilityMarker } from "./FacilityMap";

/**
 * Leaflet map of the demo institution network. CircleMarkers (pure SVG) avoid
 * the default-icon asset-path problem bundlers have with Leaflet's PNG markers.
 */
export function FacilityMapInner({
  facilities,
}: {
  facilities: FacilityMarker[];
}) {
  return (
    <MapContainer
      center={[-38.0, -63.6]}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[420px] w-full rounded-[var(--radius-card)]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {facilities.map((f) => (
        <CircleMarker
          key={f.roleKey}
          center={[f.lat, f.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{f.name}</span>
              <span>
                {f.roleLabel} · {f.city}
              </span>
              <span className="font-mono text-xs">
                {shortAddress(f.address)}
              </span>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
