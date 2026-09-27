# KASH launch checklist

What the code now does for you, and the things only **you** can do before real
customers use it. Tick each one off.

## 1. Before you deploy the live API

- [ ] **Set the signing secret** (never put it in a file):
      `cd worker && npx wrangler secret put JWT_SECRET --env live`
      Use a long random value (32+ characters). Without it the API refuses to run.
- [ ] **Lock the API to your website.** In `worker/wrangler.toml`, under `[env.live.vars]`, set
      `ALLOWED_ORIGINS = "https://your-real-domain"`. Left empty, any website may call the API.
- [ ] **Leave `OPEN_SIGNUP` unset** for the live environment (only the demo has it). With it unset, only invited
      emails can create accounts.
- [ ] **Deploy:** `npx wrangler deploy --env live`
- [ ] **Create your Super Admin immediately.** On a brand-new instance the *first* account to register becomes Super Admin.
      Register yours the moment it's live, before sharing the link with anyone.
- [ ] If you're on a paid Workers plan, set `PBKDF2_ITERATIONS = "100000"` (stronger password hashing). Existing passwords
      upgrade automatically at each person's next sign-in. Don't set it on the free plan: it may exceed the CPU limit.

## 2. Before you deploy the website

- [ ] Build with the live API address: `VITE_API_BASE=https://your-live-api npm run build`
      (do **not** set `VITE_DEMO_MODE`, which would show the demo-account picker).
- [ ] Host `dist/` on Cloudflare Pages. The `_headers` file inside it adds the browser security policy automatically.
- [ ] In `public/_headers`, change `https://*.workers.dev` in `connect-src` to your API's exact address.
- [ ] Open the site and check the browser console for "Refused to..." messages (a blocked resource means the policy
      needs one more allowed address).

## 3. Legal (needs a lawyer, not code)

- [ ] Have a Kenyan lawyer review `public/privacy.html` and `public/terms.html`, and fill every `[BRACKETED]` item.
- [ ] Check whether you must register with the **Office of the Data Protection Commissioner** (Kenya Data Protection Act, 2019)
      and appoint a data protection officer.
- [ ] Decide your data-retention periods and put them in the privacy policy.
- [ ] If the legal text changes materially, bump `TERMS_VERSION` in `src/lib/policy.js` so people are recorded as having
      accepted the new version.

## 4. The bot wall (free)

Already built in, no setup: the API slows password-guessing (5 wrong tries per email, 25 per IP, per 15 minutes),
never says whether an email exists, and logs every attempt.

**Turn on the human check** (Cloudflare Turnstile, free). The code is done; it switches on when you give it two keys:

- [ ] Cloudflare dashboard → **Turnstile → Add widget**. Add your website's address. Copy the **Site key** and **Secret key**.
- [ ] Give the API the secret: `cd worker && npx wrangler secret put TURNSTILE_SECRET --env live`
      (for the demo API run the same command without `--env live`).
- [ ] Build the website with the site key: `VITE_TURNSTILE_SITEKEY=<site key> npm run build`
- [ ] Open sign-in: you should see the check, and the button unlocks once it passes.
- *To try it locally first, Cloudflare publishes test keys that always pass: site key `1x00000000000000000000AA`,
  secret `1x0000000000000000000000000000000AA`.*

While `TURNSTILE_SECRET` is unset the check is skipped, so nothing breaks in the meantime. Bots that fail it are turned
away *before* anything is written, so they can't use up the free plan's daily write allowance.

Also in the Cloudflare dashboard (free, no code):

- [ ] **Rate limiting rule** on `/api/auth/*` (e.g. 10 requests per minute per IP).
- [ ] **Security → Bots / WAF managed rules** turned on for the zone.
- [ ] A free **uptime monitor** on `/api/health` (see [WHEN-SOMETHING-BREAKS.md](WHEN-SOMETHING-BREAKS.md)).
- [ ] Keep an eye on `auth.failed` / `auth.throttled` lines: `npx wrangler tail --env live` shows them live.

## 5. Known limits (be honest with customers about these)

- **Password reset is manual.** There's no email-based reset yet; an admin removes and re-invites the person.
  Real reset needs an email provider (e.g. Resend, Postmark).
- **Two people saving at the same moment can overwrite each other.** Each collection is stored as one list in Cloudflare KV.
  Moving to Cloudflare D1 (a real database) fixes this and is the most valuable next engineering step.
- **One business per deployment** (single-tenant). Selling to many businesses as a subscription needs multi-tenancy and billing.
- **No two-step login (2FA)** yet. Worth adding for Super Admin / Director accounts.
- **Failed-login counting is approximate** (KV is eventually consistent). Treat it as a brake, with the Cloudflare rules in
  section 4 as the hard limit.
- **Backups are manual** (Settings → Data management → Export). Schedule regular exports until automated backups exist.
- **Crash alerts:** crashes are logged with a code and can be decoded to the exact line (see
  [WHEN-SOMETHING-BREAKS.md](WHEN-SOMETHING-BREAKS.md)), but nothing pages you. The free uptime monitor covers "it's down";
  add Sentry (free tier) if you want alerts for individual errors.
- **Free-plan ceilings:** Workers KV allows about 1,000 writes a day on the free plan, and logs are kept only briefly.
  Fine for a pilot; it's the main reason to move to a paid plan before real volume.
