/* KASH wordmark - the official logo artwork (public/logo.png), background
   removed so it drops cleanly onto any surface (light sidebar, dark mode,
   the login screen's gradient panel). `size` sets its height; width follows
   the artwork's own aspect ratio automatically. Below it, "GENERAL SUPPLIERS"
   is stretched to exactly the logo's width, as on the website. */
import React from "react";

const ASPECT = 700 / 269; // logo.png's own width/height

export function KashLogo({ size = 24, tagline = false, onDark = false, caption = true }) {
  const height = size; // this artwork is cropped tight to the glyphs, no padding to compensate for
  const width = Math.round(height * ASPECT);
  const capH = Math.max(7, Math.round(width * 0.112));
  return (
    <div className="inline-flex flex-col" style={{ width }}>
      <img
        src="/logo.png"
        alt="KASH"
        draggable={false}
        style={{ height, width, objectFit: "contain" }}
      />
      {caption && size >= 22 && (
        <svg width={width} height={capH + 2} viewBox={`0 0 ${width} ${capH + 2}`} role="img" aria-label="General Suppliers" style={{ display: "block", marginTop: 1 }}>
          <text
            x="0"
            y={capH}
            textLength={width}
            lengthAdjust="spacingAndGlyphs"
            fontFamily="inherit"
            fontWeight="800"
            fontSize={capH}
            fill={onDark ? "#fff" : "var(--ink)"}
          >
            GENERAL SUPPLIERS
          </text>
        </svg>
      )}
      {tagline && (
        <span
          className="mt-1.5 font-medium tracking-wide whitespace-nowrap"
          style={{ fontSize: 10.5, color: onDark ? "rgba(255,255,255,0.5)" : "var(--muted)" }}
        >
          One Platform. Many Solutions.
        </span>
      )}
    </div>
  );
}
