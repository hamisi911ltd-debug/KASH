/* Runs right after `vite build`. Moves the source maps out of dist/ into
   sourcemaps/<build-time>/ so they are NOT uploaded with the website (they
   contain your original source) but stay on your computer for decoding
   crash reports later. Keep that folder; it is git-ignored. */
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const assets = join("dist", "assets");
if (!existsSync(assets)) process.exit(0);

const maps = readdirSync(assets).filter((f) => f.endsWith(".map"));
if (!maps.length) process.exit(0);

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const target = join("sourcemaps", `build-${stamp}`, "assets");
mkdirSync(target, { recursive: true });
for (const f of maps) renameSync(join(assets, f), join(target, f));
console.log(`Moved ${maps.length} source map(s) out of dist/ to ${target}`);
