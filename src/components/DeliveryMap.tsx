import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Vite doesn't resolve Leaflet's default marker image paths the way a
// plain webpack/CRA setup does, so the default pin renders broken unless we
// point it at the package's own bundled images explicitly.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const destinationIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// A distinct divIcon for the rider so it's never confused with the fixed
// delivery-address pin — a colored dot instead of a second identical pin.
const riderIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:#F97316;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface DeliveryMapProps {
  destination: { lat: number; lng: number } | null;
  riderPosition: { lat: number; lng: number } | null;
}

// Keeps the map framed on whatever points are currently available, and
// re-frames if the rider moves far enough that they'd fall off-screen.
function AutoFit({ destination, riderPosition }: DeliveryMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    if (destination) points.push([destination.lat, destination.lng]);
    if (riderPosition) points.push([riderPosition.lat, riderPosition.lng]);

    if (points.length === 2) {
      map.fitBounds(points, { padding: [48, 48] });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [destination?.lat, destination?.lng, riderPosition?.lat, riderPosition?.lng, map]);

  return null;
}

export default function DeliveryMap({ destination, riderPosition }: DeliveryMapProps) {
  const center: [number, number] = destination
    ? [destination.lat, destination.lng]
    : riderPosition
      ? [riderPosition.lat, riderPosition.lng]
      : [-15.3875, 28.3228]; // Lusaka, as a sane fallback if neither point is known yet

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Delivery address</Popup>
        </Marker>
      )}
      {riderPosition && (
        <Marker position={[riderPosition.lat, riderPosition.lng]} icon={riderIcon}>
          <Popup>Your rider</Popup>
        </Marker>
      )}
      <AutoFit destination={destination} riderPosition={riderPosition} />
    </MapContainer>
  );
}
