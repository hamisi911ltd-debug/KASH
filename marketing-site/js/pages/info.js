/* =========================================================
   KASH - js/pages/info.js
   About, Contact, FAQs and the "not found" page.
========================================================= */
'use strict';

function pageAbout(){
  const svc = SERVICES.map((s) => `<a class="feat" href="#/${s.route}"><div class="badge ${COLOR[s.color]}">${ico(s.icon)}</div><h3>${s.title}</h3><p>${s.short}</p><span class="go">Explore</span></a>`).join('');
  return heroPage({accent:'teal', crumbs:[['About us']], title:'More than just suppliers.',
    lead:'KASH General Suppliers connects people, businesses and communities through food, transport, logistics and hospitality.',
    actions:'<a class="btn btn-amber" href="#/contact">Talk to our team</a>', card:slideCard(PAGE_SLIDES.about)}) + `
  <section class="section about pt-20"><div class="wrap about-grid">
    <div><h2>Who we are.</h2><p class="body">KASH General Suppliers is a diversified business committed to delivering quality products and reliable services across Kenya. We exist to make everyday business and everyday life easier, by being the partner who shows up, delivers what was promised and keeps you informed.</p>
      <div class="pillars">
        <div class="pillar"><div class="badge c-teal">${ico('target')}</div><div><h3>Our mission</h3><p>To provide reliable, high-quality products and services that improve lives and businesses.</p></div></div>
        <div class="pillar"><div class="badge c-amber">${ico('eye')}</div><div><h3>Our vision</h3><p>To be a leading and trusted multi-services brand in East Africa.</p></div></div>
        <div class="pillar"><div class="badge c-red">${ico('heart')}</div><div><h3>Our values</h3><p>Quality, integrity, reliability, customer focus and teamwork.</p></div></div>
      </div></div>
    <figure class="photo m-0"><img src="images/tea-farm.jpg" alt="A farmer picking tea leaves in Kericho" loading="lazy">${brandBar()}</figure>
  </div></section>
  <section class="section alt"><div class="wrap">${secHead('What we do', 'Four services, one standard.', 'Our services')}<div class="grid g4">${svc}</div></div></section>
  <section class="section"><div class="wrap">${secHead('How we work', 'The promises behind every job.', 'Our values')}
    <div class="grid g2">
      <div class="feat"><div class="badge c-blue">${ico('clock')}</div><h3>Reliability first</h3><p>We say when, we show up when, and we tell you early if anything changes.</p></div>
      <div class="feat"><div class="badge c-teal">${ico('check')}</div><h3>Honest pricing</h3><p>You know the price before work begins. No surprises afterwards.</p></div>
      <div class="feat"><div class="badge c-amber">${ico('shield')}</div><h3>Quality in the details</h3><p>Clean vehicles, well-kept homes and fresh, labelled meat and eggs, checked before they reach you.</p></div>
      <div class="feat"><div class="badge c-red">${ico('heart')}</div><h3>Long-term relationships</h3><p>We would rather earn your repeat business than win a single job.</p></div>
    </div><div class="mt-34">${trust()}</div></div></section>
  <section class="section pt-0"><div class="wrap">${ctaBand('Work with us', 'Tell us what you need and we will come back with a clear plan.', 'Get in touch', '#/contact')}</div></section>`;
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
