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

export default function MapView({ points, height = 260, zoom = 12, className = "", follow = false }) {
  const { theme } = useStore();
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef(new Map());
  const initializedRef = useRef(false);

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

  // Markers are kept across updates (by id) and moved with setLatLng
  // instead of being torn down and rebuilt, so a vehicle mid-trip glides
  // to its next simulated position rather than flickering. The map's
  // own viewport only re-centers on first load, or (when `follow` is
  // set, e.g. a driver's own single-vehicle map) as that one point moves.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points) return;
    const prevIds = new Set(markersRef.current.keys());
    const ids = new Set();
    points.forEach((p) => {
      const id = p.id || p.label || JSON.stringify(p.coords);
      ids.add(id);
      let marker = markersRef.current.get(id);
      if (!marker) {
        marker = L.marker(p.coords, { icon: pinIcon(p.color || "#1E6CA8") }).addTo(map);
        markersRef.current.set(id, marker);
      } else {
        marker.setLatLng(p.coords);
        marker.setIcon(pinIcon(p.color || "#1E6CA8"));
      }
      if (p.label) marker.bindPopup(`<b>${p.label}</b>${p.sub ? `<br/>${p.sub}` : ""}`);
    });
    prevIds.forEach((id) => {
      if (!ids.has(id)) {
        map.removeLayer(markersRef.current.get(id));
        markersRef.current.delete(id);
      }
    });

    if (!points.length) return;
    const idsChanged = ids.size !== prevIds.size || [...ids].some((id) => !prevIds.has(id));
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (points.length === 1) map.setView(points[0].coords, zoom);
      else map.fitBounds(L.latLngBounds(points.map((p) => p.coords)), { padding: [30, 30], maxZoom: zoom });
    } else if (follow && points.length === 1) {
      map.panTo(points[0].coords, { animate: true, duration: 1 });
    } else if (idsChanged && points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => p.coords)), { padding: [30, 30], maxZoom: zoom });
    }
  }, [points, follow, zoom]);

  return <div ref={elRef} className={`n1-map rounded-xl overflow-hidden ${className}`} style={{ height }} />;
}
