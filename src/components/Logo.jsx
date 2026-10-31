/* KASH wordmark - four brand-coloured letter tiles. */
import React from "react";

export const KASH_TILES = [
  { ch: "K", bg: "#1E6CA8" },
  { ch: "A", bg: "#159C8C" },
  { ch: "S", bg: "#DFA21C" },
  { ch: "H", bg: "#C82E58" },
];

export function KashLogo({ size = 24, gap = 3, tagline = false, onDark = false }) {
  const radius = Math.max(3, Math.round(size * 0.18));
  return (
    <div className="inline-flex flex-col">
      <div className="flex" style={{ gap }}>
        {KASH_TILES.map((t) => (
          <span
            key={t.ch}
            className="inline-flex items-center justify-center font-display font-extrabold select-none"
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              background: t.bg,
              color: "#fff",
              fontSize: Math.round(size * 0.58),
              lineHeight: 1,
            }}
          >
            {t.ch}
          </span>
        ))}
      </div>
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
