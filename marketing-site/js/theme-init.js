/* =========================================================
   KASH - js/theme-init.js
   Picks day or night mode BEFORE the page paints (no flash).
   Lives in its own file so the site needs no inline JavaScript,
   which lets the security policy block injected scripts.
========================================================= */
(function () {
  var saved = null;
  try { saved = sessionStorage.getItem('kash-theme'); } catch (e) {}
  var hour = new Date().getHours();
  var night = saved ? saved === 'night' : !(hour >= 6 && hour < 18);
  document.documentElement.setAttribute('data-theme', night ? 'dark' : 'light');
  /* opened on an inner page: don't flash the home banner from index.html first */
  if (location.hash && !/^#\/?$/.test(location.hash)) document.documentElement.classList.add('deep-link');
})();

/* Opened as an installed app: show the animated launch screen once per session, for about 3 seconds. */
(function(){
  try {
    var app = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (!app || sessionStorage.getItem('kash-launched')) return;
    sessionStorage.setItem('kash-launched', '1');
    var h = document.documentElement; h.classList.add('launching');
    var done = function(){ var s = document.querySelector('.launch-splash'); if (s) s.classList.add('hide'); setTimeout(function(){ h.classList.remove('launching'); }, 450); };
    setTimeout(done, 2600);
  } catch (e) { /* no launch screen */ }
})();

/* The typeface loads without holding up the first screen. */
(function(){
  var l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(l);
})();
