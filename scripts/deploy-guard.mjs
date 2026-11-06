/* Deploy gate. Nothing deploys or pushes unless the secret code is given.
   Set or change the code:   node scripts/deploy-guard.mjs set
   Only a salted hash is stored (.deploy-lock), never the code itself.
   Non-interactive use: set KASH_DEPLOY_CODE in the environment. */
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const LOCK = join(dirname(fileURLToPath(import.meta.url)), "..", ".deploy-lock");
const hash = (code, salt) => scryptSync(code, salt, 32);

function ask(q) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); res(a); });
  });
}

export async function check() {
  if (!existsSync(LOCK)) { console.error("No deploy code is set. Run: node scripts/deploy-guard.mjs set"); process.exit(1); }
  const { salt, key } = JSON.parse(readFileSync(LOCK, "utf8"));
  const code = process.env.KASH_DEPLOY_CODE ?? (process.stdin.isTTY ? await ask("Deploy code: ") : "");
  const ok = code && timingSafeEqual(hash(code, Buffer.from(salt, "hex")), Buffer.from(key, "hex"));
  if (!ok) { console.error("Wrong or missing deploy code. Nothing was deployed."); process.exit(1); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "set") {
    if (existsSync(LOCK)) await check();
    const a = await ask("New deploy code: "), b = await ask("Repeat it: ");
    if (!a || a.length < 8 || a !== b) { console.error("Codes must match and be at least 8 characters."); process.exit(1); }
    const salt = randomBytes(16);
    writeFileSync(LOCK, JSON.stringify({ salt: salt.toString("hex"), key: hash(a, salt).toString("hex") }) + "\n");
    console.log("Deploy code saved.");
  } else await check();
}
