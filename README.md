# KASH

**One platform to track transport, food and hospitality.** The business owner signs
in once and sees money in, money out, net position, what needs attention and where
revenue comes from — on one screen — then drills into any division.

<p align="center"><em>One Platform. Many Solutions.  &nbsp;·&nbsp;  Manage · Track · Grow</em></p>

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

Build:

```bash
npm run build        # -> dist/            (normal static build)
npm run build:single # -> dist-single/     (one self-contained index.html)
npm run preview      # serve the last build
```

Requires Node 18+.

## Signing in

Demo auth — pick any account on the sign-in screen (they're one click to fill) and
use password `kash` (or any non-empty text). Each account maps to a role:

| Account | Role | Sees |
| --- | --- | --- |
| Wanjiku Kamande | Super Admin | everything |
| Victor Kimani | Accountant | all divisions (read-only), Expenses, Reports |
| Peter Mwangi | Transport Manager | Transport + finance |
| Aisha Noor | Butchery Manager | Butchery + finance |
| Daniel Kiprop | Hospitality Manager | Hospitality + finance |
| Mercy Adhiambo | Staff | Overview, Updates, Settings |

You can also deep-link a role for demos/screenshots:
`/?role=Accountant&view=reports`.

## What's in it

- **Overview** — deliberately plain: **Money in / Money out / What's left** with
  week-over-week change, a card per service (tap to open), one live 12-week
  *money in vs money out* bar chart, latest activity in plain words, and a short
  "needs a look" list.
- **Filters** — every list (Transport, Butchery, Hospitality, Payments, Expenses, Reports,
  Users) has a filter row: search, status / method / category / division dropdowns and a
  date range, with one-tap Clear.
- **Top tabs** — Home / Transport / Butchery / Hospitality sit as big buttons above every
  page (and as the mobile bottom bar); the sidebar keeps the rest.
- **All Services** — the three divisions side by side.
- **Transport** — trips, fleet, drivers. Trip fare is income; trip fuel/tolls
  post to the ledger automatically. Service-interval and insurance alerts.
- **Butchery** — chicken, eggs, goat and other meats: orders, product list with
  per-item margin. Order value is income; product cost posts automatically as COGS.
- **Hospitality** — bookings and rooms. A room's *occupied* state is derived from
  live bookings, never set by hand. Daily occupancy chart.
- **Expenses** — the full cost ledger. Rows you keyed in are editable; auto-posted
  rows (trip fuel, food cost) are shown read-only so the P&L always reconciles.
- **Reports** — filter the one ledger by period + division, see the P&L by
  division, export CSV, or print.
- **Users & Roles**, **Messages** (message anyone on the platform + a shared
  reminder list).
- **Settings** (company profile, theme, notification channels, backup / restore /
  reset) lives only in the account popup at the foot of the sidebar - click your
  name, then Settings.

Everything you enter is saved to the browser (`localStorage` under `kash.*` keys) and survives a
refresh. Settings → Data management exports/imports a JSON backup or resets to the
demo dataset.

### One ledger

`src/lib/derive.js` flattens every trip, order, booking and expense into a single
list of money movements. Overview, the division views, Expenses and Reports all
read from it, so the numbers can't disagree with each other.

## Keyboard

- `Ctrl/Cmd + K` — command palette (search any record, jump to a page, create something)
- `Ctrl/Cmd + B` — toggle the mobile nav drawer

## Tech

React 18 · Vite · Tailwind · Recharts · lucide-react. No backend.

```
src/
  lib/        constants, formatting, seed data, the ledger/analytics, store, forms
  components/ UI kit, layout shell, DataTable, Charts, Modal, CommandPalette
  views/      one file per screen
  App.jsx     shell + router + modal orchestration
```

## Payments (worker-initiated)

Every role - including Staff - has a **Payments** page. A worker taps **Record
payment**, chooses money out or money in, enters the amount and who it's with,
and picks a method. An **M-Pesa** payment fires a simulated STK prompt and only
lands in the books once approved; Cash / Bank record straight away. Recorded
payments flow into the same ledger as everything else, so they show up in
Overview, Reports and the division P&L. Staff see only their own; managers and
admins see everyone's, with filters.

## Charts

Every time-series chart is a **vertical bar chart** built from the live ledger
(`weeklySeries` / `seriesByMonth` in `src/lib/derive.js`) and recomputes the moment
a record is added or edited. Rankings (top routes, best sellers, spend by category)
stay horizontal for label legibility.

## Legacy

`legacy/nexora-one-dashboard.original.jsx` is the original single-file prototype
this project was built from, kept for reference.
