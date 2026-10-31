/* =========================================================
   KASH - js/pages/info.js
   About, Contact, FAQs and the "not found" page.
========================================================= */
'use strict';

function pageAbout(){
  const paras = (list) => list.map((t) => `<p class="body">${t}</p>`).join('');
  return heroPage({accent:'teal', crumbs:[['About us']], title:COMPANY.tagline, lead:COMPANY.partner,
    actions:'<a class="btn btn-amber" href="#/contact">Talk to our team</a>', card:slideCard(PAGE_SLIDES.about)}) + `
  <section class="section about pt-20"><div class="wrap about-grid">
    <div><h2>Who we are.</h2>${paras(COMPANY.intro)}</div>
    <div><figure class="photo m-0"><img src="${imgSrc('tea-farm.jpg')}" alt="A farmer picking tea leaves in Kericho" loading="lazy">${brandBar()}</figure>
      <div class="pillars">
        <div class="pillar"><div class="badge c-amber">${ico('eye')}</div><div><h3>Our vision</h3><p>${COMPANY.vision}</p></div></div>
        <div class="pillar"><div class="badge c-teal">${ico('target')}</div><div><h3>Our mission</h3><p>${COMPANY.mission}</p></div></div>
      </div></div>
  </div></section>
  <section class="section alt"><div class="wrap">${secHead('Our core values', 'What guides every engagement.', 'What we stand for')}${featTiles(COMPANY.values, 'g3')}</div></section>
  <section class="section"><div class="wrap">${secHead('Our main business areas', 'KASH General Suppliers operates in three principal business sectors.', 'What we do')}${sectorCards()}
    <p class="lede mt-28">Rides, cabs and tuk-tuks are part of our transport services. <a href="#/mobility">See mobility and rides</a>.</p></div></section>
  <section class="section alt about"><div class="wrap about-grid">
    <div><div class="eyebrow">Where we work</div><h2>Our geographical coverage.</h2>${paras(COMPANY.coverage)}</div>
    <div class="panel"><div class="eyebrow">Who we work with</div><h2 class="sm mb-16">Our clientele.</h2><p class="body mb-16">KASH General Suppliers seeks to serve a diverse range of clients, including:</p>${checks(COMPANY.clients)}<p class="body mt-22">${COMPANY.clientsNote}</p></div>
  </div></section>
  <section class="section"><div class="wrap">${secHead('Why choose KASH General Suppliers?', 'One company, three sectors, nationwide.', 'Why KASH')}${featTiles(COMPANY.why, 'g3')}</div></section>
  <section class="section alt about"><div class="wrap"><div class="eyebrow">Our commitment</div><h2>Trust, quality and accountability.</h2>${paras(COMPANY.commitment)}</div></section>
  <section class="section"><div class="wrap">${ctaBand('Your reliable partner', COMPANY.promise, 'Get in touch', '#/contact')}</div></section>`;
}
function pageContact(){
  return heroPage({accent:'blue', crumbs:[['Contact']], title:"We'd love to hear from you.", lead:'Questions, quotes or partnerships. Send us a message and we will reply as soon as we can.'}) + `
  <section class="section quote" style="background:transparent;border:0;padding-top:20px"><div class="wrap quote-grid">
    <div><h2 class="sm">Contact details</h2>${contactList()}
      <div class="panel mt-28"><h3 style="font-weight:800">Know what you need?</h3><div class="pill-links">
        <a href="#/quote">Request a quote</a><a href="#/fleet">Book a vehicle</a><a href="#/properties">Find a stay</a><a href="#/products">Browse products</a><a href="#/faq">Read FAQs</a></div></div>${socialPanel()}</div>
    ${enquiryForm({service:'Something else'})}
  </div></section>
  <section class="section alt"><div class="wrap">${secHead('Find us', B.location, 'Our location')}${findUsMap()}</div></section>`;
}
/* the map of where KASH is based (set the exact spot in config.js: business.base and business.mapUrl) */
function findUsMap(){
  const b = BASE(), pad = 0.011;
  return `<div class="map-wide">${mapBox(osmEmbed(b.lng - pad * 1.5, b.lat - pad, b.lng + pad * 1.5, b.lat + pad, b.lat, b.lng), B.location)}</div>
    <div class="map-actions"><a class="btn btn-amber" href="${locationUrl()}" target="_blank" rel="noopener noreferrer">${ico('pin')} Open in Google Maps</a>
      <a class="btn btn-outline" href="${gmapDir(null, b)}" target="_blank" rel="noopener noreferrer">Get directions</a></div>`;
}
function pageFaq(){
  const g = (t, l) => `<h2 class="sm" style="margin:34px 0 14px">${t}</h2>${faq(l)}`;
  return heroPage({accent:'blue', crumbs:[['FAQs']], title:'Frequently asked questions.', lead:'Quick answers to the things people ask us most.'}) + `
  <section class="section pt-0"><div class="wrap">${g('General', FAQS.general)}${g('Agro & food', FAQS.agro)}${g('Transport & logistics', FAQS.transport)}${g('Mobility & rides', FAQS.mobility)}${g('Hospitality & Airbnb', FAQS.stays)}
    <div class="mt-40">${ctaBand('Still have a question?', 'Send us a message and we will be glad to help.', 'Contact us', '#/contact')}</div></div></section>`;
}
function pageMissing(){
  return heroPage({accent:'red', title:'Page not found.', lead:"That page doesn't exist, but we can get you back on track.", actions:'<a class="btn btn-amber" href="#/">Back to home</a>'});
}
