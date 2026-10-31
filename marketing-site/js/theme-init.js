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
