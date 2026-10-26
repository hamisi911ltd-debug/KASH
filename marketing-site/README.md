# KASH General Suppliers

Website for KASH General Suppliers, with customer account features and an optional Cloudflare Worker + D1 backend.

## Preview the website

1. Open this folder in Visual Studio Code.
2. Start a local static web server, such as the Live Server extension, from this folder.
3. Open `KGS.V1.html` in the browser.

The site runs in demo mode while `api.baseUrl` in `js/config.js` is empty. Demo submissions stay in the visitor's browser and are not sent to KASH.

## Backend

The optional API uses a Cloudflare Worker and D1. Setup, local development, and deployment instructions are in [backend/README.md](backend/README.md). The backend is not live until it has been configured and deployed.

## Project layout

- `KGS.V1.html` — website entry page
- `css/` and `js/` — styles and frontend code
- `images/` — website images and fallbacks
- `backend/` — Worker API, database migrations, and setup instructions

Keep local credentials and environment files out of Git. In particular, do not commit `backend/.dev.vars` or production secrets.
