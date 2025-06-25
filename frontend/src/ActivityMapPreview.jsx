// ActivityMapPreview.jsx
import React from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

export default function ActivityMapPreview({ summaryPolyline }) {
  if (!summaryPolyline) return null;

  // Decode the polyline into [lat, lng] array
  const coords = polyline.decode(summaryPolyline);

  // Compute bounds dynamically
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const bounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  return (
    <MapContainer
      bounds={bounds}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={coords} color="#FC4C02" weight={3} />
    </MapContainer>
  );
}
