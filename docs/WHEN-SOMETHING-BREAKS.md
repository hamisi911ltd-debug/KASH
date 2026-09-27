# When something breaks

You never need to rewrite the code to find a bug. KASH now leaves a trail:
every crash carries a short **code**, is written to the logs, and can be turned
back into the exact file and line. Follow these steps in order.

## 1. Is it down, or is it one person's problem?

- Open `https://<your-api>/api/health`. You should see `"ok": true`.
  - `"configured": false` means the signing secret is missing on the server.
  - `"storage": false` means the database (KV) can't be reached, often the free plan's daily limit.
- Open the website. If the page itself won't load, check Cloudflare Pages → Deployments.
- **Set up a free alarm so you hear first:** create a monitor at [UptimeRobot](https://uptimerobot.com) (free) on the
  health address, checking every 5 minutes, alerting your email or phone.

## 2. Get the code from whoever saw it

| What the person saw | Where the code is |
| --- | --- |
| A white "Something went wrong" screen | "quote code **abc12345** (build 1.0.0+202609270115)" |
| A red message ending "(Ref: abc12345)" | the 8 characters after "Ref:" |

Ask for a screenshot; that's all you need.

## 3. Find that exact crash in the logs

- **Live:** `cd worker && npx wrangler tail --env live` (leave it open, then reproduce the problem).
- **Past:** Cloudflare dashboard → Workers → your API → **Logs**. Search for the code. On the free plan logs are kept
  only briefly, so look soon.

You'll find one line of JSON. The useful parts:

| Line contains | Meaning |
| --- | --- |
| `"unhandled"` | the **server** hit an error. Has the request path, message and stack. |
| `"clientError"` | the **website** crashed in someone's browser. Has the page, build, role and stack. |
| `"audit":"auth.failed"` / `auth.throttled` | someone typing wrong passwords, or being blocked |
| `"audit":"auth.bot_check_failed"` | the human check turned a bot away |
| `"audit":"user.updated"` / `user.deleted` | who changed a person's role or removed them |

## 4. Turn the stack into your real file and line

A browser stack points into the compressed bundle (`index-BGpSmkd5.js:1:48213`), which is unreadable.
Decode it:

```bash
npm run decode -- "TypeError: x is undefined
    at t (https://app.example.com/assets/index-BGpSmkd5.js:1:48213)"
```

You get back something like `src/views/TransportView.jsx:212:9 (saveTrip)`. Open that file at that line.

> This needs the **`sourcemaps/` folder from the same build that's live**. `npm run build` creates it and deliberately keeps
> it *out* of `dist/` so your source isn't published. **Keep it, and back it up.** A crash from a build you no longer
> have the maps for can't be decoded (the tool tells you so).

Server errors (`"unhandled"`) already have readable file names in their stack; no decoding needed.

## 5. Fix it without breaking something else

1. Write a small test that reproduces the bug (in `tests/`), and watch it fail.
2. Fix the code until `npm test` passes. The existing 90+ tests protect permissions, sign-in, and the money maths.
3. `npm run build`, then deploy the API (`npx wrangler deploy --env live`) and the website.

## 6. If a new release made things worse: roll back first, investigate second

- **Website:** Cloudflare Pages → Deployments → pick the last good one → *Rollback*.
- **API:** `cd worker && npx wrangler rollback --env live` (or Workers → Deployments in the dashboard).

## Not automated yet

- Restoring data from an exported backup is manual. Take an export (Settings → Data management) before risky changes.
- There's no paging or dashboard for errors beyond the logs. If crashes become frequent, add Sentry (free tier) on top.
