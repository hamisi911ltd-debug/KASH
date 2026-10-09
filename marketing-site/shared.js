/* ============================================================
   Loads the one shared header and footer into every page (elements
   with id="site-header" / id="site-footer"), then wires up the parts
   that live inside them: the mobile menu, which nav link is "active",
   and the footer's copyright year.

   Requires being served over http(s) - fetch() of a local file cannot
   read another local file when opened directly as file:///, which is
   a browser security rule, not a bug here. Cloudflare Pages (and any
   `npx serve` / `python -m http.server` while testing locally) serve
   it correctly.
   ============================================================ */
(function () {
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function wireMobileMenu() {
    var nav = document.getElementById("mobileNav");
    var openBtn = document.getElementById("menuOpen");
    var closeBtn = document.getElementById("menuClose");
    if (!nav || !openBtn) return;

    function open() {
      nav.classList.add("open");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden"; // stop the page scrolling behind the panel
    }
    function close() {
      nav.classList.remove("open");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    nav.addEventListener("click", function (e) { if (e.target === nav) close(); }); // tap the dark backdrop
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  function markActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    });
    // The "Services" toggle itself reads as active whenever you're anywhere
    // inside Transport/Agro/Hospitality, even though the dropdown starts closed.
    var toggle = document.getElementById("servicesToggle");
    if (toggle && ["transport", "agro", "hospitality"].indexOf(page) !== -1) {
      toggle.classList.add("active");
    }
    // Same idea for the bottom tab bar's "More" tab - About/Contact live
    // inside its sheet, not as their own tab.
    var moreTab = document.getElementById("menuOpen");
    if (moreTab && ["about", "contact"].indexOf(page) !== -1) {
      moreTab.classList.add("active");
    }
  }

  function wireServicesDropdown() {
    var item = document.getElementById("servicesNavItem");
    var toggle = document.getElementById("servicesToggle");
    if (!item || !toggle) return;

    function close() {
      item.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    function toggleOpen() {
      var willOpen = !item.classList.contains("open");
      item.classList.toggle("open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    }

    toggle.addEventListener("click", function (e) { e.stopPropagation(); toggleOpen(); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* Social profile links. Replace each with the business’s own page address.
     Until then each icon opens the platform’s home page. */
  var SOCIAL = {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/",
    x: "https://x.com/",
    linkedin: "https://www.linkedin.com/",
  };
  function wireSocial() {
    document.querySelectorAll("[data-social]").forEach(function (a) {
      var url = SOCIAL[a.getAttribute("data-social")];
      if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
      else a.style.display = "none";
    });
  }

  /* ---- live listings: what the ERP publishes shows up here ---- */
  var KASH_API = "https://kash-api-live.johndrekuz.workers.dev";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Resolves to the division's published listings, or [] if the feed is
     unreachable - callers then fall back to the built-in content. */
  function fetchPublished(division) {
    return fetch(KASH_API + "/api/public/listings?division=" + encodeURIComponent(division))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return []; });
  }
  window.KASH = window.KASH || {};
  window.KASH.fetchPublished = fetchPublished;
  window.KASH.api = KASH_API;

  function renderListing(l, container) {
    // Matches the hand-written static product cards (.p-card: photo with a
    // division badge, title, description, price, an "Add to Quote" CTA) so
    // whatever the IT Officer publishes sits right alongside them without
    // looking like a second-class, stripped-down version.
    var card = el("div", "p-card");
    var photo = el("div", "photo");
    if (/^https?:\/\//.test(l.imageUrl || "")) {
      var img = el("img"); img.src = l.imageUrl; img.alt = l.title || ""; img.loading = "lazy";
      photo.appendChild(img);
    } else {
      photo.classList.add("no-photo");
      photo.style.background = "var(--cream-2)";
    }
    if (l.division) {
      var badge = el("span", "p-badge", l.division);
      badge.style.color = "var(--gold)";
      photo.appendChild(badge);
    }
    card.appendChild(photo);
    var body = el("div", "p-body");
    body.appendChild(el("h3", null, l.title || ""));
    if (l.description) body.appendChild(el("p", null, l.description));
    if (l.price) {
      var priceLine = el("p", "p-price");
      priceLine.appendChild(document.createTextNode("From "));
      var strong = el("b", null, "KES " + Number(l.price).toLocaleString());
      priceLine.appendChild(strong);
      if (l.meta) priceLine.appendChild(document.createTextNode(" " + l.meta));
      body.appendChild(priceLine);
    } else if (l.meta) {
      body.appendChild(el("p", "p-price", l.meta));
    }
    var cta = document.createElement("a");
    cta.className = "btn btn-line-navy btn-sm p-cta";
    cta.target = "_blank"; cta.rel = "noopener";
    cta.href = "https://wa.me/254142426451?text=" + encodeURIComponent("Hi, I'd like a quote for " + (l.title || "this item"));
    cta.textContent = "Add to Quote";
    body.appendChild(cta);
    card.appendChild(body);
    container.appendChild(card);
  }

  function loadListings(division, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    fetch(KASH_API + "/api/public/listings?division=" + encodeURIComponent(division))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (items) {
        if (!items.length) { container.style.display = "none"; return; }
        items.forEach(function (l) { renderListing(l, container); });
      })
      .catch(function () { container.style.display = "none"; }); // if the feed is unreachable, the page still shows its own content
  }

  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  // Scroll reveal: every ".reveal" block (and the flip/cross-in cards and
  // photo-gallery rows that ride along with it) fades and rises in as it
  // enters the screen. Shared across every page, not just the homepage,
  // so content below the fold on Transport/Agro/Hospitality/About isn't
  // left permanently invisible.
  function wireReveal() {
    var items = document.querySelectorAll(".reveal, .flip-in, .cross-in, .g-row");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  function loadPartial(mountId, path) {
    return fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error(path + ": " + res.status);
        return res.text();
      })
      .then(function (html) {
        var mount = document.getElementById(mountId);
        if (!mount) return;
        // Insert each top-level element from the partial right before the
        // mount point, then remove the empty mount placeholder.
        var t = document.createElement("template");
        t.innerHTML = html;
        Array.from(t.content.children).forEach(function (node) {
          mount.parentNode.insertBefore(node, mount);
        });
        mount.remove();
      })
      .catch(function (err) {
        console.error("Could not load " + path, err);
        var mount = document.getElementById(mountId);
        if (mount) mount.textContent = ""; // fail quiet rather than show a broken fetch error inline
      });
  }

  // Background decoration, not floating objects: a thin Kenyan flag-colour
  // stripe at the very top of the page, a Maasai shield-and-spears
  // watermark bottom-right (the actual centrepiece of Kenya's own coat of
  // arms, not a stock flag icon), and an acacia silhouette bottom-left for
  // balance - both static in position, each with its own slow, gentle
  // animation (see #kash-bg in styles.css).
  function wireKenyanBackground() {
    var bar = document.createElement("div");
    bar.className = "kash-flagbar";
    bar.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 5; i++) bar.appendChild(document.createElement("span"));
    document.body.insertBefore(bar, document.body.firstChild);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var box = document.createElement("div");
    box.id = "kash-bg";
    box.setAttribute("aria-hidden", "true");
    // The shield is the real Maasai silhouette (waisted sides, pointed top
    // and bottom, a raised centre spine) rather than a plain oval, painted
    // in the flag's own black/white/red/white/green bands clipped to that
    // outline - same as the real coat of arms. Spears stay a plain tone.
    box.innerHTML =
      '<svg class="kash-shield" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">' +
      '<line x1="18" y1="292" x2="200" y2="8" stroke="var(--navy)" stroke-width="8" stroke-linecap="round"/>' +
      '<polygon points="200,8 216,24 186,36" fill="var(--navy)"/>' +
      '<line x1="202" y1="292" x2="20" y2="8" stroke="var(--navy)" stroke-width="8" stroke-linecap="round"/>' +
      '<polygon points="20,8 4,24 34,36" fill="var(--navy)"/>' +
      '<defs><clipPath id="kashShieldClip"><path d="M110 36 C155 36 184 70 184 132 C184 198 155 252 110 284 C65 252 36 198 36 132 C36 70 65 36 110 36 Z"/></clipPath></defs>' +
      '<g clip-path="url(#kashShieldClip)">' +
      '<rect x="30" y="36" width="160" height="72" fill="#000"/>' +
      '<rect x="30" y="108" width="160" height="10" fill="#fff"/>' +
      '<rect x="30" y="118" width="160" height="72" fill="#BB0000"/>' +
      '<rect x="30" y="190" width="160" height="10" fill="#fff"/>' +
      '<rect x="30" y="200" width="160" height="90" fill="#060"/>' +
      "</g>" +
      '<path d="M110 36 C155 36 184 70 184 132 C184 198 155 252 110 284 C65 252 36 198 36 132 C36 70 65 36 110 36 Z" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"/>' +
      '<line x1="110" y1="50" x2="110" y2="270" stroke="rgba(255,255,255,.4)" stroke-width="2"/>' +
      '<line x1="112.5" y1="50" x2="112.5" y2="270" stroke="rgba(0,0,0,.25)" stroke-width="2"/>' +
      "</svg>" +
      // An umbrella acacia - the single most recognisable Kenyan-savannah
      // silhouette - balancing the shield on the other side of the page.
      // Tapered forking branches (not plain lines), a clustered leafy
      // canopy built from several overlapping clumps rather than one
      // smooth blob, and small round fruit/pods scattered through it.
      '<svg class="kash-tree" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M138 220 L146 128 L154 128 L162 220 Z" fill="var(--navy)"/>' +
      '<polygon points="150,132 68,98 73,107 153,141" fill="var(--navy)"/>' +
      '<polygon points="151,130 112,92 118,100 155,137" fill="var(--navy)"/>' +
      '<polygon points="153,128 149,88 157,88 159,131" fill="var(--navy)"/>' +
      '<polygon points="155,130 193,92 188,100 157,137" fill="var(--navy)"/>' +
      '<polygon points="156,132 236,100 232,109 158,141" fill="var(--navy)"/>' +
      '<path d="M90 100 L72 86 M118 88 L108 72 M152 86 L150 68 M184 88 L192 72 M210 100 L228 86" stroke="var(--navy)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<ellipse cx="68" cy="88" rx="46" ry="24" fill="var(--teal)"/>' +
      '<ellipse cx="138" cy="70" rx="58" ry="30" fill="var(--teal)"/>' +
      '<ellipse cx="212" cy="86" rx="50" ry="26" fill="var(--teal)"/>' +
      '<ellipse cx="100" cy="104" rx="44" ry="20" fill="var(--teal)"/>' +
      '<ellipse cx="178" cy="106" rx="46" ry="20" fill="var(--teal)"/>' +
      '<g fill="var(--gold)">' +
      '<circle cx="48" cy="92" r="3.4"/><circle cx="82" cy="78" r="3"/><circle cx="118" cy="62" r="3.4"/>' +
      '<circle cx="150" cy="58" r="3"/><circle cx="182" cy="64" r="3.4"/><circle cx="214" cy="76" r="3"/>' +
      '<circle cx="238" cy="92" r="3.2"/><circle cx="96" cy="100" r="2.8"/><circle cx="160" cy="98" r="3"/>' +
      '<circle cx="200" cy="102" r="2.8"/>' +
      "</g>" +
      "</svg>";
    document.body.appendChild(box);
  }

  wireReveal();
  wireKenyanBackground();

  Promise.all([
    loadPartial("site-header", "partials/header.html"),
    loadPartial("site-footer", "partials/footer.html"),
  ]).then(function () {
    wireMobileMenu();
    wireServicesDropdown();
    markActiveNav();
    setYear();
    wireSocial();
    var page = document.body.getAttribute("data-page");
    if (page === "transport") loadListings("Transport", "live-transport");
    if (page === "agro") loadListings("Food", "live-agro");
    if (page === "hospitality") loadListings("Hospitality", "live-hospitality");
    document.dispatchEvent(new CustomEvent("kash:chrome-ready"));
  });
})();
