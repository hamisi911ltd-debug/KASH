/* =========================================================
   KASH - js/pages/stays.js
   Hospitality & Airbnb: the list page and each home's detail page.
========================================================= */
'use strict';

let propFilter = {city:'', beds:'', guests:'', sort:''};
function propertyCard(p){
  return `<div class="cardx acc-red">${media({img:p.img, alt:p.name, icon:'bed', tag:p.type, accent:'red', pos:p.pos})}
    <div class="body"><h3>${p.name}</h3>
      <div class="meta"><span>${ico('pin')} ${p.location}</span>${p.rating ? `<span>${ico('star')} ${p.rating} (${p.reviews})</span>` : ''}</div>
      <div class="meta"><span>${ico('bed')} ${p.beds} bed${p.beds > 1 ? 's' : ''}</span><span>${ico('bath')} ${p.baths} bath${p.baths > 1 ? 's' : ''}</span><span>${ico('users')} ${p.guests} guests</span></div>
      <div class="price">KES ${money(p.price)} <small>/ night</small></div></div>
    <div class="cfoot"><a class="btn btn-outline btn-sm btn-block" href="#/property/${p.id}">View details</a></div></div>`;
}
function filteredProps(){
  let l = PROPERTIES.filter((p) => (!propFilter.city || p.city === propFilter.city) && (!propFilter.beds || p.beds >= +propFilter.beds) && (!propFilter.guests || p.guests >= +propFilter.guests));
  if (propFilter.sort === 'low') l = l.slice().sort((a, b) => a.price - b.price);
  if (propFilter.sort === 'high') l = l.slice().sort((a, b) => b.price - a.price);
  return l;
}
function propGridHtml(){
  const l = filteredProps();
  return (l.length ? l.map(propertyCard).join('') : `<div class="empty">${ico('search')}<p>No homes match those filters. Try widening your search.</p><button class="btn btn-navy btn-sm" data-reset-props style="margin-top:12px">Clear filters</button></div>`);
}
function pageProperties(){
  const cities = [''].concat(Array.from(new Set(PROPERTIES.map((p) => p.city))));
  const sel = (name, opts, val) => `<select id="pf_${name}" data-pf="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return heroPage({accent:'red', crumbs:[['Services', '#/services'], ['Hospitality & Airbnb']], title:'Comfortable stays. Prime locations.',
    lead:'Modern apartments and cozy Airbnb homes for short and long stays, with the same KASH care.',
    actions:'<button class="btn btn-amber" data-scroll="propGrid">Browse stays</button><a class="btn btn-ghost" href="#/contact">Ask a question</a>',
    card:slideCard(PAGE_SLIDES.properties)}) + `
  <section class="section pt-0"><div class="wrap">
    <div class="finder" role="search">
      <div class="field"><label for="pf_city">Where</label>${sel('city', cities.map((c) => [c, c || 'Anywhere']), propFilter.city)}</div>
      <div class="field"><label for="pf_beds">Bedrooms</label>${sel('beds', [['', 'Any'], [1, '1+'], [2, '2+'], [3, '3+']], propFilter.beds)}</div>
      <div class="field"><label for="pf_guests">Guests</label>${sel('guests', [['', 'Any'], [2, '2+'], [4, '4+'], [6, '6+']], propFilter.guests)}</div>
      <div class="field"><label for="pf_sort">Sort by</label>${sel('sort', [['', 'Recommended'], ['low', 'Price: low to high'], ['high', 'Price: high to low']], propFilter.sort)}</div>
      <button class="btn btn-navy" data-scroll="propGrid" type="button">${ico('search')} Show homes</button>
    </div>
    <div id="propGrid" style="margin-top:40px">${secHead('Featured stays', 'Handpicked homes and apartments for your comfort.', 'Stay with KASH')}
      <div class="grid g4" id="propCards">${propGridHtml()}</div></div>
  </div></section>
  <section class="section pt-0"><div class="wrap">${secHead('Where we stay', 'Pick a city to see the homes there.', 'Locations')}
    <div class="grid g2">${CITY_PHOTOS.map((c) => `<button class="loc" data-city="${c.city}" aria-label="Show stays in ${c.city}"><img src="${imgSrc(c.img)}" alt="" loading="lazy"><span class="loc-cap"><b>${c.city}</b><span>${c.line}</span></span></button>`).join('')}</div></div></section>
  <section class="section alt"><div class="wrap">${secHead('Stay your way', '', 'Short or long')}${featTiles(STAY_TYPES, 'g3')}</div></section>
  <section class="section"><div class="wrap">${secHead('How booking works', 'Four simple steps to your stay.', 'Simple process')}${steps(STAY_STEPS)}</div></section>
  <section class="section alt"><div class="wrap split"><div>${secHead('House rules at a glance', '', 'Good to know')}${checks(HOUSE_RULES)}</div>
    <div><h2 class="sm mb-16">Stay questions</h2>${faq(FAQS.stays)}</div></div></section>
  <section class="section"><div class="wrap">${ctaBand('Looking for something specific?', 'Tell us your dates and group size and we will suggest the best fit.', 'Get a quote', '#/quote/Hospitality%20%26%20Airbnb')}</div></section>`;
}
function propertyCard2(p){
  if (p.gallery && p.gallery.length > 1) return slideCard(p.gallery.map((g, i) => ({img:g, alt:p.name + ' photo ' + (i + 1), pos:i === 0 ? p.pos : '50% 58%'})));
  return p.img ? photoCard(p.img, p.name, false, p.pos) : glyphCard('bed');
}
function propertyMap(p){
  if (typeof p.lat !== 'number') return '';
  const pad = 0.014, to = {lat:p.lat, lng:p.lng};
  return `<h2 class="sm" id="propMap" style="margin-top:28px;scroll-margin-top:90px">Location</h2>
    <p class="muted" style="margin:6px 0 14px">${esc(p.location)}${p.approx ? ' · Approximate area. We share the exact address once your stay is confirmed.' : ''}</p>
    ${mapBox(osmEmbed(p.lng - pad, p.lat - pad, p.lng + pad, p.lat + pad, p.lat, p.lng), p.location)}
    <div class="map-actions"><a class="btn btn-outline btn-sm" href="${gmapPin(p.lat, p.lng)}" target="_blank" rel="noopener">${ico('pin')} Open in Google Maps</a>
      <a class="btn btn-outline btn-sm" href="${gmapDir(null, to)}" target="_blank" rel="noopener">Get directions</a></div>`;
}
function pageProperty(id){
  const p = PROPERTIES.find((x) => x.id === id) || PROPERTIES[0];
  const more = PROPERTIES.filter((x) => x.id !== p.id).slice(0, 3);
  return heroPage({accent:'red', crumbs:[['Hospitality & Airbnb', '#/properties'], [esc(p.name)]], title:p.name,
    lead:`${p.location} · ${p.beds} bed${p.beds > 1 ? 's' : ''} · ${p.baths} bath${p.baths > 1 ? 's' : ''} · up to ${p.guests} guests`,
    card:propertyCard2(p)}) + `
  <section class="section pt-20"><div class="wrap detail">
    <div>
      <div class="eyebrow acc-red">${p.type}${p.rating ? ` · ${ico('star')} ${p.rating} (${p.reviews} reviews)` : ''}</div>
      <h2 class="sm">About this stay</h2><p class="muted mt-8">${p.desc}</p>
      ${p.gallery && p.gallery.length ? `<h2 class="sm mt-28">Photos</h2><div class="photos">${p.gallery.map((g, i) => `<img src="${imgSrc(g)}" alt="${esc(p.name)} photo ${i + 1}" loading="lazy">`).join('')}</div>` : ''}
      <h2 class="sm mt-28">Amenities</h2>
      <div class="amen">${p.amenities.map((a) => `<div>${ico(a)} ${AMENITY_LABELS[a]}</div>`).join('')}</div>
      ${propertyMap(p)}
      <h2 class="sm mt-28">House rules</h2><div class="mt-14">${checks(HOUSE_RULES)}</div>
    </div>
    <aside class="panel sticky"><div class="price" style="font-size:1.5rem">KES ${money(p.price)} <small>/ night</small></div>
      <div class="form" style="background:transparent;border:0;padding:0;margin-top:16px">
        <div class="row">${field({label:'Check in', name:'checkin', type:'date', attrs:'min="' + todayISO() + '"', id:'d_in'})}${field({label:'Check out', name:'checkout', type:'date', attrs:'min="' + todayISO() + '"', id:'d_out'})}</div>
        ${field({label:'Guests', name:'guests', type:'number', value:'1', attrs:'min="1" max="' + p.guests + '"', id:'d_guests'})}
        <button class="btn btn-amber btn-block" data-check="${p.id}">Check availability</button>
        ${B.whatsapp ? `<a class="btn btn-wa btn-block" href="${waUrl('Hi, I am interested in ' + p.name)}" target="_blank" rel="noopener">${ico('whatsapp')} Ask on WhatsApp</a>` : ''}
      </div>
      <div class="note-box mt-16">${ico('shield')}<span>No payment now. We confirm availability and the total price first.</span></div></aside>
  </div></section>
  <section class="section alt"><div class="wrap">${secHead('You might also like', '', 'More stays')}<div class="grid g3">${more.map(propertyCard).join('')}</div></div></section>`;
}
