/* KASH wordmark - the official logo artwork (public/logo.png), background
   removed so it drops cleanly onto any surface (light sidebar, dark mode,
   the login screen's gradient panel). `size` sets its height; width follows
   the artwork's own aspect ratio automatically. */
import React from "react";

const ASPECT = 1120 / 561; // logo.png's own width/height

export function KashLogo({ size = 24, tagline = false, onDark = false }) {
  const height = Math.round(size * 1.7); // the artwork has padding baked in; this keeps the "KASH" glyphs visually matched to the old tile size
  return (
    <div className="inline-flex flex-col">
      <img
        src="/logo.png"
        alt="KASH"
        draggable={false}
        style={{ height, width: Math.round(height * ASPECT), objectFit: "contain" }}
      />
      {tagline && (
        <span
          className="mt-1.5 font-medium tracking-wide"
          style={{ fontSize: 10.5, color: onDark ? "rgba(255,255,255,0.5)" : "var(--muted)" }}
        >
          One Platform. Many Solutions.
        </span>
      )}
    </div>
  );
}
