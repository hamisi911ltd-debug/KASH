# KASH - Technical Requirements (TRD)

## Stack
- **ERP frontend:** React 18, Vite, Tailwind, Recharts, Leaflet. Built to static files, hosted on Cloudflare Pages.
- **Website:** plain HTML, CSS and vanilla JavaScript (no build step). Hosted on Cloudflare Pages.
- **API:** Cloudflare Worker (`worker/src/index.js`), JSON over HTTPS.
- **Data:** Cloudflare Workers KV (one namespace per environment), storing each collection as a JSON array.
- **Images:** Cloudflare R2 bucket per environment, served by the Worker at `/uploads/<key>`.
- **Shared rules:** `src/lib/` (schema, permissions, policy) is imported by both the ERP and the Worker, so the two can't disagree.

## Environments
| Environment | ERP | API | Website |
|---|---|---|---|
| Demo | `kash-1if` (retired) | `kash-api` (retired) | `kash-suppliers-dyi` (retired) |
| Ready to host | `kash-live-eux` | `kash-api-live` | `kash-suppliers-live-7qn` |

Custom domains: website on the root domain, ERP on `erp.<domain>`.

## Security controls in place
- PBKDF2-SHA256 password hashing, rounds stored with each hash (upgradable without locking anyone out).
- HS256 signed sessions, 14-day expiry, suspended accounts rejected immediately.
- Login lockout: 5 failed tries per email or 25 per IP in 15 minutes.
- Generic error messages; internal details go only to logs, with a reference code shown to the user.
- CORS: the live API answers only the company's domains. The public listings feed is the one open read.
- Security headers on the ERP and website (CSP, frame denial, HSTS, no-sniff).
- Server-side checks on every write: role, division ownership, self-approval block, read-only audit trail.
- Request size limits and content-type checks, including image uploads (JPEG, PNG, WEBP, GIF, 5 MB).

## Known gaps (tracked)
- Bot protection (Cloudflare Turnstile) is built but needs site keys.
- Session token is stored in browser `localStorage`; moving to an HTTP-only cookie is a larger change.
- Password hashing rounds (10,000) are below current guidance; raise on a paid plan.
- KV stores whole collections, so two simultaneous writes can overwrite each other. D1 is the fix.
- No two-factor sign-in for admin roles.
- No password-reset email (needs an email provider).

## Testing and delivery
- 135 automated tests (`npm test`): permissions, sign-in rules, hashing, ledger maths, approvals, listings, uploads, messaging, security headers, crash reporting.
- CI runs the tests and a build on every push (`.github/workflows/ci.yml`).
- Deploy: the API first, verified healthy, then the frontends built against it.
