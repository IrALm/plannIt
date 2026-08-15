"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Les icônes par défaut de Leaflet référencent des chemins qui cassent avec
// le bundling webpack de Next.js — réassignées explicitement vers les
// assets importés (donc hashés/servis correctement par Next).
const defaultIcon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type LocationMapProps = {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
};

function FitBounds({ from, to }: LocationMapProps) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [from.lat, from.lon],
        [to.lat, to.lon],
      ],
      { padding: [30, 30] }
    );
  }, [map, from.lat, from.lon, to.lat, to.lon]);
  return null;
}

/**
 * Fond de carte OpenStreetMap (tuiles publiques, gratuit) — ligne
 * pointillée à vol d'oiseau entre la position actuelle et le lieu de
 * l'événement, PAS un vrai itinéraire routier (choix assumé, cf. décision
 * "distance à vol d'oiseau" plutôt qu'un service de routage payant).
 */
export function LocationMap({ from, to }: LocationMapProps) {
  return (
    <div className="h-[160px] rounded-card overflow-hidden border border-line">
      <MapContainer
        center={[from.lat, from.lon]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[from.lat, from.lon]} icon={defaultIcon} />
        <Marker position={[to.lat, to.lon]} icon={defaultIcon} />
        <Polyline
          positions={[
            [from.lat, from.lon],
            [to.lat, to.lon],
          ]}
          pathOptions={{ color: "#6E7B4E", dashArray: "6 6", weight: 3 }}
        />
        <FitBounds from={from} to={to} />
      </MapContainer>
    </div>
  );
}
