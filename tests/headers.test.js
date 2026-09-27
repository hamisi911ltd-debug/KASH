import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/* The Content-Security-Policy allows the two inline scripts in index.html by
   hash. If someone edits either script, the browser would silently block it;
   this test fails first and prints the value to paste into public/_headers. */
describe("public/_headers", () => {
  const html = read("index.html");
  const headers = read("public/_headers");
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`
  );

  it("finds the inline scripts", () => expect(hashes.length).toBe(2));

  it.each([0, 1])("allows inline script #%i by its current hash", (i) => {
    expect(headers, `update _headers with ${hashes[i]}`).toContain(hashes[i]);
  });

  it("does not fall back to allowing any inline script", () => {
    const script = headers.match(/script-src[^;]*/)[0];
    expect(script).not.toContain("unsafe-inline");
    expect(script).not.toContain("unsafe-eval");
  });

  it("forbids framing, plugins and other sites' forms", () => {
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("X-Frame-Options: DENY");
  });
});

describe("legal pages", () => {
  it.each(["public/privacy.html", "public/terms.html"])("%s exists and states the 18+ rule", (file) => {
    expect(read(file)).toMatch(/18 or older/);
  });

  it("the privacy page lists every browser-storage key the app really uses", () => {
    const privacy = read("public/privacy.html");
    const constants = read("src/lib/constants.js");
    for (const key of constants.matchAll(/(?:SESSION_KEY|PREFS_KEY|THEME_KEY) = "([^"]+)"/g)) {
      expect(privacy, key[1]).toContain(key[1]);
    }
  });
});
