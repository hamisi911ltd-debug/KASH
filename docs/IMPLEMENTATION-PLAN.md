# KASH - Implementation Plan

## Done
- ERP: divisions, ledger, approvals with a full trail, messaging (direct and Everyone), invitation-only accounts, role permissions, website listings, photo uploads (code ready; storage waiting on R2).
- Website: multi-page site, property pages with maps and facilities, services dropdown, contact and legal pages, social icons, shared header and footer, security headers.
- Infrastructure: separate ready-to-host API and ERP and website, live on the johndrekuz Cloudflare account; API locked to company domains.
- Quality: 135 automated tests, CI on every push, launch checklist and troubleshooting guide.

## Needed from you (blocks these)
| Item | Blocks |
|---|---|
| Enable R2 in the dashboard | Photo uploads (both ERP and website listings) |
| Domain and DNS on Cloudflare | Final addresses for website and ERP |
| Social media page addresses | Icons currently open the platform home pages |
| Owner's name and company email | Creating the first admin login |
| Real property photos and details | Replacing demo photos |
| Lawyer review of Privacy Policy and Terms | Going public with legal pages |
| Email provider (e.g. Resend) | Password reset, invitation emails |

## Next, in order (I can build these)
1. **Admin bootstrap:** create the owner's Super Admin account on the ready-to-host API.
2. **Cloudflare Turnstile** on sign-in: needs the site and secret keys.
3. **Website pulls live listings** from the API, so managers' updates appear on the site.
4. **Move data to D1** for safe concurrent saves and proper queries.
5. **Two-factor sign-in** for Super Admin, Admin and Director.
6. **Session in a secure cookie** instead of browser storage.
7. **Password reset and invitation emails** once an email provider is connected.
8. **Backups:** scheduled export of all data to R2.
9. **Error monitoring** (e.g. Sentry) with alerts.
10. **End-to-end browser tests** for sign-in, approval and messaging flows.

## What "100% real" means here
A system is real when: it runs on production infrastructure with a real domain; every account is a real person invited by the company; data is stored safely and backed up; every public detail is the business's own; the legal pages are reviewed; the team has been trained; and someone is on call for failures. Items 1 to 10 above close the technical part; the rest is the business's own setup.
