/* ============================================================
   A small Leaflet map, tiled straight from OpenStreetMap - free, no
   API key, no billing account. One component covers both use cases:
   a single pin (Hospitality's "find us") and many pins with a label
   (Transport's fleet map).
   ============================================================ */
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStore } from "../lib/store.jsx";

// Leaflet's default marker PNGs don't survive Vite's bundling; a plain
// coloured pin drawn as a tiny inline SVG works everywhere instead.
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21c0-7.2-5.8-13-13-13z" fill="${color}"/>
      <circle cx="13" cy="13" r="5.5" fill="#fff"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

export default function MapView({ points, height = 260, zoom = 12, className = "" }) {
  const { theme } = useStore();
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // OpenStreetMap's own tiles - free, no API key, no account. There's no
  // official dark variant, so dark mode inverts the tiles with a CSS
  // filter instead (a standard, no-cost trick) rather than depending on
  // a second tile provider.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || layerRef.current) return;
    layerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  }, []);

  useEffect(() => {
    const pane = mapRef.current?.getPane("tilePane");
    if (pane) pane.style.filter = theme === "dark" ? "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)" : "none";
  }, [theme]);

  // markers, re-drawn whenever the point set changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points?.length) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = points.map((p) => {
      const marker = L.marker(p.coords, { icon: pinIcon(p.color || "#1E6CA8") }).addTo(map);
      if (p.label) marker.bindPopup(`<b>${p.label}</b>${p.sub ? `<br/>${p.sub}` : ""}`);
      return marker;
    });
    if (points.length === 1) {
      map.setView(points[0].coords, zoom);
    } else {
      const bounds = L.latLngBounds(points.map((p) => p.coords));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: zoom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points?.map((p) => [p.coords, p.label]))]);

  return <div ref={elRef} className={`n1-map rounded-xl overflow-hidden ${className}`} style={{ height }} />;
}
