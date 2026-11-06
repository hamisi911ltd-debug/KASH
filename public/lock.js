/* =========================================================
   Full-page picture cover. TEMPORARY, set up on the owner's request.
   It covers the whole page and cannot be closed by visitors.
   To take it down: delete this file and every <script> line that loads it, then redeploy.
========================================================= */
(function () {
  'use strict';
  var SRC = '/spotlight.jpg';
  var CSS = '.kash-lock{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#2bb3d0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;cursor:default}' +
    '.kash-lock .bg{position:absolute;top:-6%;right:-6%;bottom:-6%;left:-6%;background:center/cover no-repeat url(' + SRC + ');filter:blur(28px) saturate(1.1);transform:scale(1.1)}' +
    '.kash-lock img{position:relative;display:block;max-width:100%;max-height:100%;width:auto;height:100%;object-fit:contain;pointer-events:none;-webkit-user-drag:none}';
  var root = document.documentElement;
  var shield, style;

  /* Only write when something differs, so this never triggers itself. */
  function lockPage() {
    if (root.style.getPropertyValue('overflow') !== 'hidden') root.style.setProperty('overflow', 'hidden', 'important');
    var body = document.body;
    if (body) {
      if (!body.inert) body.inert = true;
      if (body.getAttribute('aria-hidden') !== 'true') body.setAttribute('aria-hidden', 'true');
      if (body.style.getPropertyValue('overflow') !== 'hidden') body.style.setProperty('overflow', 'hidden', 'important');
    }
  }
  function build() {
    style = document.createElement('style'); style.id = 'kash-lock-css'; style.textContent = CSS;
    shield = document.createElement('div'); shield.className = 'kash-lock'; shield.setAttribute('role', 'dialog'); shield.setAttribute('aria-modal', 'true'); shield.setAttribute('aria-label', 'Featured picture');
    shield.innerHTML = '<div class="bg"></div><img src="' + SRC + '" alt="Moana and Maui">';
    root.appendChild(style); root.appendChild(shield);
    lockPage();
  }
  function ensure() {
    if (!style || !style.isConnected) root.appendChild(style);
    if (!shield || !shield.isConnected) root.appendChild(shield);
    if (shield.getAttribute('style')) shield.removeAttribute('style');
    if (shield.hidden) shield.hidden = false;
    lockPage();
  }
  build();

  /* If anything removes or changes the cover, put it straight back. */
  new MutationObserver(ensure).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'inert', 'aria-hidden'] });
  document.addEventListener('DOMContentLoaded', ensure);
  window.addEventListener('load', ensure);
  setInterval(ensure, 1500);

  /* Nothing underneath can be used: swallow clicks, keys, scrolling and the context menu. */
  ['keydown', 'keyup', 'keypress', 'contextmenu', 'wheel', 'touchmove', 'dragstart', 'selectstart'].forEach(function (t) {
    window.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); }, { capture: true, passive: false });
  });
  ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'submit'].forEach(function (t) {
    window.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  });
})();
