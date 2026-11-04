/* =========================================================
   KASH - js/app/submit.js
   Form checking and sending.
========================================================= */
'use strict';

/* ---------- form validation + submit ---------- */
const labelOf = (inp) => { const l = inp.closest('.field') && $('label', inp.closest('.field')); return l ? l.textContent.replace(/\*|\(required\)/g, '').trim() : 'this field'; };
const KE_PHONE = /^(?:\+?254|0)?[17]\d{8}$/;
const phoneOk = (v) => { const d = v.replace(/[\s\-().]/g, ''); return KE_PHONE.test(d) || /^\+\d{9,15}$/.test(d); };
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function validate(form){
  let bad = null;
  const fail = (inp, msg) => { const f = inp.closest('.field'); if (f){ f.classList.add('invalid'); const e = $('.err', f); if (e) e.textContent = msg; } if (!bad) bad = inp; };
  $$('.field', form).forEach((f) => f.classList.remove('invalid'));
  $$('input, textarea, select', form).forEach((inp) => {
    if (inp.type === 'hidden' || inp.type === 'checkbox' || inp.type === 'radio' || inp.closest('.hp')) return;
    const v = inp.value.trim(), name = labelOf(inp).toLowerCase();
    if (inp.required && v === ''){ fail(inp, inp.tagName === 'SELECT' ? 'Please choose ' + name + '.' : 'Please enter ' + name + '.'); return; }
    if (v === '') return;
    if (inp.type === 'tel' && !phoneOk(v)) fail(inp, 'That phone number looks incomplete. Use a Kenyan number like 0712 345 678 or +254 712 345 678.');
    else if (inp.type === 'email' && !emailOk(v)) fail(inp, 'That email address doesn\u2019t look right. Use the format name@example.com.');
    else if (inp.type === 'number' && inp.min !== '' && +v < +inp.min) fail(inp, 'Enter ' + inp.min + ' or more.');
    else if (inp.type === 'number' && inp.max !== '' && +v > +inp.max) fail(inp, 'Enter ' + inp.max + ' or fewer.');
    else if (inp.minLength > 0 && v.length < inp.minLength) fail(inp, 'Please write at least ' + inp.minLength + ' characters (you have ' + v.length + ').');
  });
  const inD = form.elements.checkin, outD = form.elements.checkout;
  if (!bad && inD && outD && inD.value && outD.value && outD.value <= inD.value) fail(outD, 'Check-out must be after check-in.');
  if (!bad && form.dataset.kind === 'ride' && form.elements.when && form.elements.when.value === 'later'){
    const t = form.elements.time, at = new Date(form.elements.date.value + 'T' + t.value);
    if (isNaN(at) || at.getTime() < Date.now() + 5 * 60000) fail(t, 'Choose a time from now onwards.');
  }
  if (form.dataset.kind === 'review'){
    if (!form.elements.rating.value){ const g = $('.rating-field', form); g.classList.add('invalid'); $('.err', g).textContent = 'Please tap a star to rate your experience.'; if (!bad) bad = $('.star-input input', form); }
    const c = form.elements.consent; if (c && !c.checked){ const g = c.closest('.field'); g.classList.add('invalid'); $('.err', g).textContent = 'Please tick this box so we may publish your review.'; if (!bad) bad = c; }
  }
  if (bad){ bad.focus(); const n = $('[data-notice]', form); if (n){ n.textContent = 'Please fix the highlighted fields below.'; n.classList.add('show'); } return false; }
  const n = $('[data-notice]', form); if (n) n.classList.remove('show');
  return true;
}
/* Clear a field's message as soon as the person starts correcting it. */
document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('.field.invalid'); if (f) f.classList.remove('invalid'); });
document.addEventListener('submit', async (e) => {
  const form = e.target; if (!form.dataset.kind) return;
  e.preventDefault();
  if (!validate(form)) return;
  if (form.dataset.kind === 'review') return submitReviewForm(form);
  const btn = $('button[type=submit]', form), label = btn.innerHTML;
  btn.disabled = true; btn.textContent = 'Sending...';
  const d = {}; new FormData(form).forEach((v, k) => { d[k] = v; });
  const first = esc((d.name || '').split(' ')[0]);
  const loc = d.lat && d.lng ? '\nMy location: ' + gmapPin(d.lat, d.lng) : '';
  let type = form.dataset.kind, title = 'Request received!', text, summary, subject;

  if (type === 'enquiry'){
    d.items = cart.map((i) => ({name:i.name, qty:i.qty, unit:i.unit, price:i.price}));
    d.estimatedTotal = cartTotal();
    summary = 'Hello KASH General Suppliers,\n\nName: ' + d.name + '\nPhone: ' + d.phone + '\nService: ' + d.service +
      (d.place ? '\nPlace: ' + d.place : '') + (d.date ? '\nDate: ' + d.date : '') +
      (d.items.length ? '\n\nQuote list:\n' + d.items.map((i) => '- ' + i.name + ' x' + i.qty).join('\n') : '') + '\n\n' + (d.msg || 'Please send me a quote.');
    subject = 'Quote request: ' + d.service;
    title = 'Thank you, ' + first + '!'; text = "We've received your request and will reply on " + esc(d.phone) + ' as soon as we can.';
  } else if (type === 'truck'){
    type = 'transport'; d.service = 'Transport & Logistics'; d.vehicle = 'KASH Truck';
    summary = 'Hello KASH,\n\nTruck request\nName: ' + d.name + '\nPhone: ' + d.phone + '\nFrom: ' + (d.from || '-') + '\nTo: ' + (d.to || '-') + '\nDate: ' + (d.date || '-') + '\n' + (d.details || '');
    const rate = rateFind(d.rateId); delete d.rateId;
    if (rate){
      d.rateDestination = rate.to; d.rateKes = rate.kes; d.rateWithVatKes = rateWithVat(rate.kes);
      summary += '\nRate card: ' + rate.to + ' KES ' + money(rate.kes) + ' + ' + RATE_CARD.vat + '% VAT = KES ' + money(rateWithVat(rate.kes)) + ' (a guide; please confirm)';
    }
    subject = 'Truck request';
    text = 'Thanks ' + first + ". We'll confirm the truck and the price on " + esc(d.phone) + '.';
  } else if (type === 'ride'){
    const mode = form.dataset.mode;
    type = 'ride'; d.mode = mode; d.vehicle = mode === 'tuktuk' ? 'Tuk-tuk' : 'Uber / cab'; d.service = 'Mobility & Ride Services';
    const pts = ridePoints(form);
    d.when = d.when === 'later' ? d.date + ' at ' + d.time : 'As soon as possible';
    if (d.when === 'As soon as possible'){ delete d.date; delete d.time; }
    if (pts.pickup){
      const km = roadKm(BASE(), pts.pickup);
      d.distanceFromBaseKm = +km.toFixed(1); d.etaMinutes = minsFor(km, mode, 2);
    }
    if (pts.pickup && pts.drop){
      const trip = roadKm(pts.pickup, pts.drop);
      d.tripDistanceKm = +trip.toFixed(1); d.tripMinutes = minsFor(trip, mode, 3); d.routeLink = gmapDir(pts.pickup, pts.drop);
    }
    summary = 'Hello KASH,\n\nRide request: ' + d.vehicle + '\nName: ' + d.name + '\nPhone: ' + d.phone + '\nPickup: ' + d.pickup + loc + '\nTo: ' + d.dropoff + (d.dropLat && d.dropLng ? '\nDrop-off pin: ' + gmapPin(d.dropLat, d.dropLng) : '') + (d.routeLink ? '\nRoute: ' + d.routeLink + ' (about ' + d.tripDistanceKm + ' km)' : '') + '\nWhen: ' + d.when + '\nPassengers: ' + d.passengers + (d.details ? '\nNotes: ' + d.details : '');
    subject = 'Ride request: ' + d.vehicle;
    text = 'Thanks ' + first + ". We have your " + (mode === 'tuktuk' ? 'tuk-tuk' : 'cab') + ' request:<br><b>' + esc(d.pickup) + '</b> to <b>' + esc(d.dropoff) + '</b>, ' + esc(d.when.charAt(0).toLowerCase() + d.when.slice(1)) + '.<br>We will confirm the driver and the price on ' + esc(d.phone) + ' before the trip.';
  } else if (type === 'delivery'){
    d.service = 'Transport & Logistics';
    summary = 'Hello KASH,\n\nDelivery request\nName: ' + d.name + '\nPhone: ' + d.phone + '\nPickup: ' + d.pickup + loc + '\nDeliver to: ' + d.dropoff + (d.dropLat && d.dropLng ? '\nDrop-off pin: ' + gmapPin(d.dropLat, d.dropLng) : '') + '\nReceiver: ' + (d.receiver || '-') + ' ' + (d.receiverPhone || '') + '\nItem: ' + d.size + '\n' + (d.details || '');
    subject = 'Delivery request';
    text = 'Thanks ' + first + ". A rider will be arranged and we'll confirm the price on " + esc(d.phone) + '.';
  } else {
    const p = PROPERTIES.find((x) => x.id === form.dataset.property);
    d.property = p.name; d.propertyLocation = p.location; d.nightlyRate = p.price;
    summary = 'Hello KASH,\n\nAvailability request for ' + p.name + '\nName: ' + d.name + '\nPhone: ' + d.phone + '\nCheck in: ' + d.checkin + '\nCheck out: ' + d.checkout + '\nGuests: ' + d.guests + '\n' + (d.details || '');
    subject = 'Availability: ' + p.name;
    text = 'Thanks ' + first + ". We'll confirm availability for " + esc(p.name) + ' on ' + esc(d.phone) + '.';
  }

  if (d.lat && d.lng) d.mapLink = gmapPin(d.lat, d.lng);
  if (d.dropLat && d.dropLng) d.dropMapLink = gmapPin(d.dropLat, d.dropLng);
  const res = await submitRequest(type, d);
  if (!res.ok){
    btn.disabled = false; btn.innerHTML = label;
    const n = $('[data-notice]', form); n.textContent = res.message || ("We couldn't send that just now. Please try again, or contact us directly" + (B.email ? ' at ' + B.email : '') + '.'); n.classList.add('show');
    return;
  }
  const html = successHtml({title, text, summary, mode:res.mode, subject});
  const wrap = form.closest('[data-form-wrap]');
  if (wrap){ wrap.innerHTML = html; wrap.scrollIntoView({behavior:'smooth', block:'center'}); if (type === 'enquiry'){ cart = []; saveCart(); } }
  else { $('#modal').innerHTML = '<button class="modal-x" data-close aria-label="Close">' + ico('close') + '</button>' + html; }
});
