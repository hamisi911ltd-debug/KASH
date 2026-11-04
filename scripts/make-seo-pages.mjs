/* Writes the crawlable landing pages, sitemap.xml and robots.txt for the website.
   The website itself is a hash-routed single-page app, which Google cannot index
   page by page, so each main service gets a real static page that explains it
   and links into the app. Run: node scripts/make-seo-pages.mjs */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "marketing-site");
const SITE = "https://kashgeneralsuppliers.com";
const EMAIL = "info@kashgeneralsuppliers.com";
const PHONE = "+254142426451";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");

const ratesSrc = readFileSync(join(root, "js/data/rates.js"), "utf8");
const rows = [...ratesSrc.matchAll(/\['([^']+)',\s*(\d+)\]/g)].map((m) => [m[1], Number(m[2])]);
if (rows.length !== 47) throw new Error("expected 47 rate rows, found " + rows.length);

const pages = [
  {
    path: "transport-rates",
    title: "Container Trucking Rates from Nairobi ICD & CFS Depots | KASH General Suppliers",
    desc: "KASH container trucking rate card from the Nairobi ICD and CFS depots to 47 destinations, including Mombasa, Naivasha, Kisumu, Thika and Westlands. Rates before 16% VAT.",
    h1: "Container trucking rates from Nairobi ICD and CFS depots",
    lead: "Ready-to-use rates for container trucking from the ICD, Syokimau CFS, Compact CFS, NICT CFS and Michellcotts CFS to 47 destinations across Kenya. All rates are in Kenya shillings and are shown before 16% VAT.",
    app: "/#/transport/rates",
    cta: "Request a truck",
    body: () => `
<h2>Rate card (KES, before VAT)</h2>
<table><thead><tr><th>Destination</th><th>Rate</th><th>VAT 16%</th><th>Total</th></tr></thead><tbody>
${rows.map(([to, a]) => `<tr><td>${esc(to)}</td><td>${kes(a)}</td><td>${kes(Math.round(a * 0.16))}</td><td>${kes(a + Math.round(a * 0.16))}</td></tr>`).join("\n")}
</tbody></table>
<h2>Good to know</h2>
<ul><li>Rates are before 16% VAT; VAT is added on the invoice.</li><li>The card applies to container trucking from the ICD and the CFS depots listed above.</li><li>For a destination that is not on the card, send us the details and we will quote it.</li></ul>`,
    faq: [
      ["Is VAT included in the KASH rate card?", "No. Rates are shown before 16% VAT, and VAT is added on the invoice."],
      ["Where does the trucking start?", "From the Nairobi ICD, Syokimau CFS, Compact CFS, NICT CFS and Michellcotts CFS."],
      ["How do I book a truck?", "Choose your destination in the request form on the KASH website, or call or WhatsApp " + PHONE + "."],
    ],
  },
  {
    path: "transport-logistics",
    title: "Transport & Logistics in Kenya: Trucks, Rides and Delivery | KASH General Suppliers",
    desc: "KASH General Suppliers provides trucking, cargo transport, ride services and delivery across Kenya. Request a truck, a ride or a delivery online.",
    h1: "Transport and logistics across Kenya",
    lead: "A branded, well-maintained truck moving goods across Kenya, from the coast to the highlands, plus ride services and delivery for individuals and businesses.",
    app: "/#/transport",
    cta: "Request a truck or ride",
    body: () => `
<h2>What we move</h2>
<ul><li><strong>Container trucking</strong> from the Nairobi ICD and CFS depots. See the <a href="/transport-rates/">rate card</a>.</li><li><strong>Cargo and general goods</strong> to towns and cities across Kenya.</li><li><strong>Rides</strong> with a pickup and drop-off pin so the driver finds you first time.</li><li><strong>Delivery</strong> of goods and parcels to a doorstep.</li></ul>
<h2>Why customers choose KASH</h2>
<p>KASH General Suppliers is a registered Kenyan company with over a decade of experience. We focus on reliability: clear prices, agreed timelines and a team you can reach by phone or WhatsApp.</p>`,
    faq: [
      ["Which areas does KASH transport serve?", "KASH serves clients across Kenya, in both urban and rural areas."],
      ["How do I request a truck, ride or delivery?", "Use the request forms on the KASH website, or call or WhatsApp " + PHONE + "."],
    ],
  },
  {
    path: "agriculture-food",
    title: "Fresh Food & Farm Produce Supplier in Kenya | KASH General Suppliers",
    desc: "KASH General Suppliers supplies fresh chicken, eggs, goat meat and beef to homes, businesses and institutions across Kenya. Order online.",
    h1: "Fresh food and farm produce from KASH",
    lead: "From our farms to your table: quality chicken, eggs, goat meat and beef, supplied to individuals, businesses, institutions and organizations across Kenya.",
    app: "/#/agro",
    cta: "See products and order",
    body: () => `
<h2>What we supply</h2>
<ul><li><strong>Chicken</strong>: whole birds, thighs, drumsticks and wings.</li><li><strong>Eggs</strong>: fresh farm eggs.</li><li><strong>Goat meat and beef</strong>: fresh cuts including steak and ribs.</li></ul>
<h2>Quality you can rely on</h2>
<p>Agriculture and food is one of KASH General Suppliers' three main sectors. We hold ourselves to quality, reliability and customer satisfaction, and we deliver across Kenya.</p>`,
    faq: [
      ["Who does KASH supply with food?", "Individuals, businesses, institutions and organizations across Kenya."],
      ["How do I order?", "Open the Products page on the KASH website, add items to your list and send the request, or call or WhatsApp " + PHONE + "."],
    ],
  },
  {
    path: "stays-accommodation",
    title: "Furnished Studio Apartment in Nairobi, from KES 3,500 a Night | KASH General Suppliers",
    desc: "A comfortable furnished studio apartment in Nairobi from KES 3,500 per night with KASH General Suppliers. See photos and send a booking request.",
    h1: "A comfortable furnished studio in Nairobi",
    lead: "Hospitality and accommodation from KASH General Suppliers: a stylish furnished studio for business trips, short breaks and longer visits, from KES 3,500 per night.",
    app: "/#/properties",
    cta: "See stays and book",
    body: () => `
<h2>The studio</h2>
<ul><li><strong>Open-plan studio</strong>: from KES 3,500 per night.</li><li>Grey corner sofa, a feature shelf that separates the lounge from the bed, soft ceiling lights and a large window with a balcony view over the trees.</li><li>Free Wi-Fi, a fully equipped kitchen, a TV and 24/7 security.</li></ul>
<h2>Booking</h2>
<p>Browse photos and amenities on the KASH website, then send a booking request. We reply with availability and confirm your dates.</p>`,
    faq: [
      ["How much is a studio stay?", "Studio stays start from KES 3,500 per night."],
      ["How do I book?", "Use the booking form on the KASH website, or call or WhatsApp " + PHONE + "."],
    ],
  },
];

const nav = [["/", "Home"], ["/transport-logistics/", "Transport"], ["/transport-rates/", "Rate card"], ["/agriculture-food/", "Food"], ["/stays-accommodation/", "Stays"]];
const css = `*{box-sizing:border-box}body{margin:0;font:16px/1.6 "Plus Jakarta Sans",system-ui,Segoe UI,Arial,sans-serif;color:#0f1f3a;background:#fff}header{background:#0a1f3d;padding:12px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:18px}header img{height:40px;width:auto;display:block}nav{display:flex;flex-wrap:wrap;gap:6px 18px}nav a{color:#fff;text-decoration:none;font-weight:600;font-size:15px}nav a:hover{text-decoration:underline}main{max-width:860px;margin:0 auto;padding:28px 20px 56px}h1{font-size:clamp(26px,5vw,38px);line-height:1.2;margin:.2em 0 .4em}h2{margin:1.6em 0 .5em;font-size:22px}.lead{font-size:18px;color:#34476a}.cta{display:inline-block;background:#f9a800;color:#0a1f3d;font-weight:800;padding:13px 24px;border-radius:999px;text-decoration:none;margin:10px 0}table{border-collapse:collapse;width:100%;font-size:15px}th,td{padding:9px 10px;border-bottom:1px solid #dfe5f0;text-align:left}th{background:#f2f5fa}td:nth-child(n+2),th:nth-child(n+2){text-align:right;white-space:nowrap}footer{background:#0a1f3d;color:#cbd6ea;padding:24px 20px;text-align:center;font-size:14px}footer a{color:#fff}`;

function html(p) {
  const url = `${SITE}/${p.path}/`;
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: p.title, description: p.desc, url, isPartOf: { "@id": SITE + "/#org" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: p.h1, item: url } ] },
  ];
  return `<!DOCTYPE html>
<html lang="en-KE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0a1f3d">
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KASH General Suppliers">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/og-image.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_KE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${SITE}/images/og-image.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${css}</style>
</head>
<body>
<header><a href="/" aria-label="KASH General Suppliers home"><img src="/images/logo.webp" alt="KASH General Suppliers" width="104" height="40"></a><nav aria-label="Main">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav></header>
<main>
<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.lead)}</p>
<p><a class="cta" href="${p.app}">${esc(p.cta)}</a></p>
${p.body()}
<h2>Frequently asked questions</h2>
${p.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n")}
<p><a class="cta" href="${p.app}">${esc(p.cta)}</a></p>
</main>
<footer>KASH General Suppliers, Nairobi, Kenya &middot; <a href="tel:${PHONE}">${PHONE}</a> &middot; <a href="mailto:${EMAIL}">${EMAIL}</a><br><a href="/">kashgeneralsuppliers.com</a></footer>
</body>
</html>
`;
}

for (const p of pages) {
  mkdirSync(join(root, p.path), { recursive: true });
  writeFileSync(join(root, p.path, "index.html"), html(p));
}
const day = new Date().toISOString().slice(0, 10);
const urls = ["/", ...pages.map((p) => `/${p.path}/`)];
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${day}</lastmod></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log("wrote", pages.length, "pages, sitemap.xml, robots.txt");
