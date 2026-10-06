# KASH - Product Requirements (PRD)

## Purpose
KASH runs a multi-division business from one place: transport (trucks, cars, tuktuks), agro and food supply (chicken, eggs, goat, beef), and properties and hospitality (apartments and Airbnb units). It gives owners one view of money in, money out and what's left, and gives each department a workspace.

## Two products
1. **ERP (internal):** the staff system at `erp.<domain>`. Sign-in is by invitation only, using a company email. There is no public sign-up.
2. **Website (public):** the marketing site at `<domain>`. It presents the three divisions, lists properties, and takes enquiries by WhatsApp and phone.

## Users and roles
| Role | Who | Can |
|---|---|---|
| Super Admin / Admin / Director | Owners and leadership | Everything, manage users, settings, approve, see all approvals, publish any division's website listings |
| Accountant | Finance oversight | Read/write across divisions, expenses, reports, approve, see all approvals |
| Transport / Agro / Hospitality Manager | Department heads | Their division in full, approve their division's big items, publish their division's website listings and photos |
| Driver / Agro Attendant / Hospitality Attendant | Frontline staff | Log their own trips, sales and bookings; messaging |
| Staff | General staff | Overview, payments, messaging |

## Core requirements
- **Money:** one ledger feeds every screen; no figure can disagree with another.
- **Approvals:** big expenses and orders need a second person's sign-off. No one can approve their own entry.
- **Messaging:** staff message a colleague directly or the whole team at once.
- **Website content:** managers publish listings and photos that appear on the public site.
- **Security:** invitation-only accounts, lockout after repeated failed sign-ins, role checks enforced on the server, audit trail.
- **Legal:** Privacy Policy and Terms of Use on the website; 18+ and terms acceptance at sign-up.

## Out of scope for now
Payment processing (M-Pesa is recorded, not live-charged), multi-business SaaS, native mobile apps.
