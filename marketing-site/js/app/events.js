/* =========================================================
   KASH - js/app/events.js
   Clicks, typing and keyboard shortcuts (one listener for the whole site).
========================================================= */
'use strict';

let quickActionsTimer = null;
function setQuickActions(open){
  document.body.classList.toggle('quick-actions-open', open);
  const fab = $('#fab');
  if (fab) fab.classList.toggle('open', open);
  const button = $('#quickActions');
  if (button){
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close contact options' : 'Open contact options');
  }
  clearTimeout(quickActionsTimer);
  if (open) quickActionsTimer = setTimeout(() => setQuickActions(false), 8000);
}

/* The Order & book menu closes when you pick something or click elsewhere. */
document.addEventListener('click', (e) => {
  document.querySelectorAll('.book-menu[open]').forEach((m) => { if (!m.contains(e.target) || e.target.closest('a')) m.open = false; });
});
/* Back arrow: step back through the pages the visitor has seen; if there are none, go home. */
let inAppNavs = 0;
window.addEventListener('hashchange', () => { inAppNavs++; });
document.addEventListener('click', (e) => {
  const back = e.target.closest('#navBack');
  if (!back) return;
  e.preventDefault();
  if (inAppNavs > 0){ inAppNavs = Math.max(0, inAppNavs - 2); history.back(); } else location.hash = '#/';
});
document.addEventListener('click', (e) => {
  const quickToggle = e.target.closest('#quickActions');
  if (quickToggle){ setQuickActions(!document.body.classList.contains('quick-actions-open')); return; }
  if (document.body.classList.contains('quick-actions-open') && !e.target.closest('#fab,#assistant')) setQuickActions(false);
  const t = e.target.closest('[data-close],[data-locate],[data-check],[data-add],[data-qty],[data-remove],[data-scroll],[data-fleet],[data-pcat],[data-reset-props],[data-reset-prod],[data-city],#toTop,#overlay');
  if (!t) return;
  if (t.id === 'overlay'){ if (e.target.id === 'overlay') closeModal(); return; }
  if (t.hasAttribute('data-close')){ closeModal(); return; }
  if (t.id === 'toTop') return window.scrollTo({top:0, behavior:'smooth'});
  if (t.hasAttribute('data-locate')) return useMyLocation(t);
  if (t.dataset.check){
    const p = PROPERTIES.find((x) => x.id === t.dataset.check);
    return bookingModal(p, {checkin:$('#d_in').value, checkout:$('#d_out').value, guests:$('#d_guests').value});
  }
  if (t.dataset.add) return addToCart(t.dataset.add);
  if (t.dataset.qty) return changeQty(t.dataset.id, +t.dataset.qty);
  if (t.dataset.remove) return removeItem(t.dataset.remove);
  if (t.dataset.scroll){ const el = document.getElementById(t.dataset.scroll); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
  if (t.dataset.fleet){ fleetFilter = t.dataset.fleet; return render(true); }
  if (t.dataset.pcat !== undefined){
    productFilter = t.dataset.pcat;
    $$('#prodChips [data-pcat]').forEach((button) => {
      const selected = button.dataset.pcat === productFilter;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const grid = $('#prodGrid');
    if (grid) grid.innerHTML = prodGridHtml();
    return;
  }
  if (t.dataset.city){ propFilter.city = t.dataset.city; render(true); const g = document.getElementById('propGrid'); if (g) g.scrollIntoView({behavior:'smooth', block:'start'}); return; }
  if (t.hasAttribute('data-reset-props')){ propFilter = {city:'', beds:'', guests:'', sort:''}; return render(true); }
  if (t.hasAttribute('data-reset-prod')){ productFilter = 'All'; productSearch = ''; return render(true); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'prodSearch'){ productSearch = e.target.value; $('#prodGrid').innerHTML = prodGridHtml(); } });
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.pf; if (!k) return;
  propFilter[k] = e.target.value; $('#propCards').innerHTML = propGridHtml();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#overlay').classList.contains('open')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('quick-actions-open')) setQuickActions(false); });
