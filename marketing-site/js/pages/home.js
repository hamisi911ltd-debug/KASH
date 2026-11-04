/* =========================================================
   KASH - js/pages/home.js
   Home page (hero slideshow, services, about, products, tiles, quote).
========================================================= */
'use strict';

function heroHtml(){
  const n = HERO_SLIDES.length;
  const small = window.matchMedia('(max-width:960px)').matches;
  /* only the first photo loads now; initHero fetches the others as their turn comes */
  const bg = HERO_SLIDES.map((h, i) => `<img class="hs ${i === 0 ? 'on' : ''}" ${i ? 'data-src' : 'src'}="${imgSrc(small && h.mimg ? h.mimg : h.img)}" alt="${esc(h.alt)}" ${i ? '' : 'fetchpriority="high"'} style="--pos:${h.pos};--mpos:${h.mpos};--ox:${h.ox};--oy:${h.oy};--sc:${i === 0 ? h.sc : 1}">`).join('');
  const sl = HERO_SLIDES.map((h, i) => `<div class="slide ${i === 0 ? 'is-active' : ''}"><h1>${h.h1}</h1><p>${h.p}</p>
    <div class="hero-actions"><a class="btn btn-amber" href="${h.a[1]}">${h.a[0]}</a><a class="btn btn-ghost" href="${h.b[1]}">${h.b[0]}</a></div></div>`).join('');
  const dots = HERO_SLIDES.map((h, i) => `<button class="${i === 0 ? 'on' : ''}" aria-label="Slide ${i + 1}"></button>`).join('');
  return `<section class="hero" id="home" aria-roledescription="carousel" aria-label="KASH highlights">
    <div class="hero-bg">${bg}</div><div class="hero-shade"></div>
    <button class="arrow l" id="prev" type="button" aria-label="Previous slide" title="Previous"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
    <button class="arrow r" id="next" type="button" aria-label="Next slide" title="Next"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
    <div class="hero-inner"><div class="hero-copy">
      <div class="tag">${brandBar()}Kenya's trusted supplier</div>
      <div class="slides">${sl}</div>
      <div class="hero-ctrl"><div class="count" aria-live="off"><span id="cur">01</span> <small>/ 0${n}</small></div><div class="dashes" id="dashes" aria-label="Choose slide">${dots}</div></div>
    </div></div>
    <div class="place">${ico('pin')}<div><b id="placeB">${HERO_SLIDES[0].place[0]}</b><span id="placeS">${HERO_SLIDES[0].place[1]}</span></div></div>
    ${HERO_RIBBON}
  </section>`;
}
function pageHome(){
  const svc = SERVICES.map((s) => `<article class="svc"><img src="${imgSrc(s.img)}" alt="" loading="lazy">
    <div class="svc-body"><div class="badge ${COLOR[s.color]}">${ico(s.icon)}</div><h3>${s.title}</h3><p>${s.short}</p>
    <a href="#/${s.route}" aria-label="Explore ${s.title}">Explore</a></div><div class="bar ${COLOR[s.color]}"></div></article>`).join('');

  const prods = HOME_PRODUCT_IDS.map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean).map((p) => `<a class="prod" href="#/products/${p.category}"><img src="${imgSrc(p.img)}" alt="${esc(p.name)}" loading="lazy">
    <div><p><b>${p.name}</b><span>${p.tag}</span></p></div></a>`).join('');

  const tiles = [
    {href:'#/fleet', img:'fallback/truck.webp', t:'Our fleet', d:'A modern, well-maintained fleet for safe and timely delivery.', go:'See the fleet'},
    {href:'#/properties', img:'stay-living.webp', pos:'50% 72%', t:'Our properties', d:'Comfortable stays in prime locations.', go:'Browse stays'},
    {href:'#/about', img:'fallback/tea-farm.webp', t:'Our impact', d:'Supporting farmers, businesses and communities.', go:'Our story', pos:'75% 85%'},
    {href:'#/contact', img:'fallback/mombasa.webp', t:'Talk to us', d:'Questions, quotes or partnerships. We reply fast.', go:'Get in touch'},
  ].map((t) => `<a class="tile" href="${t.href}"><img src="${imgSrc(t.img)}" alt="" loading="lazy" ${t.pos ? 'style="object-position:' + t.pos + '"' : ''}><h3>${t.t}</h3><p>${t.d}</p><span class="go">${t.go}</span></a>`).join('');

  return `
  ${heroHtml()}

  <section class="section quick-book" aria-labelledby="quickBookTitle"><div class="wrap">
    <h2 id="quickBookTitle" class="sr-only">Order or book</h2>
    <div class="quick-grid">
      <a class="quick-card q-teal" href="#/products"><span class="q-ico">${ico('leaf')}</span><span><b>Order from Agro</b><small>Fresh chicken, eggs, goat and beef</small></span><i aria-hidden="true">&rarr;</i></a>
      <a class="quick-card q-red" href="#/properties"><span class="q-ico">${ico('bed')}</span><span><b>Book a BnB</b><small>Furnished studio from KES 3,500 a night</small></span><i aria-hidden="true">&rarr;</i></a>
      <a class="quick-card q-blue" href="#/quote/truck"><span class="q-ico">${ico('truck')}</span><span><b>Book transport</b><small>Trucks, rides and delivery across Kenya</small></span><i aria-hidden="true">&rarr;</i></a>
    </div>
  </div></section>

  <section class="section services" id="services"><div class="wrap"><div class="svc-grid">${svc}</div></div></section>

  <section class="section about" id="about" style="padding-top:28px"><div class="wrap about-grid">
    <div><h2>${COMPANY.tagline}</h2>
      <p class="body">${COMPANY.intro[0]}</p>
      <div class="pillars">
        <div class="pillar"><div class="badge c-teal">${ico('target')}</div><div><h3>Our mission</h3><p>${COMPANY.mission}</p></div></div>
        <div class="pillar"><div class="badge c-amber">${ico('eye')}</div><div><h3>Our vision</h3><p>${COMPANY.vision}</p></div></div>
        <div class="pillar"><div class="badge c-red">${ico('heart')}</div><div><h3>Our values</h3><p>${COMPANY.valuesShort}</p></div></div>
      </div>
      <a class="btn btn-navy" href="#/about">About KASH</a></div>
    <figure class="photo m-0"><img src="${imgSrc('fallback/tea-farm.webp')}" alt="A farmer picking tea leaves on a hillside tea farm in Kericho" loading="lazy">${brandBar()}</figure>
  </div></section>

  <section class="section products" id="products"><div class="wrap">
    <div class="section-head"><div><h2>Featured products</h2><p class="lede">Fresh. Safe. Quality guaranteed.</p></div>
      <a class="link-arrow" href="#/products">See all products</a></div>
    <div class="prod-grid">${prods}</div>
  </div></section>

  <section class="section customer-reviews" aria-labelledby="customerReviewsTitle"><div class="wrap">
    <div class="section-head"><div><h2 id="customerReviewsTitle">What our customers say</h2><p class="lede">Honest feedback from people who have used KASH. Every review is read by our team before it is shown.</p></div>
      <a class="btn btn-amber" href="#/reviews">Write a review</a></div>
    <div class="review-summary-slot" data-review-summary></div>
    <div class="review-grid" data-public-reviews data-limit="3" aria-live="polite">Loading customer reviews…</div>
    <p class="review-more"><a class="link-arrow" href="#/reviews">Read all reviews</a></p>
  </div></section>

  <section id="more" aria-label="More from KASH"><div class="tiles">${tiles}</div></section>

  ${deliveryAd()}

  <section class="section quote" id="quote"><div class="wrap quote-grid">
    <div id="contact"><h2>Let's build something together.</h2>
      <p class="lede">Partner with us for reliable supply, transport, logistics and hospitality. Tell us what you need and we'll reply with a quote.</p>${contactList()}</div>
    ${enquiryForm({})}
  </div></section>`;
}
