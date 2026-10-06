# KASH - UI and UX Design Brief

## Principles
- **Plain words:** "Money in", "Money out", "What's left". No jargon on the owner's screen.
- **One next action per screen.** Each page has one obvious primary button.
- **Works on a phone.** Every ERP list collapses to stacked cards; the website uses a slide-over menu below 860px.
- **Trust signals:** the brand logo on every page, clear company details, real phone number, Privacy Policy and Terms in the footer.

## Brand
- Logo: the four-tile KASH artwork (`public/logo.png`, `marketing-site/logo.png`). Use it at its own proportions, on any background.
- Palette: navy `#152F4D` (text), blue `#1E6CA8`, teal `#12958A`, gold `#DFA21C`, coral `#C82E58`.
- Website background: warm cream `#F6EFE1`. Cards use a slightly lighter `#FFFCF5`.
- Type: Plus Jakarta Sans (headings, body); Caveat for the handwritten taglines.

## Website layout
- Header: logo left; Home, Services (dropdown: Transport, Agro, Hospitality), About, Contact; "Get in Touch" button right. Below 860px: logo and a menu button.
- Home hero: headline, "Explore Our Services" button, social icons beneath, large photo right.
- Division cards with a photo, icon and "Learn more".
- Footer: logo, page links, social icons, Privacy Policy and Terms of Use, copyright.
- Floating **Contact** button, bottom right, on every page except Contact.

## ERP layout
- Left sidebar on desktop (logo, navigation grouped as Main, Finance, Administration; account menu at the foot).
- Top bar: search, date, quick **New** menu.
- Division tabs above every page on desktop; bottom navigation on phones.
- Tables: sortable, filterable, exportable to CSV. Rows open actions from a "..." menu.

## States every screen must design
- Loading (spinner with a short sentence), empty (a sentence and one button), error (plain reason plus a reference when it's a server fault), success (a short confirmation).

## Accessibility
- Tap targets at least 44px. Focus outlines visible. Text contrast at least 4.5:1 on cream and white. Images have alt text. The menu and dropdown close with Escape.

## Open design items
- Real photography of each property and department (currently placeholders for most units).
- Final logo lockup for the footer on dark backgrounds.
