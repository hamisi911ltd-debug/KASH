/* =========================================================
   KASH - js/pages/transport.js
   Transport & logistics page and the Fleet page.
========================================================= */
'use strict';

function vehicleCard(v){
  const accent = v.group === 'freight' ? 'blue' : 'amber';
  return `<div class="cardx acc-${accent}">${media({img:v.img, alt:v.name, icon:VEHICLE_ICON[v.category], tag:v.sub, state:v.available ? 'Available' : 'In use', stateOn:v.available, accent, pos:v.pos})}
    <div class="body"><h3>${v.name}</h3>
      <div class="meta"><span>${ico('users')} ${v.capacity}</span></div>
      <p>Best for: ${v.best}</p></div>
    <div class="cfoot">${v.available ? `<a class="btn btn-outline btn-sm btn-block" href="#/quote/${v.mode}">Request this vehicle</a>` : '<button class="btn btn-outline btn-sm btn-block" disabled>Currently unavailable</button>'}</div></div>`;
}
function pageTransport(){
  const freight = VEHICLES.filter((v) => v.group === 'freight');
  return heroPage({accent:'blue', crumbs:[['Services', '#/services'], ['Transport & logistics']], title:'Your cargo, on time, every time.',
    lead:'A branded, well-maintained fleet moving goods across Kenya, from daily deliveries to long-haul freight.',
    actions:'<a class="btn btn-amber" href="#/quote/truck">Request transport</a><a class="btn btn-ghost" href="#/transport/rates">See the rate card</a><a class="btn btn-ghost" href="#/fleet">See our fleet</a>',
    card:slideCard(PAGE_SLIDES.transport)}) + `
  <section class="section pt-20"><div class="wrap">${secHead('What we move', 'Safe handling and honest timelines, whatever the load.', 'Transport & logistics')}${featTiles(FREIGHT_SERVICES, 'g3')}</div></section>
  ${rateSection()}
  <section class="section"><div class="wrap">
    ${secHead('Our truck', 'Tell us the load and we will confirm it fits.', 'Our fleet', '<a class="link-arrow" href="#/fleet">Full fleet</a>')}
    <div class="grid g3">${freight.map(vehicleCard).join('')}</div></div></section>
  <section class="section alt"><div class="wrap">${secHead('Who we move for', '', 'Built for you')}${featTiles(FREIGHT_WHO)}</div></section>
  <section class="section"><div class="wrap">${secHead('How it works', 'From request to delivery in four steps.', 'Simple process')}${steps(FREIGHT_STEPS)}</div></section>
  <section class="section alt"><div class="wrap split">
    <div>${secHead('Reliable from pickup to drop-off', '', 'Why choose us')}${checks(FREIGHT_WHY)}</div>
    <div><h2 class="sm mb-16">Transport questions</h2>${faq(FAQS.transport)}</div></div></section>
  ${deliveryAd()}
  <section class="section"><div class="wrap">${ctaBand('Need a custom transport solution?', 'Contract runs, special loads or multi-stop routes. Tell us what you need.', 'Get a quote', '#/quote/Transport%20%26%20Logistics')}</div></section>`;
}

let fleetFilter = 'All';
function pageFleet(){
  const list = VEHICLES.filter((v) => fleetFilter === 'All' || v.category === fleetFilter);
  return heroPage({accent:'blue', crumbs:[['Services', '#/services'], ['Our fleet']], title:'A fleet you can rely on.',
    lead:'Our truck for cargo, Uber-style cabs and tuk-tuks for getting around. Availability changes daily, so request and we will confirm.',
    actions:'<a class="btn btn-amber" href="#/quote/truck">Request transport</a><a class="btn btn-ghost" href="#/mobility">Ride services</a>',
    card:slideCard(PAGE_SLIDES.fleet)}) + `
  <section class="section pt-20"><div class="wrap">
    <div class="chips" id="fleetChips" role="group" aria-label="Filter vehicles" style="margin-bottom:26px">${FLEET_FILTERS.map((c) => `<button data-fleet="${c}" class="${c === fleetFilter ? 'on' : ''}">${c}</button>`).join('')}</div>
    <p class="count-note">${list.length} vehicle${list.length === 1 ? '' : 's'}</p>
    <div class="grid g3">${list.length ? list.map(vehicleCard).join('') : `<div class="empty">${ico('search')}<p>No vehicles in this group yet.</p></div>`}</div>
    <div class="note-box mt-28">${ico('info')}<span>Need something that is not listed? <a href="#/contact" style="font-weight:700">Contact us</a> and we will arrange it.</span></div>
  </div></section>`;
}
