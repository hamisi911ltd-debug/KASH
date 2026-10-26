# KASH backend: Cloudflare Worker + D1

This backend is independent of the ERP. The website sends service requests to the Worker, the Worker validates and stores them in D1, customer accounts can review requests associated with their sign-in, and a private staff queue is protected by Cloudflare Access. ERP synchronization is intentionally not part of this version.

## What is included

- Request intake for enquiries, transport, rides, deliveries, stay availability and assistant handoffs.
- Email/password registration with a six-digit email verification code.
- Google Account sign-in using OAuth authorization code flow with PKCE.
- Password reset codes, secure password hashing and revocable server-side sessions.
- An account page showing a customer's requests when they submit while signed in.
- A staff queue with status updates and an audit record for each status change.
- Server-side validation, JSON/body limits, origin checking, rate limits, expiring codes and automatic cleanup.

The API does not send service-request notifications to the company yet. Staff can review stored requests in the protected queue. Customer reviews, ERP sync, order/ride telemetry and payments are not implemented.

## Requirements before deployment

1. A Cloudflare account with Workers, D1 and Cloudflare Access enabled.
2. The website deployed to a domain managed by Cloudflare. Route the Worker to the same site's `/api/*` path so the secure customer session cookie remains first-party.
3. A sending domain and Resend account for verification/reset email. Verify the sending domain in Resend and publish the DNS records it provides before sending live codes.
4. A Cloudflare Access application and staff email allowlist for the staff API.
5. A Google Cloud OAuth 2.0 web client with the exact callback URL configured; Google credentials are stored only as Worker secrets.

Do not send or commit Cloudflare, Resend or email passwords, recovery codes, API tokens, or OTP secrets. Set secrets locally with Wrangler.

## First-time setup

Run commands from the `backend` folder in PowerShell:

```powershell
npm install --save-dev wrangler
npx wrangler login
npx wrangler d1 create kash-production
```

Copy the database ID from the `d1 create` output into `database_id` in `wrangler.toml`. Set the real site origin, Access team domain, Access application audience, and comma-separated staff emails in `wrangler.toml`. These values are configuration, not credentials. Do not deploy with any `example.com` or `REPLACE_...` values.

Create the database schema and local secrets:

```powershell
npx wrangler d1 migrations apply kash-production --remote
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put OTP_PEPPER
npx wrangler secret put RATE_LIMIT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Wrangler prompts for each secret in your terminal. Keep each secret private. Generate `OTP_PEPPER` and `RATE_LIMIT_SECRET` as separate, random values of at least 32 characters and store them in your password manager. Do not reuse a Resend or Cloudflare credential as either secret. The Worker fails closed if either secret is missing or too short.

Set `EMAIL_FROM` to the sender address verified by Resend. Then configure the Worker route:

In Google Cloud Console, configure the OAuth consent screen and create a **Web application** OAuth client. Add `https://your-domain.example/api/auth/google/callback` as an authorized redirect URI, replacing the example with the exact `SITE_ORIGIN`. If the consent screen is in testing mode, add your test Google accounts as test users. Enter the client ID and client secret only when Wrangler prompts for those secrets. The Worker checks the OAuth state and PKCE verifier, fetches the Google profile over HTTPS, and accepts only profiles with a verified email. Existing KASH accounts with the same verified email can sign in; new Google sign-ins create a verified customer account.

1. In Cloudflare, open **Workers & Pages**, select `kash-api`, and add the custom route `your-domain.example/api/*` for the zone serving the website.
2. Protect `your-domain.example/api/staff/*` with a Cloudflare Access self-hosted application. Require your staff identity provider and an allow policy for approved staff emails.
3. Set `ACCESS_TEAM_DOMAIN` to your Access team hostname (without `https://`), `ACCESS_AUD` to the application's audience tag, and `STAFF_EMAILS` to the same approved addresses. The Worker validates the Access JWT signature, issuer, audience, expiry, email and allowlist; it does not trust a client-supplied email header. Use an identity provider and Access policy that verify staff identities.
4. Deploy the Worker:

```powershell
npx wrangler deploy
```

5. In `js/config.js`, set `api.baseUrl` to `window.location.origin`, then upload the website to the same HTTPS domain. Do not set the API URL to a different origin unless cookie/CORS design is deliberately changed and reviewed.
6. Test Google sign-in, registration, code verification, password login/reset, signed-in request history and staff status updates on the deployed HTTPS site. Use a test Google account first.

## Local development

Create `backend/.dev.vars` locally (it is ignored by `.gitignore`) with:

```text
SITE_ORIGIN=http://127.0.0.1:5500
EMAIL_FROM=KASH General Suppliers <verified-sender@example.com>
RESEND_API_KEY=your-local-test-key
OTP_PEPPER=replace-with-a-random-value-at-least-32-characters-long
RATE_LIMIT_SECRET=replace-with-a-different-random-value-at-least-32-chars
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-access-application-audience
STAFF_EMAILS=your-staff-email@example.com
```

Run Live Server on `http://127.0.0.1:5500`. Temporarily set `api.baseUrl` in `js/config.js` to `"http://127.0.0.1:8787"` so the browser calls the local Worker. Then run the local schema migration and start the API in another terminal:

```powershell
npx wrangler d1 migrations apply kash-production --local
npx wrangler dev --local --port 8787
```

The local API allows only the exact `SITE_ORIGIN` in `.dev.vars`; keep it equal to the Live Server origin. The frontend uses credentialed requests and the Worker returns a restricted CORS response for that origin. Use `127.0.0.1` consistently rather than switching between it and `localhost`. Do not use real customer data during local development. `Secure` session cookies require HTTPS; use the deployed HTTPS environment when testing account cookies end to end. Restore the frontend API base to `window.location.origin` before production.

Google sign-in requires HTTPS for its `__Host-` state and session cookies. Test it on the deployed HTTPS site after configuring the Google OAuth callback and Worker secrets.

## Customer password rules

Passwords must have 12–128 characters, cannot begin/end with a space, cannot be a repeated single character or common password, and cannot contain the email's name portion. Passwords are normalized with NFKC and hashed using PBKDF2-HMAC-SHA-256 (310,000 iterations by default), with a unique per-customer random salt. Plain-text passwords are never written to D1 or logs.

Email verification and reset codes expire after 10 minutes and have a five-attempt limit. Rate limits are enforced server-side and stored as keyed hashes rather than raw IP/email combinations. A valid email code is needed to create a password-based account; Google sign-in requires a verified Google email. The session cookie is Secure, HttpOnly, SameSite=Lax and contains a random token whose hash is stored in D1.

## Cloudflare security checklist

- Enable Cloudflare managed WAF rules and Bot Fight Mode (or the available bot-management tier) for the site.
- Keep the staff API behind Cloudflare Access; never publish a shared staff password in frontend JavaScript.
- Keep Worker secrets in Wrangler secrets, not in `wrangler.toml`, `js/config.js`, the website, or chat.
- Keep HTTPS enabled and redirect HTTP to HTTPS.
- Review Worker/D1 logs and rate-limit events; do not log request payloads, passwords, OTP codes, session tokens or secrets.
- Turnstile is not wired into the current forms yet. Add it before advertising the site broadly if bot abuse appears; server-side verification must be implemented before the widget is considered protection.
- This is an initial security baseline, not a penetration test or certification. Arrange a qualified security review before storing real customer data at scale.

## API paths

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/requests` | Store a validated service request |
| `POST` | `/api/auth/register` | Begin email-verified registration |
| `POST` | `/api/auth/verify` | Verify email code and create session |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/google` | Begin Google Account sign-in |
| `GET` | `/api/auth/google/callback` | Complete Google sign-in and create a customer session |
| `POST` | `/api/auth/logout` | Revoke current session |
| `POST` | `/api/auth/password-reset` | Send a reset code without revealing whether an account exists |
| `POST` | `/api/auth/password-reset/complete` | Change password and revoke existing sessions |
| `GET` | `/api/account` | Return the signed-in customer's basic account details |
| `GET` | `/api/account/requests` | Return the signed-in customer's requests |
| `GET` | `/api/staff/requests` | Access-protected staff request queue |
| `PATCH` | `/api/staff/requests/:id` | Access-protected status update with audit event |
