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

  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
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

  Promise.all([
    loadPartial("site-header", "partials/header.html"),
    loadPartial("site-footer", "partials/footer.html"),
  ]).then(function () {
    wireMobileMenu();
    wireServicesDropdown();
    markActiveNav();
    setYear();
    wireSocial();
    document.dispatchEvent(new CustomEvent("kash:chrome-ready"));
  });
})();
