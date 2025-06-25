// ActivityMapPreview.jsx
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

export default function ActivityMapPreview({ summaryPolyline }) {
  if (!summaryPolyline) return null;

  const coords = polyline.decode(summaryPolyline).map(([lat, lng]) => [lat, lng]);
  
  return (
    <MapContainer bounds={coords} style={{ width: "100%", height: "250px" }} scrollWheelZoom={false} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={coords} color="blue" weight={3} />
    </MapContainer>
  );
}
