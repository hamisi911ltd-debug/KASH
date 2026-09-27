/* Turns a crash stack from the logs into your real files and line numbers.

     npm run decode -- "<paste the stack here>"
     (or pipe it in:  echo "<stack>" | npm run decode)

   A minified line like  index-BGX6vRP7.js:1:48213  becomes
   src/views/TransportView.jsx:212:9. It finds the right source map by the
   bundle's file name, in the sourcemaps/ folder that `npm run build` fills. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { SourceMapConsumer } from "source-map-js";

const defaultRoot = new URL("../sourcemaps/", import.meta.url);
const consumers = new Map();

function consumerFor(root, file) {
  const cacheKey = `${root.href}|${file}`;
  if (consumers.has(cacheKey)) return consumers.get(cacheKey);
  let found = null;
  if (existsSync(root)) {
    for (const dir of readdirSync(root)) {
      const p = new URL(`${dir}/assets/${file}.map`, root);
      if (existsSync(p)) {
        found = new SourceMapConsumer(JSON.parse(readFileSync(p, "utf8")));
        break;
      }
    }
  }
  consumers.set(cacheKey, found);
  return found;
}

export function decodeStack(text, root = defaultRoot) {
  return String(text)
    .split("\n")
    .map((line) =>
      // Matches "https://site/assets/index-abc.js:12:345" or just "index-abc.js:12:345".
      line.replace(/(?:https?:\/\/[^\s)]*?\/)?([\w.-]+\.js):(\d+):(\d+)/g, (whole, file, l, c) => {
        const consumer = consumerFor(root, file);
        if (!consumer) return `${whole} [no source map found for ${file}]`;
        const o = consumer.originalPositionFor({ line: Number(l), column: Number(c) });
        if (!o.source) return whole;
        return `${o.source.replace(/^(\.\.\/)+/, "")}:${o.line}:${o.column}${o.name ? ` (${o.name})` : ""}`;
      })
    )
    .join("\n");
}

// Only act when run directly, so tests can import decodeStack.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const input = process.argv.slice(2).join("\n") || readFileSync(0, "utf8");
  console.log(decodeStack(input));
}
