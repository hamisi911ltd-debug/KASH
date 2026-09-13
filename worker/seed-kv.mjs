/* ============================================================
   One-time (or re-run-when-you-want-a-fresh-demo) local seeder.

   buildSeedData() generates ~120 days of trips/orders/bookings and is
   too much CPU for a single Cloudflare Worker request on the free
   plan, so it runs here in plain Node (no limit) and the result is
   bulk-uploaded straight into KV via wrangler. Re-run any time you
   want to wipe the API back to a fresh demo state.
   ============================================================ */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { buildSeedData } from "../src/lib/seed.js";
import { COLLECTIONS } from "../src/lib/schema.js";
import { hashPassword } from "./src/crypto.js";

const NAMESPACE_ID = "2be14a2fc4ef46d6b6b91cde129bd461";
const DEMO_PASSWORD = "kash1234";

async function main() {
  const seed = buildSeedData();
  const demoHash = await hashPassword(DEMO_PASSWORD);
  const users = seed.users.map((u) => ({ ...u, passwordHash: demoHash, createdAt: new Date().toISOString() }));

  const entries = [];
  for (const name of COLLECTIONS) {
    entries.push({ key: `data:${name}`, value: JSON.stringify(name === "users" ? users : seed[name] || []) });
  }
  entries.push({ key: "data:company", value: JSON.stringify(seed.company) });
  entries.push({ key: "data:seeded", value: "1" });
  for (const u of users) {
    entries.push({ key: `email:${u.email.toLowerCase()}`, value: u.id });
  }

  const file = "./.seed-bulk.json";
  writeFileSync(file, JSON.stringify(entries, null, 0));
  console.log(`Uploading ${entries.length} keys to KV namespace ${NAMESPACE_ID}...`);
  execFileSync(
    "npx",
    ["wrangler", "kv", "bulk", "put", file, "--namespace-id", NAMESPACE_ID, "--remote"],
    { stdio: "inherit", shell: true }
  );
  unlinkSync(file);
  console.log(`Done. ${users.length} demo accounts seeded, password for all: "${DEMO_PASSWORD}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
