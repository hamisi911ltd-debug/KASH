/* =========================================================
   KASH - js/pages/rates.js
   The container trucking rate card: the table on the Transport page, the
   route picker on the truck request form, and the assistant's lookup.
========================================================= */
'use strict';

const rateState = {q:'', vat:false};

function rateRowsShown(){
  const q = rateState.q.trim().toLowerCase();
  return RATE_CARD.rates.filter((r) => !q || r.to.toLowerCase().includes(q));
}
function rateCountText(){
  const n = rateRowsShown().length, all = RATE_CARD.rates.length;
  return n === all ? all + ' destinations' : n + ' of ' + all + ' destinations';
}
function rateTableHtml(){
  const rows = rateRowsShown();
  if (!rows.length) return `<div class="empty">${ico('search')}<p>No destination matches “${esc(rateState.q)}”. Not on the card? <a href="#/quote/truck" style="color:var(--link);font-weight:700">Request a truck</a> and we will quote it.</p></div>`;
  const vat = rateState.vat;
  const table = (list) => `<table class="rate-table"><thead><tr><th scope="col">No.</th><th scope="col">Destination</th><th scope="col" class="num">${vat ? 'With VAT (KES)' : 'Rate (KES)'}</th><th scope="col"><span class="sr">Request</span></th></tr></thead>
    <tbody>${list.map((r) => `<tr><td>${RATE_CARD.rates.indexOf(r) + 1}</td><th scope="row">${esc(r.to)}</th><td class="num">${money(vat ? rateWithVat(r.kes) : r.kes)}</td>
      <td><a class="rate-go" href="#/quote/truck/${encodeURIComponent(r.to)}" aria-label="Request a truck to ${esc(r.to)}">Request</a></td></tr>`).join('')}</tbody></table>`;
  const half = Math.ceil(rows.length / 2);
  return `<div class="rate-grid">${(rows.length > 8 ? [rows.slice(0, half), rows.slice(half)] : [rows]).map(table).join('')}</div>`;
}
function rateSection(){
  const on = (v) => (rateState.vat === v ? 'on' : '');
  return `<section class="section alt" id="rates" style="scroll-margin-top:90px"><div class="wrap">
    ${secHead('Container trucking rate card', 'From the Nairobi ICD / CFS depots. ' + RATE_CARD.tariff + '.', 'Transport rates')}
    <div class="rate-tools">
      <div class="field"><label for="rateSearch">Find a destination</label><input id="rateSearch" type="search" placeholder="e.g. Westlands" value="${esc(rateState.q)}" autocomplete="off"></div>
      <div class="chips" role="group" aria-label="Show rates before or with VAT"><button type="button" data-rate-vat="0" class="${on(false)}" aria-pressed="${!rateState.vat}">Before VAT</button><button type="button" data-rate-vat="1" class="${on(true)}" aria-pressed="${rateState.vat}">With ${RATE_CARD.vat}% VAT</button></div>
    </div>
    <p class="count-note" id="rateCount">${rateCountText()}</p>
    <div id="rateTable">${rateTableHtml()}</div>
    <div class="panel mt-28"><h3 style="font-weight:800;margin-bottom:12px">Good to know</h3>${checks(RATE_CARD.notes.map(esc))}
      <p class="muted" style="margin-top:14px;font-size:.88rem">Rates are for trips from ${esc(RATE_CARD.origin)}. They are a guide: we confirm the final price in your quote.</p></div>
    <div class="mt-28">${ctaBand("Don't see your destination?", 'Tell us where the container is going and we will quote it.', 'Request a truck', '#/quote/truck')}</div>
  </div></section>`;
}

/* ---------- the route picker on the truck request form ---------- */
function rateQuoteHtml(id){
  const r = rateFind(id);
  if (!r) return '';
  return `<b>${esc(r.to)}</b><div class="rq-row"><span>Rate</span><b>KES ${money(r.kes)}</b></div><div class="rq-row"><span>VAT ${RATE_CARD.vat}%</span><b>KES ${money(rateVat(r.kes))}</b></div>
    <div class="rq-row total"><span>Total with VAT</span><b>KES ${money(rateWithVat(r.kes))}</b></div>
    <p class="muted small">A guide from our rate card. We confirm the final price in your quote. Parking, delays and excess weight can be charged extra.</p>`;
}
function ratePickerOptions(sel){
  return '<option value="">Not on the card / other</option>' + RATE_CARD.rates.map((r) => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.to)} - KES ${money(r.kes)}</option>`).join('');
}
function ratePicker(sel){
  return `<div class="field"><label for="t_rate">Route on our rate card (optional)</label><select id="t_rate" name="rateId" data-rate-pick>${ratePickerOptions(sel)}</select>
    <span class="hint">Container trucking from the Nairobi ICD / CFS depots. Rates are before ${RATE_CARD.vat}% VAT.</span></div>
    <div class="rate-quote" id="rateQuote" ${sel ? '' : 'hidden'} aria-live="polite">${rateQuoteHtml(sel)}</div>`;
}
/* The rates arrived from the ERP after the page was drawn: refresh the picker in place so a half-filled form isn't wiped. */
function refreshRatePicker(){
  const sel = $('#t_rate'); if (!sel) return;
  const keep = sel.value; sel.innerHTML = ratePickerOptions(keep);
  if (sel.value !== keep){ sel.value = ''; const q = $('#rateQuote'); if (q) q.hidden = true; }
}

/* ---------- the assistant: "how much to Westlands?" ---------- */
const RATE_WORDS = /\b(rate|rates|price|prices|cost|costs|how much|charge|charges|tariff|container|truck|lorry|cargo)\b/i;
const RATE_SKIP = new Set(['area', 'road', 'along', 'from', 'exports', 'house', 'mall', 'town', 'nairobi', 'river', 'with']);
function rateLookup(text){
  if (!RATE_WORDS.test(text)) return null;
  const hits = RATE_CARD.rates.filter((r) => r.to.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.length >= 4 && !RATE_SKIP.has(w) && new RegExp('\\b' + w + '\\b').test(text)));
  if (!hits.length) return null;
  const shown = hits.slice(0, 3);
  const lines = shown.map((r) => r.to + ': KES ' + money(r.kes) + ' (KES ' + money(rateWithVat(r.kes)) + ' with ' + RATE_CARD.vat + '% VAT)');
  return {
    reply:'Container trucking from the Nairobi ICD / CFS depots:\n' + lines.join('\n') + '\nThe final price is confirmed in your quote.' + (hits.length > shown.length ? '\nThere are ' + (hits.length - shown.length) + ' more matches on the rate card.' : ''),
    actions:[{label:'Request a truck to ' + shown[0].to, href:'#/quote/truck/' + encodeURIComponent(shown[0].to)}, {label:'See the rate card', href:'#/transport/rates'}]
  };
}

/* ---------- behaviour: search, VAT switch, route picker ---------- */
(function(){
  const redraw = () => { const t = $('#rateTable'), c = $('#rateCount'); if (t) t.innerHTML = rateTableHtml(); if (c) c.textContent = rateCountText(); };
  document.addEventListener('input', (e) => {
    if (e.target.id === 'rateSearch'){ rateState.q = e.target.value; redraw(); return; }
    const form = e.target.form;
    if (e.target.id === 't_to' && form && form.dataset.rateTo && e.target.value !== form.dataset.rateTo){   /* typed a different drop-off: the picked rate no longer applies */
      delete form.dataset.rateTo; form.elements.rateId.value = ''; $('#rateQuote').hidden = true;
    }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rate-vat]'); if (!b) return;
    rateState.vat = b.dataset.rateVat === '1';
    $$('[data-rate-vat]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    redraw();
  });
  document.addEventListener('change', (e) => {
    if (!e.target.matches || !e.target.matches('[data-rate-pick]')) return;
    const form = e.target.form, box = $('#rateQuote'), r = rateFind(e.target.value);
    if (!r){ delete form.dataset.rateTo; box.hidden = true; return; }
    form.elements.to.value = r.to; form.dataset.rateTo = r.to; form.elements.to.closest('.field').classList.remove('invalid');
    if (!form.elements.from.value.trim()) form.elements.from.value = 'Nairobi ICD / CFS depot';
    box.innerHTML = rateQuoteHtml(r.id); box.hidden = false;
  });
})();
