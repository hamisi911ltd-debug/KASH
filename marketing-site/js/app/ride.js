/* =========================================================
   KASH - js/app/ride.js
   The ride and delivery forms: finding a place on the map, keeping the
   pin honest when the text changes, and "as soon as possible / set time".
========================================================= */
'use strict';

(function(){
  const found = new WeakMap();   /* place box -> the results currently listed */
  const input = (wrap) => wrap.querySelector('input[name="' + wrap.dataset.place + '"]');

  async function findPlace(wrap, btn){
    const inp = input(wrap), q = inp.value.trim(), ul = $('[data-geo-list]', wrap);
    if (q.length < 3){ placeStatus(wrap, 'Type at least 3 letters of the place first.', false); inp.focus(); return; }
    if (btn) btn.disabled = true;
    placeStatus(wrap, 'Searching the map...', true);
    try {
      const list = await geoSearch(q);
      if (inp.value.trim() !== q) return;                     /* typed on while we searched: that answer is stale */
      found.set(wrap, list);
      ul.innerHTML = list.length
        ? list.map((r, i) => `<li><button type="button" data-geo-pick="${i}">${ico('pin')}<span>${esc(r.label)}</span></button></li>`).join('')
        : '<li class="geo-none">No match on the map. Try a nearby landmark or estate name, or send the place as you typed it.</li>';
      ul.hidden = false;
      placeStatus(wrap, list.length ? 'Choose the right place below.' : '', true);
    } catch (err){
      console.error(err);
      placeStatus(wrap, "We couldn't reach the map just now. You can still send the place as you typed it and we'll confirm it on the phone.", false);
    } finally { if (btn) btn.disabled = false; }
  }

  document.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-geo-pick]');
    if (pick){
      const wrap = pick.closest('[data-place]'), r = (found.get(wrap) || [])[+pick.dataset.geoPick];
      if (r) setPlace(wrap, {lat:r.lat, lng:r.lng, label:r.label, source:'search'});
      return;
    }
    const find = e.target.closest('[data-geo-find]');
    if (find) findPlace(find.closest('[data-place]'), find);
  });

  /* Editing the text after a pin was set would leave the old coordinates on a new place name: drop the pin instead. */
  document.addEventListener('input', (e) => {
    const wrap = e.target.closest && e.target.closest('[data-place]');
    if (!wrap || e.target.name !== wrap.dataset.place) return;
    hidePlaceList(wrap);
    if (wrap.dataset.pinned && e.target.value !== wrap.dataset.label){
      clearPlace(wrap);
      placeStatus(wrap, 'The map pin was removed because you changed the place. Tap Find on map to pin it again.', true);
    }
  });

  /* Enter in a place box searches the map instead of sending the form half-filled. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const wrap = e.target.closest && e.target.closest('[data-place]');
    if (!wrap || e.target.name !== wrap.dataset.place || wrap.dataset.pinned || e.target.value.trim().length < 3) return;
    e.preventDefault(); findPlace(wrap, $('[data-geo-find]', wrap));
  });

  document.addEventListener('change', (e) => {
    if (!e.target.matches || !e.target.matches('[data-when]')) return;
    const form = e.target.form, later = e.target.value === 'later';
    $('[data-later]', form).hidden = !later;
    [['date', 'Choose a date.'], ['time', 'Choose a time.']].forEach(([name, msg]) => {
      const inp = form.elements[name], f = inp.closest('.field');
      inp.required = later; $('.err', f).textContent = later ? msg : ''; f.classList.remove('invalid');
      if (!later) inp.value = '';
    });
  });
})();
