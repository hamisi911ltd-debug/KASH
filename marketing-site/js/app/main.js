/* =========================================================
   KASH - js/app/main.js
   Start-up: theme, menu, scroll, first page. Loaded last.
========================================================= */
'use strict';

(function init(){
  $('#yr').textContent = new Date().getFullYear();

  /* Show platform links now; replace them with official KASH profile URLs in js/config.js when ready. */
  const social = socialLinks(), socialBox = $('#footerSocial');
  socialBox.innerHTML = socialAnchors(social);
  socialBox.hidden = false;

  const root = document.documentElement, themeBtn = $('#themeBtn');
  const isNight = () => root.getAttribute('data-theme') === 'dark';
  const applyTheme = (n) => { root.setAttribute('data-theme', n ? 'dark' : 'light'); themeBtn.setAttribute('aria-label', n ? 'Switch to day mode' : 'Switch to night mode'); };
  applyTheme(isNight());
  themeBtn.addEventListener('click', () => { const n = !isNight(); applyTheme(n); try { sessionStorage.setItem('kash-theme', n ? 'night' : 'day'); } catch (e) {} });
  setInterval(() => { let s = null; try { s = sessionStorage.getItem('kash-theme'); } catch (e) {} if (!s){ const h = new Date().getHours(); applyTheme(!(h >= 6 && h < 18)); } }, 60000);

  const burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')){ menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  const hdr = $('.site-header');
  const onScroll = () => { hdr.classList.toggle('scrolled', window.scrollY > 40); const t = $('#toTop'); if (t) t.classList.toggle('show', window.scrollY > 500); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  render();
  Assistant.init();
  loadErpListings().then((changed) => { if (changed && route().name !== 'home') render(true); }); /* the home page shows no ERP listings, so don't restart its banner */
})();
