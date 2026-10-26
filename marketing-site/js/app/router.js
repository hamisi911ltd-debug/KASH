/* =========================================================
   KASH - js/app/router.js
   Reads the address (#/page), draws the right page, updates the menu.
========================================================= */
'use strict';

function route(){
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  let param = parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : '';
  return {name:parts[0] || 'home', param};
}
const ROUTES = {
  home:() => pageHome(), services:() => pageServices(), transport:() => pageTransport(), fleet:() => pageFleet(), mobility:() => pageMobility(),
  properties:() => pageProperties(), property:(p) => pageProperty(p), agro:() => pageAgro(),
  products:(p) => { if (p && (p === 'All' || PRODUCT_CATEGORIES.some((c) => c.key === p))) productFilter = p; return pageProducts(); },
  quote:(p) => pageQuote(p), about:() => pageAbout(), contact:() => pageContact(), faq:() => pageFaq(), account:(p) => pageAccount(p), staff:() => pageStaff(),
  privacy:() => pagePrivacy(), terms:() => pageTerms(), cookies:() => pageCookies()
};
const TITLES = {home:'KASH General Suppliers | Your Needs, Our Priority', services:'Services', transport:'Transport & Logistics', fleet:'Our Fleet', mobility:'Mobility & Ride Services',
  properties:'Hospitality & Airbnb', property:'Stay details', agro:'Agro & Food', products:'Products', quote:'Get a quote', about:'About us', contact:'Contact', faq:'FAQs',
  privacy:'Privacy Policy', terms:'Terms & Conditions', cookies:'Cookies & storage', account:'Your KASH account', staff:'Staff requests'};
const SERVICE_PAGES = ['services', 'transport', 'fleet', 'mobility', 'properties', 'property', 'agro'];

let heroTimer = null, showTimers = [], lastName = '';
function render(keep){
  const r = route();
  setQuickActions(false);
  clearInterval(heroTimer); showTimers.forEach(clearInterval); showTimers = [];
  if (!keep && $('#overlay').classList.contains('open')) closeModal();
  $('#app').innerHTML = (ROUTES[r.name] || pageMissing)(r.param);
  const footerSocial = $('#footerSocial');
  footerSocial.innerHTML = socialAnchors(socialLinks());
  footerSocial.hidden = false;
  document.title = r.name === 'home' ? TITLES.home : (TITLES[r.name] || 'Page not found') + ' | KASH General Suppliers';
  $$('.menu a[data-nav]').forEach((a) => {
    const k = a.dataset.nav;
    a.classList.toggle('active', k === r.name || (k === 'services' && SERVICE_PAGES.indexOf(r.name) > -1));
  });
  $('#menu').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
  const stay = keep || (r.name === 'quote' && lastName === 'quote');
  if (!stay) window.scrollTo(0, 0);
  if (r.name === 'home') initHero();
  initShows(); prefillLocation();
  if (r.name === 'account' && r.param === 'dashboard') loadAccountDashboard();
  if (r.name === 'account' && r.param === 'reviews') loadAccountReviews();
  if (r.name === 'home') loadPublicReviews();
  if (r.name === 'staff') loadStaffRequests();
  if (r.name === 'quote' && r.param && !keep){ const mp = $('#modePanel'); if (mp) setTimeout(() => mp.scrollIntoView({behavior:'smooth', block:'start'}), 80); }
  lastName = r.name;
  updateChrome();
}
window.addEventListener('hashchange', () => render());
