/* =========================================================
   KASH - js/pages/mobility.js
   Mobility & ride services page.
========================================================= */
'use strict';

function mobilityHero(){
  const destinations = PAGE_SLIDES.mobility;
  const photos = destinations.map((photo, index) => `<img class="sl ${index === 0 ? 'on' : ''}" src="${imgSrc(photo.img)}" alt="${esc(photo.alt)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('');
  const dots = destinations.map((photo, index) => `<button type="button" class="${index === 0 ? 'on' : ''}" aria-label="Show ${esc(photo.place)} destination photo"></button>`).join('');
  return `<section class="mobility-hero" aria-label="KASH destinations">
    <div class="mobility-destination-slides" data-show aria-roledescription="carousel" aria-label="Destinations KASH can help you explore">
      ${photos}<div class="dots mobility-destination-dots">${dots}</div>
    </div>
    <div class="mobility-hero-shade"></div>
    <div class="mobility-hero-content">
      <a class="page-back" href="#/services"><span>Back to Services</span></a>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><a href="#/services">Services</a><span>Mobility & ride services</span></nav>
      <span class="mobility-hero-kicker">EXPLORE KENYA WITH KASH</span>
      <h1>Getting around, made simple.</h1>
      <p class="lead">Choose a cab or tuk-tuk for your next trip. Tell us where you’re going, and KASH will help arrange your ride.</p>
      <div class="hero-actions"><a class="btn btn-amber" href="#/quote/uber">Request a ride</a><a class="btn btn-ghost" href="#/fleet">See all vehicles</a></div>
    </div>
    ${HERO_RIBBON}
  </section>`;
}

function pageMobility(){
  const rides = VEHICLES.filter((v) => v.group === 'ride');
  return mobilityHero() + `
  <section class="section pt-20"><div class="wrap">${secHead('Ride options', 'Pick what suits your trip.', 'Mobility')}
    <div class="grid g2">${RIDE_SERVICES.map((ride) => `<a class="feat ride-option" href="${ride.href}" aria-label="${ride.title}: ${ride.action}">
      <div class="badge ${COLOR[ride.color || 'amber'] || 'amber'}">${ico(ride.icon)}</div><h3>${ride.title}</h3><p>${ride.desc}</p><span class="ride-option-action">${ride.action}</span>
    </a>`).join('')}</div></div></section>
  <section class="section alt"><div class="wrap">${secHead('Our ride fleet', '', 'Vehicles', '<a class="link-arrow" href="#/fleet">Full fleet</a>')}
    <div class="grid g2">${rides.map(vehicleCard).join('')}</div></div></section>
  <section class="section"><div class="wrap">${secHead('Rides for every occasion', '', 'Use cases')}${featTiles(RIDE_WHO)}</div></section>
  <section class="section alt"><div class="wrap">${secHead('How it works', '', 'Simple process')}${steps(RIDE_STEPS)}</div></section>
  ${deliveryAd()}
  <section class="section"><div class="wrap split"><div><h2 class="sm mb-16">Ride questions</h2>${faq(FAQS.mobility)}</div>
    <div class="panel"><h3 style="font-size:1.2rem;font-weight:800">Need a ride today?</h3><p class="muted" style="margin:8px 0 18px">Tell us where from and to, and we will confirm a driver and price.</p>
      <a class="btn btn-amber btn-block" href="#/quote/uber">Request a ride</a></div></div></section>`;
}
