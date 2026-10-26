/* =========================================================
   KASH - js/app/chrome.js
   Header quote badge and the floating buttons.
========================================================= */
'use strict';

/* ---------- header badge + floating buttons ---------- */
function updateChrome(){
  const n = cartCount(), badge = $('#cartCount');
  badge.textContent = n; badge.style.display = n ? 'flex' : 'none';
  const wa = B.whatsapp ? waUrl('Hello KASH General Suppliers') : '#/contact';
  const external = B.whatsapp ? ' target="_blank" rel="noopener noreferrer"' : '';
  const contactLabel = B.whatsapp ? 'Chat with us on WhatsApp' : 'WhatsApp is not configured; view contact options';
  $('#fab').innerHTML =
    `<button class="top ${window.scrollY > 500 ? 'show' : ''}" id="toTop" type="button" aria-label="Back to top">Top</button>` +
    `<a class="wa" href="${wa}"${external} aria-label="${contactLabel}" title="${contactLabel}">${ICONS.whatsappLogo}</a>` +
    `<button class="quick-toggle" id="quickActions" type="button" aria-label="Open contact options" aria-expanded="false" title="Contact options">${ico('plus')}</button>`;
}
