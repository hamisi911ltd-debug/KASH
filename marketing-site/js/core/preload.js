/* =========================================================
   KASH - js/core/preload.js
   Makes every photo on the website open instantly: as soon as the first
   screen has painted, the browser quietly downloads all the other photos
   (nearest pages first) so they are already there when a page opens.
   Skipped on Data Saver and very slow connections.
========================================================= */
'use strict';

function allSitePhotos(){
  const found = new Set();
  const small = window.matchMedia('(max-width:960px)').matches;
  const add = (v) => { if (typeof v === 'string' && /\.(webp|jpe?g|png)$/i.test(v) && !/^data:/.test(v)) found.add(imgSrc(v)); };
  const walk = (o, depth) => {
    if (!o || depth > 4) return;
    if (typeof o === 'string') return add(o);
    if (Array.isArray(o)) return o.forEach((x) => walk(x, depth + 1));
    if (typeof o === 'object') Object.keys(o).forEach((k) => {
      if (small && k === 'img' && o.mimg) return;          /* phones use the lighter photo */
      if (!small && k === 'mimg') return;                  /* desktops don't need it */
      walk(o[k], depth + 1);
    });
  };
  [HERO_SLIDES, PAGE_SLIDES, SERVICES, PRODUCTS, PROPERTIES, CITY_PHOTOS, VEHICLES, RIDE_SERVICES].forEach((g) => walk(g, 0));
  return Array.from(found);
}

function preloadSitePhotos(){
  const c = navigator.connection || {};
  if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;
  const queue = allSitePhotos().filter((u) => !document.querySelector('img[src="' + u + '"]'));
  let active = 0;
  const pump = () => {
    while (active < 3 && queue.length){
      const u = queue.shift(), im = new Image(); active++;
      im.decoding = 'async'; im.onload = im.onerror = () => { active--; pump(); }; im.src = u;
    }
  };
  pump();
}

/* Wait until the page has loaded and the browser is idle, so the first screen is never slowed down. */
window.addEventListener('load', () => {
  const go = () => preloadSitePhotos();
  if ('requestIdleCallback' in window) requestIdleCallback(go, {timeout:2500}); else setTimeout(go, 1200);
  /* Remembers the photos on the visitor's device for next time. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
});
/* Photos below the fold decode off the main thread. */
document.addEventListener('DOMContentLoaded', () => { new MutationObserver(() => { document.querySelectorAll('img:not([decoding])').forEach((i) => { i.decoding = 'async'; }); }).observe(document.body, {childList:true, subtree:true}); });
