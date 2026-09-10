# Nexora One

A unified operations dashboard for a group that runs **transport, food and hospitality**
under one roof. The owner signs in once and sees every division's revenue, costs,
profit and open tasks on a single screen — then drills into any of them.

<p align="center"><em>One business. Total control.</em></p>

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
use any non-empty password. Each account maps to a role:

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

- **Overview** — group revenue with trend vs. the previous period, per-division
  cards, occupancy, a live "needs attention" feed, recent income and reminders.
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

Everything you enter is saved to the browser (`localStorage`) and survives a
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

## Legacy

`legacy/nexora-one-dashboard.original.jsx` is the original single-file prototype
this project was built from, kept for reference.
