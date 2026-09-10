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
| Aisha Noor | Food Manager | Food + finance |
| Daniel Kiprop | Hospitality Manager | Hospitality + finance |
| Mercy Adhiambo | Staff | Overview, Updates, Settings |

You can also deep-link a role for demos/screenshots:
`/?role=Accountant&view=reports`.

## What's in it

- **Overview** — the owner's screen: money-in / money-out / net-position tiles with
  week-over-week change, a live 12-week *received vs spent* bar chart, recent activity,
  a revenue-mix donut, the "needs attention" feed and upcoming reminders.
- **All Services** — the three divisions side by side.
- **Transport** — trips, fleet, drivers. Trip fare is income; trip fuel/tolls
  post to the ledger automatically. Service-interval and insurance alerts.
- **Food** — orders, menu with per-item margin. Order value is income; food cost
  posts automatically as COGS.
- **Hospitality** — bookings and rooms. A room's *occupied* state is derived from
  live bookings, never set by hand. Daily occupancy chart.
- **Expenses** — the full cost ledger. Rows you keyed in are editable; auto-posted
  rows (trip fuel, food cost) are shown read-only so the P&L always reconciles.
- **Reports** — filter the one ledger by period + division, see the P&L by
  division, export CSV, or print.
- **Users & Roles**, **Updates & reminders**, **Settings** (company profile,
  theme, notification channels, backup / restore / reset).

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

## Charts

Every time-series chart is a **vertical bar chart** built from the live ledger
(`weeklySeries` / `seriesByMonth` in `src/lib/derive.js`) and recomputes the moment
a record is added or edited. Rankings (top routes, best sellers, spend by category)
stay horizontal for label legibility.

## Legacy

`legacy/nexora-one-dashboard.original.jsx` is the original single-file prototype
this project was built from, kept for reference.
