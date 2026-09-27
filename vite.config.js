import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
// Shown on the crash screen and in every crash report, so you know exactly
// which build a person was running. Override with VITE_RELEASE=... if you like.
const RELEASE = process.env.VITE_RELEASE || `${pkg.version}+${stamp}`;

// `npm run build`        -> normal multi-asset build in dist/
// `npm run build:single` -> one self-contained index.html (easy to email / host anywhere)
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  define: { __APP_RELEASE__: JSON.stringify(RELEASE) },
  build: {
    outDir: mode === "single" ? "dist-single" : "dist",
    chunkSizeWarningLimit: 1600,
    // "hidden" writes the source maps but doesn't advertise them in the
    // shipped files. `npm run build` then moves them out of dist/ (see
    // scripts/stash-sourcemaps.mjs) so they are never published.
    sourcemap: mode === "single" ? false : "hidden",
  },
}));
