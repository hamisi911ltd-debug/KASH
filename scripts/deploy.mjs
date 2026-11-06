/* One guarded deploy: asks for the code, builds, then publishes the ERP and the website. */
import { check } from "./deploy-guard.mjs";
import { execSync } from "node:child_process";
await check();
const run = (c, cwd) => execSync(c, { stdio: "inherit", cwd, env: { ...process.env, VITE_API_BASE: "https://kash-api-live.johndrekuz.workers.dev" } });
run("npm run build"); run("node web/build.mjs");
run("npx wrangler pages deploy dist --project-name kash-live --branch main --commit-dirty=true");
run("npx wrangler deploy", "web");
