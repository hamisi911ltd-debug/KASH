/* =========================================================
   KASH - js/app/slideshows.js
   Home banner slideshow and the photo slideshows on each page.
========================================================= */
'use strict';

/* ---------- hero slider (from the home page) ---------- */
function initHero(){
  const slides = $$('.slide'), imgs = $$('.hero-bg img.hs'), dashes = $$('#dashes button'), cur = $('#cur'), hero = $('.hero'), placeB = $('#placeB'), placeS = $('#placeS');
  if (!slides.length) return;
  let i = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(n){
    if (!hero.isConnected || !cur || !placeB || !placeS){ stop(); return; }
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k !== i); });
    dashes.forEach((d, k) => d.classList.toggle('on', k === i));
    imgs.forEach((im, k) => {
      if (k === i){
        im.style.transition = 'none'; im.style.setProperty('--sc', '1'); void im.offsetWidth; im.style.transition = '';
        im.classList.add('on'); im.style.setProperty('--sc', HERO_SLIDES[k].sc);
      } else im.classList.remove('on');
    });
    cur.textContent = '0' + (i + 1);
    const pl = HERO_SLIDES[i].place; placeB.textContent = pl[0]; placeS.textContent = pl[1];
  }
  function stop(){ clearInterval(heroTimer); }
  function start(){ if (reduce) return; stop(); heroTimer = setInterval(() => go(i + 1), 6500); }
  $('#next').addEventListener('click', () => { go(i + 1); start(); });
  $('#prev').addEventListener('click', () => { go(i - 1); start(); });
  dashes.forEach((d, k) => d.addEventListener('click', () => { go(k); start(); }));
  hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
  hero.addEventListener('focusin', stop); hero.addEventListener('focusout', start);
  go(0); start();
}
function initShows(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-show]').forEach((card) => {
    const imgs = $$('.sl', card), dots = $$('.dots button', card); let i = 0, t = null;
    const go = (n) => { i = (n + imgs.length) % imgs.length; imgs.forEach((im, k) => im.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
    const start = () => { if (reduce) return; clearInterval(t); t = setInterval(() => go(i + 1), 4800); showTimers.push(t); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); start(); }));
    card.addEventListener('mouseenter', () => clearInterval(t)); card.addEventListener('mouseleave', start);
    start();
  });
}
