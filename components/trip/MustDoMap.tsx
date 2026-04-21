"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { MustDoItem, MustDoCategory } from "@/lib/types/trip";

const CATEGORY_EMOJI: Record<MustDoCategory, string> = {
  landmark: "🏛️",
  restaurant: "🍽️",
  museum: "🎨",
  park: "🌳",
  shopping: "🛍️",
  nightlife: "🌃",
  beach: "🏖️",
  cafe: "☕",
  viewpoint: "🌄",
  activity: "⭐",
};

const CATEGORY_LABEL: Record<MustDoCategory, string> = {
  landmark: "Landmark",
  restaurant: "Restaurant",
  museum: "Museum",
  park: "Park",
  shopping: "Shopping",
  nightlife: "Nightlife",
  beach: "Beach",
  cafe: "Café",
  viewpoint: "Viewpoint",
  activity: "Activity",
};

function makeIcon(item: MustDoItem, isActive: boolean): L.DivIcon {
  return L.divIcon({
    html: `<div class="must-do-marker${isActive ? " active" : ""}">
      <span class="must-do-marker-rank">${item.rank}</span>
      <span class="must-do-marker-emoji">${CATEGORY_EMOJI[item.category]}</span>
    </div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -48],
  });
}

function BoundsController({ items }: { items: MustDoItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    if (items.length === 1) {
      map.setView([items[0].location!.lat, items[0].location!.lng], 13, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(
      items.map((i) => [i.location!.lat, i.location!.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [48, 48], animate: false, maxZoom: 14 });
  }, [map]); // run once on mount
  return null;
}

function FlyController({
  flyToRank,
  items,
}: {
  flyToRank: number | null;
  items: MustDoItem[];
}) {
  const map = useMap();
  useEffect(() => {
    if (flyToRank === null) return;
    const item = items.find((i) => i.rank === flyToRank);
    if (!item?.location) return;
    map.flyTo([item.location.lat, item.location.lng], Math.max(map.getZoom(), 13), {
      duration: 0.7,
    });
  }, [flyToRank, map, items]);
  return null;
}

interface Props {
  items: MustDoItem[];
  activeRank: number | null;
  flyToRank: number | null;
  onPinClick: (rank: number) => void;
}

export default function MustDoMap({ items, activeRank, flyToRank, onPinClick }: Props) {
  const validItems = items.filter((i) => i.location?.lat && i.location?.lng);

  const center = useMemo((): [number, number] => {
    if (validItems.length === 0) return [48.8566, 2.3522];
    const avgLat = validItems.reduce((s, i) => s + i.location!.lat, 0) / validItems.length;
    const avgLng = validItems.reduce((s, i) => s + i.location!.lng, 0) / validItems.length;
    return [avgLat, avgLng];
  }, [validItems]);

  if (validItems.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-tl-3xl rounded-bl-3xl lg:rounded-tr-none rounded-tr-3xl"
        style={{ backgroundColor: "#F0EFED" }}
      >
        <p className="text-sm" style={{ color: "rgba(13,115,119,0.40)" }}>
          Map not available
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <BoundsController items={validItems} />
      <FlyController flyToRank={flyToRank} items={validItems} />

      {validItems.map((item) => (
        <Marker
          key={item.rank}
          position={[item.location!.lat, item.location!.lng]}
          icon={makeIcon(item, item.rank === activeRank)}
          eventHandlers={{ click: () => onPinClick(item.rank) }}
        >
          <Popup>
            <div style={{ minWidth: 160, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A", margin: 0 }}>
                {item.rank}. {item.title}
              </p>
              <p style={{ fontSize: 12, color: "#0D7377", marginTop: 3, marginBottom: 0 }}>
                {CATEGORY_EMOJI[item.category]} {CATEGORY_LABEL[item.category]}
              </p>
              {(item.estimatedCost || item.estimatedTime) && (
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4, marginBottom: 0 }}>
                  {[item.estimatedCost, item.estimatedTime].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
