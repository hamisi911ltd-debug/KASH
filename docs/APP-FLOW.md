# KASH - Application Flow

## Website (public)
1. Visitor lands on **Home**: hero, three division cards, social icons.
2. **Transport / Agro / Hospitality** (also reachable from the Services dropdown) show the division's offer and a WhatsApp or phone button.
3. **Hospitality** lists properties. **View Details** opens `property.html?id=<slug>`: photos, facilities, price, WhatsApp booking, and the map with Get Directions.
4. **About** and **Contact** (department WhatsApp, head office, hours, map).
5. Footer: Privacy Policy and Terms of Use. A floating **Contact** button on every page except Contact.

## ERP (staff)
1. **Sign in** with the invited company email and password. No public sign-up.
2. First sign-in on a new system: the owner's account (Super Admin) is created by the admin.
3. After sign-in, the sidebar and top tabs show only what the role may open (see PRD roles).
4. **Overview** (Admin, Accountant, Staff) or the division page (managers and workers).
5. **Create** from the top **New** menu or a page's own button; forms validate before saving.
6. **Approvals:** a big expense or order shows "Pending". An eligible approver opens it and chooses Approve or Reject with an optional note. The decision, who made it, their role and the time are recorded and shown to Accountant and company-wide roles.
7. **Messages:** pick a colleague or **Everyone**, type, send. Unread counts are kept per conversation.
8. **Website** (managers and company-wide roles): see the live page, add/edit/remove listings, upload a photo (once R2 is enabled).
9. **Users & Roles** (Super Admin, Admin, Director): invite by email, change role or division, suspend, remove.
10. **Settings:** company profile, data export/import, reset (demo only).

## Errors
- Sign-in lockout: "Too many failed attempts - wait 15 minutes."
- Unexpected server error: "Something went wrong (Ref: abc12345)" - the reference finds the exact log line.
