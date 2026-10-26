/* =========================================================
   KASH - js/app/submit.js
   Form checking and sending.
========================================================= */
'use strict';

/* ---------- form validation + submit ---------- */
function validate(form){
  let bad = null;
  $$('.field', form).forEach((f) => f.classList.remove('invalid'));
  $$('input[required], textarea[required]', form).forEach((inp) => {
    let ok = inp.value.trim() !== '';
    if (ok && inp.type === 'tel') ok = inp.value.replace(/\D/g, '').length >= 9;
    if (!ok){ const f = inp.closest('.field'); f.classList.add('invalid'); if (inp.type === 'tel') $('.err', f).textContent = 'Please enter a valid phone number.'; if (!bad) bad = inp; }
  });
  const inD = form.elements.checkin, outD = form.elements.checkout;
  if (!bad && inD && outD && inD.value && outD.value && outD.value <= inD.value){
    const f = outD.closest('.field'); f.classList.add('invalid'); $('.err', f).textContent = 'Check-out must be after check-in.'; bad = outD;
  }
  const pk = form.elements.pickup;
  if (pk && pk.dataset && pk.dataset.need && !pk.value.trim()){ pk.closest('.field').classList.add('invalid'); if (!bad) bad = pk; }
  if (bad){ bad.focus(); const n = $('[data-notice]', form); if (n){ n.textContent = 'Please check the highlighted fields.'; n.classList.add('show'); } return false; }
  const n = $('[data-notice]', form); if (n) n.classList.remove('show');
  return true;
}
document.addEventListener('submit', async (e) => {
  const form = e.target; if (!form.dataset.kind) return;
  e.preventDefault();
  if (!validate(form)) return;
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
    subject = 'Truck request';
    text = 'Thanks ' + first + ". We'll confirm the truck and the price on " + esc(d.phone) + '.';
  } else if (type === 'ride'){
    const mode = form.dataset.mode;
    type = 'ride'; d.mode = mode; d.vehicle = mode === 'tuktuk' ? 'Tuk-tuk' : 'Uber / cab'; d.service = 'Mobility & Ride Services';
    if (d.lat && d.lng){
      const km = distKm(BASE(), {lat:+d.lat, lng:+d.lng});
      d.distanceFromBaseKm = +km.toFixed(1); d.etaMinutes = Math.max(2, Math.round(km * 1.35 / RIDE_SPEED[mode] * 60)); d.mapLink = gmapPin(d.lat, d.lng);
    }
    summary = 'Hello KASH,\n\nRide request: ' + d.vehicle + '\nName: ' + d.name + '\nPhone: ' + d.phone + '\nPickup: ' + d.pickup + loc + '\nTo: ' + (d.dropoff || '-') + '\nWhen: ' + (d.date || 'as soon as possible') + ' ' + (d.time || '') + '\nPassengers: ' + d.passengers;
    subject = 'Ride request: ' + d.vehicle;
    text = 'Thanks ' + first + ". We'll confirm your " + (mode === 'tuktuk' ? 'tuk-tuk' : 'cab') + ' and the price on ' + esc(d.phone) + '.';
  } else if (type === 'delivery'){
    d.service = 'Transport & Logistics';
    summary = 'Hello KASH,\n\nDelivery request\nName: ' + d.name + '\nPhone: ' + d.phone + '\nPickup: ' + d.pickup + loc + '\nDeliver to: ' + d.dropoff + '\nReceiver: ' + (d.receiver || '-') + ' ' + (d.receiverPhone || '') + '\nItem: ' + d.size + '\n' + (d.details || '');
    subject = 'Delivery request';
    text = 'Thanks ' + first + ". A rider will be arranged and we'll confirm the price on " + esc(d.phone) + '.';
  } else {
    const p = PROPERTIES.find((x) => x.id === form.dataset.property);
    d.property = p.name; d.propertyLocation = p.location; d.nightlyRate = p.price;
    summary = 'Hello KASH,\n\nAvailability request for ' + p.name + '\nName: ' + d.name + '\nPhone: ' + d.phone + '\nCheck in: ' + d.checkin + '\nCheck out: ' + d.checkout + '\nGuests: ' + d.guests + '\n' + (d.details || '');
    subject = 'Availability: ' + p.name;
    text = 'Thanks ' + first + ". We'll confirm availability for " + esc(p.name) + ' on ' + esc(d.phone) + '.';
  }

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
