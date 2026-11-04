/* Assemble web/public: the website under /site and the built ERP (dist/) under
   /erp, with each site's _headers rules moved under its own prefix.
   Run `npm run build` (with VITE_API_BASE set to the live API) first. */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = join(here, "public");
const skip = new Set(["wrangler.jsonc", ".assetsignore", "README.md", "KGS.V1.html"]);

if (!existsSync(join(root, "dist", "index.html"))) throw new Error("Build the ERP first: npm run build");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, "marketing-site"), join(out, "site"), { recursive: true, filter: (p) => !skip.has(p.split(/[\/]/).pop()) });
cpSync(join(root, "dist"), join(out, "erp"), { recursive: true, filter: (p) => !/_redirects$/.test(p) });

/* A _headers file is "path" lines followed by indented header lines. */
const prefixed = (file, prefix) =>
  readFileSync(file, "utf8").split(/\r?\n/).map((line) => (line.startsWith("/") ? prefix + (line === "/" ? "/" : line) : line)).join("\n");
const headers = [
  prefixed(join(out, "site", "_headers"), "/site"),
  prefixed(join(out, "erp", "_headers"), "/erp"),
].join("\n\n");
rmSync(join(out, "site", "_headers")); rmSync(join(out, "erp", "_headers"));
writeFileSync(join(out, "_headers"), headers);
console.log("web/public ready");
