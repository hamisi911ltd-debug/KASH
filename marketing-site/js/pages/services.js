/* =========================================================
   KASH - js/pages/services.js
   Services overview page.
========================================================= */
'use strict';

function pageServices(){
  const svc = SERVICES.map((s) => `<article class="svc"><img src="${imgSrc(s.img)}" alt="" loading="lazy">
    <div class="svc-body"><div class="badge ${COLOR[s.color]}">${ico(s.icon)}</div><h3>${s.title}</h3><p>${s.short}</p>
    <a href="#/${s.route}">Explore</a></div><div class="bar ${COLOR[s.color]}"></div></article>`).join('');
  return heroPage({accent:'blue', crumbs:[['Services']], title:'Everything you need, from one trusted team.', lead:'Food, freight, rides and stays. Pick a service to see how we can help.',
      actions:'<a class="btn btn-amber" href="#/quote">Get a quote</a>'}) + `
  <section class="section services pt-20"><div class="wrap"><div class="svc-grid">${svc}</div></div></section>
  <section class="section alt"><div class="wrap">${secHead('Why customers choose KASH', 'Simple, honest and dependable.', 'Why KASH')}${featTiles(WHY_KASH)}</div></section>
  <section class="section"><div class="wrap">${trust()}<div class="mt-34">${ctaBand('Not sure where to start?', 'Tell us what you need and we will point you to the right service.', 'Talk to us', '#/contact')}</div></div></section>`;
}
